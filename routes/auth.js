const express = require('express');
const {check , body }= require('express-validator/check');

const User = require('../models/user');

const router = express.Router();

const authController = require('../controllers/auth');

router.get('/login', authController.getLogin);

router.get('/signup',authController.getSignup);

router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.'),
    body('password', 'Password has to be valid.')
        .isLength({ min: 5 })
        .isAlphanumeric()

],
    authController.postLogin);

router.post('/logout', authController.postLogout);

router.post('/signup', [check('email' ,'Please Enter a valid E-mail')
    .isEmail()
        .custom((value, {req})=>{
            return User.findOne({email: value})
                .then(userdoc=>{
                    if(userdoc){
                        return Promise.reject('E-mail exists already, please pick a different one.');
                    }
                })
        }),
    body('password', 'Please enter a password with only numbers and text and at least 5 characters')
        .isLength({min: 5})
        .isAlphanumeric(),
    body('confirmPassword')
        .custom((value , {req})=>{
        if(value !== req.body.password){
            throw new Error('Password have to match!')
        }
        return true;
    })
    ]
    , authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset',authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;