const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');
const stripe = require('stripe')('sk_test_tJ8jtlDDXTNllkiSLoxI7C5N008UXpiUM4');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems ;
    Product.find()
        .countDocuments()
        .then(numProducts =>{
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1 ) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Products',
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems /ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: 'Product Detail',
                path: '/products',
                isAuthenticated : req.session.isLoggedIn
            });

        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems ;
    Product.find()
        .countDocuments()
        .then(numProducts =>{
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1 ) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems /ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};
//
exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products
            });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    Product.findById(productId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    req.user.postCartDeleteProduct(prodId)

        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckout = (req, res, next)=>{
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user=>{
            const products = user.cart.items;
            let total = 0;
            products.forEach(p=>{
                total += p.quantity * p.productId.price;
            });
            res.render('shop/checkout',{
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalSum: total
            });
        })
};
//
exports.postOrder = (req, res, next) => {
    // Token is created using Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const token = req.body.stripeToken; // Using Express
    let totalSum = 0;
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            user.cart.items.forEach(p=>{
                totalSum += p.quantity + p.productId.price;
            });

            const product = user.cart.items.map(i => {
                return {quantity: i.quantity, product: {...i.productId._doc}}
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: product
            });
            return order.save();
        })
        .then(result => {
            const charge = stripe.charges.create({
                amount: totalSum * 100,
                currency:'usd',
                description: 'Demo charge',
                source: token,
                metadata: { order_id: result._id.toString() }
            });
            req.user.clearCart();
        }).then(resi => {
        res.redirect('/orders');
    })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
//
exports.getOrders = (req, res, next) => {
    Order.find({'user.userId': req.user._id})
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Your Orders',
                path: '/orders',
                orders: orders
            })
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};

exports.getInovice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId).then(order=>{
        if(!order){
            return next(new Error('No order found.'));
        }
        if(order.user.userId.toString() !== req.user._id.toString()){
            return next(new Error('Unauthorized!'));
        }
        const invoiceName = 'invoice-'+ orderId+'.pdf';
        const invoicePath = path.join('data','invoices',invoiceName);
        const pdfDoc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.set('Content-Disposition', 'inline; filename="'+invoiceName+'"');

        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Invoice', {
            underline: true
        });
        pdfDoc.text('---------------------');
        let totalPrice = 0;
        order.products.forEach(prod =>{
            totalPrice +=  prod.quantity * prod.product.price;
           pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$'+ prod.product.price);
        });
        pdfDoc.text('----------------------');
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

        pdfDoc.end();
        // fs.readFile(invoicePath, (err, data)=>{
        //     if(err){
        //         return next(err);
        //     }

            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Deposition', 'inline; filename="'+invoiceName+'"');
            // res.end(data);
            // res.download(invoicePath, function (err) {
            //     if (err) {
            //         console.log("Error");
            //         console.log(err);
            //     } else {
            //         console.log("Success");
            //     }
            // });
            // res.writeHead(200, {
            //     'Content-Type': 'application/pdf',
            //     'Content-Disposition': 'inline; filename=some_file.pdf',
            //     'Content-Length': data.length
            // });
            // res.end(data);
            // const file = fs.createReadStream(invoicePath);
            //
            // file.pipe(res);

    }).catch(err=>console.log(err));



};












