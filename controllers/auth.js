const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.getLogin = (req, res , next)=>{
    //const isLoggedIn= req.get('Cookie').split(';')[1].trim().split('=')[1]=== 'true';
    console.log(req.session.isLoggedIn);
    res.render('auth/login',{
       path: '/login',
        pageTitle: 'Login',
        isAuthenticated : false
    });
};

exports.getSignup = (req , res, next)=>{
    res.render('auth/signup',{
        path: 'signup',
        pageTitle: 'Signup',
        isAuthenticated: false
    });
};

exports.postLogin = (req , res , next)=>{
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email:email})
        .then(user => {
            if(!user){
                return res.redirect('/login');
            }
            bcrypt.compare(password, user.password)
                .then(doMatch=>{
                    if(doMatch){
                        req.session.isLoggedIn = true;
                        req.session.user = user;

                        return req.session.save(err=>{
                            console.log('it is on line 37 in controllers-auth :', err);
                            res.redirect('/');
                        });
                    }
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
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({email:email})
        .then(userDoc=>{
            if(userDoc){
                return res.redirect('/signup');
            }
            return bcrypt.hash(password,12)
                .then(hashedPassword=>{
                    const user = new User(
                        {
                            email: email,
                            password: hashedPassword,
                            cart:{ items: []}
                        }
                    );
                    return user.save();
                })
                .then(result=>{
                    console.log('New User Created : line 72 in auth(controllers)');
                    res.redirect('/login');
                })
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
