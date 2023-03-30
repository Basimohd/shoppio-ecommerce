const express = require("express");
const admin_route=express();
const adminController=require("../controllers/adminController")
const session=require('express-session')
const multerConfig=require('../config/multer')
const upload=multerConfig.upload;

const adminAuth = require('../middleware/adminAuth')

admin_route.set('views', './views/admin')

// Login 
admin_route.get('/login',adminAuth.isLogout,adminController.loadLogin)
admin_route.get('/logout',adminController.logoutAdmin)
admin_route.post('/login',adminController.verifyLogin)

//Dashboard
admin_route.get('/home',adminAuth.isLogin,adminController.loadDashoard)
admin_route.get('/graphDetails',adminController.graphDetails)


//User Details
admin_route.get('/users',adminAuth.isLogin,adminController.loadUserDetails)
admin_route.get('/updateStatus',adminAuth.isLogin,adminController.updateUserStatus)

//Category Details
admin_route.get('/categories',adminAuth.isLogin,adminController.loadCategories);
admin_route.get('/addCategory',adminAuth.isLogin,adminController.loadAddCategory);
admin_route.get('/editCategory',adminAuth.isLogin,adminController.loadEditCategory);
admin_route.get('/disableCategory',adminAuth.isLogin,adminController.disableCategory);
admin_route.get('/enableCategory',adminAuth.isLogin,adminController.enableCategory);
admin_route.post('/editCategory',adminAuth.isLogin,adminController.editCategory);
admin_route.post('/addCategory',adminAuth.isLogin,adminController.addCategory);


//Product Details
admin_route.get('/products',adminAuth.isLogin,adminController.loadProducts);
admin_route.get('/addProduct',adminAuth.isLogin,adminController.loadAddProduct);
admin_route.get('/editProduct',adminAuth.isLogin,adminController.loadEditProduct);
admin_route.post('/addProduct',upload.array('image',3),adminController.addProduct);
admin_route.post('/editProduct',upload.array('image',3),adminController.updateProduct);
admin_route.get('/deleteProduct',adminAuth.isLogin,adminController.deleteProduct)
admin_route.get('/deleteImg',adminAuth.isLogin,adminController.imageDelete)

//Order Details
admin_route.get('/orders',adminAuth.isLogin,adminController.loadOrderDetails)
admin_route.get('/orderDetail',adminAuth.isLogin,adminController.loadOrderMoreDetails) 
admin_route.get('/changeOrderStatus',adminAuth.isLogin,adminController.changeOrderStatus) 

//Coupon Details
admin_route.get('/coupons',adminAuth.isLogin,adminController.loadCouponDetails) 
admin_route.get('/addCoupon',adminAuth.isLogin,adminController.loadAddCoupon) 
admin_route.get('/editCouopn',adminAuth.isLogin,adminController.loadEditCoupon) 
admin_route.post('/addCoupon',adminController.addCoupon) 

//Banner Details
admin_route.get('/banners',adminAuth.isLogin,adminController.loadBannerDetails) 
admin_route.get('/addBanner',adminAuth.isLogin,adminController.loadAddBanner)
admin_route.get('/deleteBanner',adminAuth.isLogin,adminController.deleteBanner)
admin_route.post('/addBanner',adminAuth.isLogin,upload.array('image',1),adminController.insertBanner)
admin_route.post('/editBanner',adminAuth.isLogin,upload.array('image',1),adminController.updateBanner)
admin_route.get('/editBanner',adminAuth.isLogin,upload.array('image',1),adminController.loadEditBanner)

//Sales Report
admin_route.get('/sales',adminAuth.isLogin,adminController.loadSalesReport)
admin_route.post('/filterSales',adminController.filterSalesReport)
admin_route.post('/exportPdf',adminController.SalesPdf)


//Common Route
admin_route.get('*',(req,res)=>{res.redirect('/admin/home')});


module.exports=admin_route;