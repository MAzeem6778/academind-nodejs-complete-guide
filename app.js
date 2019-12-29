const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const errorController = require('./controllers/error');
// const mongoConnect = require('./util/database').mongoConnect;
const mongoose = require('mongoose');
const User = require('./models/user');


const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findById('5e088119619d9c8f00a66054')
        .then(user => {
            req.user = user;
            next();
        }).catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);


mongoose.connect('mongodb+srv://Azeem:root@cluster0-7i4yw.mongodb.net/shop?retryWrites=true&w=majority', {useUnifiedTopology: true, useNewUrlParser: true})
    .then(result => {
        User.findOne().then(user=>{
            if(!user){
                const user = new User({
                    name: 'Hafeez',
                    email: 'Hafeez@12.gamil.com',
                    cart:{
                        items: []
                    }
                });
                user.save();
            }
        });
        app.listen(process.env.PORT);
    }).catch(err => console.log(err));


// mongoConnect( ()=>{
//    app.listen(3000);
// });
