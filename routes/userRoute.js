const express = require("express");
const user_route=express();
const userController=require("../controllers/userController")

user_route.set('views', './views/user')

const auth = require('../middleware/userAuth')
const errorHandler = require('../middleware/errorHandler');

//User Login(OTP inc)
user_route.get('/home',userController.loadHome)
user_route.get('/',userController.loadHome)
user_route.get('/login',auth.isLogout,userController.loadLogin);
user_route.get('/logout',userController.logOut);
user_route.post('/login',userController.verifyLogin);
user_route.get('/getOtp',auth.isLogout,userController.loadgetOtp);
user_route.get('/verifyOtp',auth.isLogout,userController.loadverifyOtp);
user_route.post('/getOtp',userController.getOtp)
user_route.post('/verifyOtp',userController.verifyOtp)
user_route.post('/newsLetter',userController.handleSubscribeForm)

//User Register(OTP inc)
user_route.get('/register/getOtp',auth.isLogout,userController.loadgetOtp);
user_route.get('/register/verifyOtp',auth.isLogout,userController.loadverifyOtp);
user_route.post('/register/verifyOtp',userController.regVerifyOtp);
user_route.post('/register/getOtp',userController.regGetMobNo);
user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);

//account details
user_route.get('/address',auth.isBlocked,auth.isLogin,userController.addressLoad);
user_route.get('/userProfile',auth.isBlocked,auth.isLogin,userController.profileLoad);
user_route.get('/addAddress',auth.isBlocked,auth.isLogin,userController.loadAddAddress);
user_route.get('/editAddress',auth.isBlocked,auth.isLogin,userController.editAddress);
user_route.get('/editProfile',auth.isBlocked,auth.isLogin,userController.editProfileLoad);
user_route.get('/changePass',auth.isBlocked,auth.isLogin,userController.changePassLoad);
user_route.post('/changePass',auth.isBlocked,auth.isLogin,userController.changePass);
user_route.get('/deleteAddress',auth.isBlocked,auth.isLogin,userController.deleteAddress);
user_route.post('/addAddress',auth.isBlocked,userController.insertOrEditAddress);
user_route.post('/editAddress',auth.isBlocked,userController.insertOrEditAddress);
user_route.post('/editProfile',auth.isBlocked,userController.insertEditedProfile);

//User Products
user_route.get('/shop',userController.loadCatalog)
user_route.get('/product',userController.loadProduct)
user_route.post('/filterProduct',userController.filterProduct)
user_route.post('/shop',userController.saveReview)

//Whishlist
user_route.get('/wishlist',userController.loadWishlist)
user_route.get('/addWishlist',auth.isBlocked,auth.isLogin,userController.insertWishlist)
user_route.get('/deleteWishlist',auth.isBlocked,userController.deleteWishlist)
user_route.get('/addCartWishlist',auth.isBlocked,userController.insertCartWishlist)

//Cart
user_route.get('/cart',auth.isBlocked,userController.loadCart)
user_route.post('/changeQuantity',userController.changeQuantity)
user_route.get('/addCart',auth.isBlocked,auth.isLogin,userController.insertCart)
user_route.get('/deleteCart',auth.isBlocked,userController.deleteCart)
user_route.post('/applyCoupon',auth.isBlocked,userController.applyCoupon)

//Checkout
user_route.get('/checkout',auth.isBlocked,auth.isLogin,userController.checkout)
user_route.post('/checkout',auth.isBlocked,auth.isLogin,userController.insertOrderDetails)
user_route.post('/verifyPayment',auth.isBlocked,auth.isLogin,userController.verifyPayment)
user_route.get('/orderConfirm',auth.isBlocked,auth.isLogin,userController.orderConfirm)

//orders
user_route.get('/orders',auth.isBlocked,auth.isLogin,userController.loadOrders) 
user_route.get('/orderTrack',auth.isBlocked,auth.isLogin,userController.loadOrderTrack) 
user_route.get('/cancelOrder',auth.isBlocked,auth.isLogin,userController.cancelOrder) 
user_route.post('/returnRequest',auth.isBlocked,auth.isLogin,userController.requestReturn) 

user_route.use(errorHandler.errorHandler);


module.exports=user_route;
