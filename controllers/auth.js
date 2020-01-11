const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
});

exports.getLogin = (req, res , next) => {
    let message = req.flash('error');
    if(message.length>0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/login',{
       path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        oldInput:{
           email: '',
            password:''
        },
        validationErrors: []
    });
};

exports.getSignup = (req , res, next) => {
    let message = req.flash('error');
    if(message.length>0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/signup',{
        path: 'signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: {
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: []
    });
};

exports.postLogin = (req , res , next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('auth/login',{
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({email:email})
        .then(user => {
            if(!user){
                return res.status(422).render('auth/login',{
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email!',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }
            bcrypt.compare(password, user.password)
                .then(doMatch=>{
                    if(doMatch){
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        // console.log(req.session.user);
                        // console.log(req.session.isLoggedIn);
                        return req.session.save(err=>{
                            console.log('it is on line 95 in controllers-auth :', err);
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login',{
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Invalid password!',
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: []
                    });
                })
                .catch(err=> {
                    console.log('this is from 115 line in controlers auth error:',err);
                    res.redirect('/login');
                });
        })
        .catch(err => console.log('this is from 115 line in controlers-auth error :',err));
};

exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    const errors = validationResult(req);

    console.log(errors.array());
    if(!errors.isEmpty()){
       return res.status(422).render('auth/signup',{
           path: '/singup',
           pageTitle: 'Signup',
           errorMessage: errors.array()[0].msg,
           oldInput: {
               name: name,
               email: email,
               password: password,
               confirmPassword: confirmPassword
           },
           validationErrors: errors.array()
       });
    }

     bcrypt.hash(password,12)
                .then(hashedPassword=>{
                    const user = new User(
                        {
                            name: name,
                            email: email,
                            password: hashedPassword,
                            cart:{ items: []}
                        }
                    );
                    return user.save();
                })
                .then(result=>{
                    res.redirect('/login');
                        transporter.sendMail({
                            to: email,
                            from: 'gct.175149@gmail.com',
                            subject: 'Signup succeeded!',
                            html: '<h1>You successfully signed up!</h1>'
                        });

                })
         .catch(err => {
             console.log(err);
             const error = new Error(err);
             error.httpStatusCode = 500;
             return next(error);
         });

};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err=>{
        console.log(err);
        res.redirect('/');
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if(message.length>0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/reset',{
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32,(err, buffer)=>{
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email}).then(user=>{
            if(!user){
                req.flash('error', 'No account with that email found!');
                res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
            .then(result =>{
                res.redirect('/');
                transporter.sendMail({
                    to : req.body.email,
                    from : 'gct.175149@gmail.com',
                    subject : 'Password Reset',
                    html : `
                    <p>You are requested a password reset</p>
                    <p><a href="http://localhost:3000/reset/${token}">Click this</a></p>
                    `
                });
            })
            .catch(err => {
                console.log(err);
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now() } })
        .then(user=>{

            let message = req.flash('error');
            if(message.length>0){
                message= message[0];
            }else{
                message = null;
            }
            res.render('auth/new-password',{
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });

        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser ;
    User.findOne({resetToken:passwordToken, resetTokenExpiration:{$gt: Date.now()},_id: userId})
        .then(user=>{
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword=>{
            resetUser.password = hashedPassword;
            resetUser.resetToken = null;
            resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result=>{
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};