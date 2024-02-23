const router = require("express").Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserService = require('../service/UserService');
const AccountService = require('../service/AccountService');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const db = require("../db");

router.get('/signup', (req, res) => {
    res.render('signup', req.flash());
});

router.post('/signup', async (req, res) => {
    try {
        validateUser(req.body);
        prepareUser(req.body);
    } catch(err) {
        console.log("error: " + err.message);
        req.flash("error", err.message);
        req.flash("user", req.body);
        return res.redirect("/signup");
    }

    // Hash password
    const saltRounds = 10;
    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        const user = await UserService.findByEmail(req.body.email);

        if(user) {
            req.flash("error", "Email already in use");
            req.flash("user", req.body);
            return res.redirect("/signup");
        }

        req.body.password = hash;
        await UserService.save(req.body);

        console.log(JSON.stringify(user));
        
        // Redirect to login page
        req.flash("info", "Signup success");
        res.redirect('/login');
    });
});

router.get('/login', async (req, res) => {
    res.render('login', {...req.flash(), ...req.query});
});

passport.use(new LocalStrategy({passwordField: "password", usernameField: "email"}, async (email, password, done) => {
    console.log("trying to authenticate " + email);
    const users = await UserService.findByEmail(email);

    if(users && (users.length > 1 || users.length < 1)) throw new Error(`get users with email: ${email} found users: ${users.length}`);

    const user = users[0];

    if(!user) return done(null, false, {message: "Incorrect email or password"})

    const hash = user.password;

    bcrypt.compare(password, hash).then((value) => {
        if(value) return done(null, user);
        else return done(null, false, { message: 'Incorrect email or password.' });
    });
}));

passport.serializeUser((user, done) => {
    done(null, JSON.stringify(user));
});

passport.deserializeUser((user, done) => {
    done(null, JSON.parse(user));
});

router.post('/login', (req, res, next) => {
    console.log("authenticating " + req.body.email);
    passport.authenticate('local', function(err, user, info, status) {
        console.log("ERR: " + JSON.stringify(info));
        if (!user) {
            req.flash("error", info?.message);
            req.flash("user", req.body);

            return res.redirect("/login");
        }

        req.login(user, (err) => {
            if(err) next(err);
            res.redirect("/home");
        })
    })(req, res, next);
});

router.get("/logout", (req, res, next) => {
    if (req.isAuthenticated()) {
        req.logout((err) => {
            if(err) return next(err);
            req.flash("info", "Logged out successfully");
            res.redirect("/login?logout");
        });
    }
    else res.redirect("/login");
});

router.get('/profile', async (req, res) => {
    if (req.isAuthenticated()) {
        req.user.accountCount = await AccountService.count({"user_id": req.user.id});

        console.log(req.query);

        if("erase" in req.query && "confirmed" in req.query) {
            const result = await AccountService.deleteAll();

            if(result) {
                req.flash("info", "Erase successfully");
                return res.redirect("/profile");
            }
            else {
                req.flash("error", "Erase failed");
            }
        }

        if("close" in req.query && "confirmed" in req.query) {
            await UserService.delete(req.user.id);
            req.logout((err) => {
                if(err) return next(err);
                req.flash("warn", "Your account has closed");
                res.redirect("/login");
            });
            req.user = undefined;
            return;
        }

        if("export" in req.query) {
            const userData = {
                user: req.user,
                accounts: await AccountService.find({fields: {"user_id": req.user.id}}),
                accountCount: await AccountService.count({fields: {"user_id": req.user.id}})
            };

            res.setHeader('Content-disposition', 'attachment; filename= data.json');
            res.setHeader('Content-type', 'application/json');
            return res.write(JSON.stringify(userData), function (err) {
                    res.end();
                });
        } 

        // console.log(req.flash());

        res.render('profile', { user: req.user , ...req.flash(), query: req.query});
    } else {
        res.redirect('/login');
    }
});

router.post("/profile/change-password", async(req, res) => {
    try{
        if(!req.body.currentPassword) throw new Error("Password is required");
        if(!req.body.newPassword || !req.body.confirmPassword) throw new Error("New password is required");
        if(req.body.newPassword !== req.body.confirmPassword) throw new Error("Passwords does not match");
    
        const matches = bcrypt.compareSync(req.body.currentPassword, req.user.password);
    
        if(!matches) throw new Error("Invalid Password");

        validatePassword(req.body.newPassword);

        req.user.password = await bcrypt.hash(req.body.newPassword, 10);

        await UserService.save(req.user);

        req.logout((err) => {
            if(err) return next(err);
            req.flash("info", "Password changed successfully");
            res.redirect("/login");
        });
    } catch(err) {
        req.flash("error", err.message);
        req.flash("bodyWithError", req.body);
        return res.redirect("/profile?changePassword");
    }
});


function validateUser(user) {
    console.log("validating: " + JSON.stringify(user));
    if(!user) throw new Error("User can not be empty");
    if(!user.email) throw new Error("Email can not be empty");

    if(user.password !== user.confirmPassword) throw new Error("Passwords are not matched");

    validatePassword(user.password);
}

function validatePassword(password) {
    if(!password) throw new Error("Password can not be empty");

    if(password.length < 6) throw new Error("Weak password (length:"+password.length+", min: 6)");
}

function prepareUser(user) {
    delete user.confirmPassword;
}

module.exports = router;