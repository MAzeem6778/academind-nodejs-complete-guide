const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');


const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));


exports.getLogin = (req, res , next)=>{
    let message = req.flash('error');
    if(message.length>0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/login',{
       path: '/login',
        pageTitle: 'Login',
        errorMessage: message
    });
};

exports.getSignup = (req , res, next)=>{
    let message = req.flash('error');
    if(message.length>0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/signup',{
        path: 'signup',
        pageTitle: 'Signup',
        errorMessage: message
    });
};

exports.postLogin = (req , res , next)=>{
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email:email})
        .then(user => {
            if(!user){
                req.flash('error','Invalid email!');
                return res.redirect('/login');
            }
            bcrypt.compare(password, user.password)
                .then(doMatch=>{
                    if(doMatch){
                        req.session.isLoggedIn = true;
                        req.session.user = user;

                        return req.session.save(err=>{
                            console.log('it is on line 43 in controllers-auth :', err);
                            res.redirect('/');
                        });
                    }
                    req.flash('error','Invalid Password!');
                    res.redirect('/login');
                })
                .catch(err=> {
                    console.log('this is from 44 line in controlers auth :',err);
                    res.redirect('/login');
                });
        })
        .catch(err => console.log('this is from 48 line in controlers auth :',err));
};

exports.postSignup = (req, res, next)=>{
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if(password !== confirmPassword){
        req.flash('error', 'Password don"t match');
        return res.redirect('/signup');
    }

    User.findOne({email:email})
        .then(userDoc=>{
            if(userDoc){
                req.flash('error', 'E-mail already Exists!, please pick a different One!');
                return res.redirect('/signup');
            }
            return bcrypt.hash(password,12)
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
                    console.log('New User Created : line 72 in auth(controllers)');
                        transporter.sendMail({
                            to: email,
                            from: 'shop@node-complete.com',
                            subject: 'Signup succeeded!',
                            html: '<h1>You successfully signed up!</h1>'
                        });

                })
                .catch(err => console.log(err));
        })
        .catch(err=>{
            console.log('line 77 in auth(controlers)',err);
        });


};

exports.postLogout = (req, res, next)=>{
    req.session.destroy(err=>{
        console.log(err);
        res.redirect('/');
    });
};
