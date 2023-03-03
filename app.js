// Import dependencies
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const pug = require('pug');

// FIREBASE
const firebase = require("firebase-admin");

var serviceAccount = require("./adminsdk.json");

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

const UserService = require('./service/UserService');
const AccountService = require("./service/AccountService");

// Initialize Express app
const app = express();

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
    if(req.isAuthenticated()) res.redirect('main');
    else res.redirect("/login");
});

const authController = require("./controllers/AuthController");

app.use(authController);

app.get('/main', async (req, res) => {
    if (req.isAuthenticated()) {
        const initialUserPath = `${UserService.fieldPath()}/${req.user.id}`;

        const params = {user: req.user, query: req.query, ...req.flash()}

        const search = req.query.search;

        const accountList = await AccountService.find({}, initialUserPath);
        params.accounts = accountList;

        console.log(accountList);

        let filteredList = [];
        if("search" in req.query) {
            filteredList = accountList.filter(a => 
                a.name.includes(search)
                || a.url?.includes(search)
                || a.email?.includes(search)
                || a.username?.includes(search)
                || a.phone?.includes(search)
                || a.password?.includes(search)
            );
            params.filteredAccounts = filteredList;
        }
        

        if(req.query.delete) {
            if(req.query.confirmed) {
                const result = await AccountService.delete(req.query.delete, initialUserPath);

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

            const account = accountList.filter(a => a.id === req.query.delete).pop();

            params.toDelete = account;
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
    const result = await AccountService.save(req.body, `${UserService.fieldPath()}/${req.user.id}`)

    req.flash("info", "Account "+ result.name +" created successfully");
    req.flash("createdAccount", result);

    res.redirect("/main");
});

app.route("/accounts/:id").post(async (req, res) => {
    req.body.id = req.params.id;
    const result = await AccountService.save(req.body, `${UserService.fieldPath()}/${req.user.id}`)

    req.flash("info", "Account "+ result.name +" edit succeeded");
    req.flash("editedAccount", result);

    res.redirect("/main");
});


app.use((err, req, res, next) => {
    res.send("Error: " + err.message);
});

// Start server
const port = 8080;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
