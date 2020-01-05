const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);// closure call
const csrf = require('csurf');
const flash = require('connect-flash');
mongoose.Promise = global.Promise;

const User = require('./models/user');

const errorController = require('./controllers/error');

const MONGODB_URI = 'mongodb+srv://Azeem:root@cluster0-7i4yw.mongodb.net/shop';

const app = express();

require('dotenv').config();

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'session'
});
const csrfProtection = csrf();

const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store}));
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    if (req.session.isLoggedIn)
        res.locals.userName = req.session.user.name;
    res.locals.csrfToken = req.csrfToken();
    next();
});


app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if(!user) {
                return next();
            }
            req.user = user;
            next();
        }).catch(err => {
            next(new Error(err));
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next)=>{
    // res.status(error.httpStatusCode).render(...);
   // res.redirect('/500');
    res.status(500).
    render('500', {
        pageTitle: 'Error',
        path: '/500',
        isAuthenticated : req.session.isLoggedIn
    });
});


mongoose.connect(MONGODB_URI, {useUnifiedTopology: true, useNewUrlParser: true})
    .then(result => {
        console.log(`MongoDB Connected ${result}`);
        app.listen(port, () => {
            console.log(`Server is running on ${port}`);
        });
    }).catch(err => console.log(err));


// SESSION LINK BELLOW
//https://machinesaredigging.com/2013/10/29/how-does-a-web-session-work/
