const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
    console.log('ii');
    Product.find()
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products'
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    // const product = Product.findById(prodId);
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
        });
};

exports.getIndex = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
            });
        })
        .catch(err => {
            console.log(err);
        });

};
//now you can start
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
        .catch(err => console.log(err));
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
        });
    // let fetchedCart;
    // let newQuantity=1;
    // req.user.getCart().then(cart=>{
    //     fetchedCart = cart;
    //     return cart.getProducts({where:{id:productId}});
    // }).then(products=>{
    //     let product;
    //     if(products.length>0){
    //         product= products[0];
    //     }
    //
    //     if(product){
    //         //if the product is already exits.. increment it;
    //         let oldQuantity = product.cartItem.quantity;
    //         newQuantity = oldQuantity + 1;
    //         return product;
    //     }
    //     return Product.findByPk(productId);
    //
    // }).then(product=>{
    //     return fetchedCart.addProduct(product,{through: {quantity: newQuantity}});
    // })
    //     .then(()=>{
    //     res.redirect('/cart');
    // })
    //     .catch(err=>console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    req.user.postCartDeleteProduct(prodId)

        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};
//
exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const product = user.cart.items.map(i => {
                return {quantity: i.quantity, product: {...i.productId._doc}}
            });
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products: product
            });
            return order.save();
        })
        .then(result => {
            req.user.clearCart();
        }).then(resi => {
        res.redirect('/orders');
    })
        .catch(err => console.log(err));
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
        .catch(err => console.log(err));

};
//

// exports.getCart= (req, res, next)=>{
//
//     req.user.getCart().then(cart=>{
//         cart.getProducts().then(products=>{
//             res.render('shop/cart',{
//                              path: '/cart',
//                              pageTitle: 'Your Cart',
//                              products : products
//                          });
//         }).catch(err=>console.log(err));
//     }).catch(err=>console.log(err));
// };











