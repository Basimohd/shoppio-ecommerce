const express = require("express");
const user_route=express();
const userController=require("../controllers/userController")

user_route.set('views', './views/user')

const auth = require('../middleware/userAuth')

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

//User Register(OTP inc)
user_route.get('/register/getOtp',auth.isLogout,userController.loadgetOtp);
user_route.get('/register/verifyOtp',auth.isLogout,userController.loadverifyOtp);
user_route.post('/register/verifyOtp',userController.regVerifyOtp);
user_route.post('/register/getOtp',userController.regGetMobNo);
user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);

//account details
user_route.get('/address',auth.isLogin,userController.addressLoad);
user_route.get('/userProfile',auth.isLogin,userController.profileLoad);
user_route.get('/addAddress',auth.isLogin,userController.loadAddAddress);
user_route.get('/editAddress',auth.isLogin,userController.editAddress);
user_route.get('/editProfile',auth.isLogin,userController.editProfileLoad);
user_route.get('/changePass',auth.isLogin,userController.changePassLoad);
user_route.post('/changePass',auth.isLogin,userController.changePass);
user_route.get('/deleteAddress',auth.isLogin,userController.deleteAddress);
user_route.post('/addAddress',userController.insertOrEditAddress);
user_route.post('/editAddress',userController.insertOrEditAddress);
user_route.post('/editProfile',userController.insertEditedProfile);

//User Products
user_route.get('/shop',userController.loadCatalog)
user_route.get('/product',userController.loadProduct)
user_route.post('/filterProduct',userController.filterProduct)
user_route.post('/product',userController.saveReview)

//Whishlist
user_route.get('/wishlist',userController.loadWishlist)
user_route.get('/addWishlist',auth.isLogin,userController.insertWishlist)
user_route.get('/deleteWishlist',userController.deleteWishlist)
user_route.get('/addCartWishlist',userController.insertCartWishlist)

//Cart
user_route.get('/cart',userController.loadCart)
user_route.post('/changeQuantity',userController.changeQuantity)
user_route.get('/addCart',userController.insertCart)
user_route.get('/deleteCart',userController.deleteCart)
user_route.post('/applyCoupon',userController.applyCoupon)

//Checkout
user_route.get('/checkout',auth.isLogin,userController.checkout)
user_route.post('/checkout',auth.isLogin,userController.insertOrderDetails)
user_route.post('/verifyPayment',auth.isLogin,userController.verifyPayment)
user_route.get('/orderConfirm',auth.isLogin,userController.orderConfirm)

//orders
user_route.get('/orders',auth.isLogin,userController.loadOrders) 
user_route.get('/orderTrack',auth.isLogin,userController.loadOrderTrack) 
user_route.get('/cancelOrder',auth.isLogin,userController.cancelOrder) 



module.exports=user_route;
