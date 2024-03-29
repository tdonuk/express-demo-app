// Import dependencies
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const pug = require('pug');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
        scriptSrc: ["'self'", "'https://cdn.jsdelivr.net'"],
        "script-src-attr": ["'none'", "'unsafe-inline'"]
    },
});

const rateLimiter = rateLimit({
    windowMs: 1*60*1000,
    max: 60
});

const AccountService = require("./service/AccountService");

// Initialize Express app
const app = express();

app.use(helmet());
app.use(rateLimiter);

// Set up body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(flash());

const env = require("./env.json");

// Set up session middleware
app.use(session({
    secret: env?.secret || 'verySecret',
    cookie: {_expires: 3600000}, //1 hour
    resave: false,
    rolling: true,
    saveUninitialized: true
}));

// Initialize passport middleware
app.use(passport.initialize());
app.use(passport.session());

// view engine
app.set('view engine', 'pug');
app.use(express.static("public"));

// Set up routes
app.get('/', (req, res) => {
    if(req.isAuthenticated()) res.redirect('home');
    else res.redirect("/login");
});

const authController = require("./controllers/AuthController");

app.use(authController);

app.get('/home', async (req, res) => {
    if (req.isAuthenticated()) {
        const params = {user: req.user, query: req.query, ...req.flash()}

        const search = req.query?.search?.toLowerCase();

        const accountList = await AccountService.find({fields: {"user_id": req.user.id}});

        params.accounts = accountList || [];

        console.log(accountList);

        let filteredList = [];
        if("search" in req.query) {
            filteredList = accountList.filter(a => 
                a.name.toLowerCase().includes(search)
                || a.url?.toLowerCase().includes(search)
                || a.email?.toLowerCase().includes(search)
                || a.username?.toLowerCase().includes(search)
                || a.phone?.toLowerCase().includes(search)
                || a.password?.toLowerCase().includes(search)
            );
            params.filteredAccounts = filteredList;
        }
        

        if(req.query.delete) {
            if(req.query.confirmed) {
                const result = await AccountService.delete(req.query.delete);

                console.log(result);

                if(result) {  
                    const account = accountList.filter(a => a.id === req.query.delete).pop();

                    const index = accountList.indexOf(account);

                    accountList.splice(index, 1);

                    params.accountList = accountList;
                    params.info = `Account with name '${account.name}' has deleted successfully`;

                    return res.render("main",  params);
                }
            }

            params.toDelete = accountList.filter(a => a.id === req.query.delete).pop();
        }

        if(req.query.edit) {
            const accountToEdit = accountList.filter(a => a.id === req.query.edit).pop();

            console.log("ACCOUNT TO EDIT: " + accountToEdit.name);

            params.accountToEdit = accountToEdit;

            return res.render("main", params);
        }

        return res.render("main", params);

    } else {
        res.redirect('/login');
    }
});

app.post("/accounts", async (req, res) => {
    req.body.user_id = req.user.id;
    const result = await AccountService.save(req.body);

    req.flash("info", "Account "+ result.name +" created successfully");
    req.flash("createdAccount", result);

    res.redirect("/home");
});

app.route("/accounts/:id").post(async (req, res) => {
    req.body.id = req.params.id;
    const result = await AccountService.save(req.body);

    req.flash("info", "Account "+ result.name +" edit succeeded");
    req.flash("editedAccount", result);

    res.redirect("/home");
});


app.use((err, req, res, next) => {
    res.send("Error: " + err.message);
});

// Start server
const port = 8080;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
