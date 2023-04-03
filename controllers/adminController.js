const bcrypt = require("bcrypt")
const fs = require("fs")
const path = require("path")
const pdf = require("html-pdf")
const ejs = require("ejs")
const moment = require("moment")

const Admin = require('../models/adminModel')
const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel');
const Banner = require('../models/bannerModel');

const { findByIdAndUpdate, find, updateOne } = require('../models/userModel')

// Load loginPage
const loadLogin = async (req, res, next) => {
    try {
        res.render('login')
    } catch (error) {
        next(error)
    }
}

// Verify adminLogin
const verifyLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const adminData = await Admin.findOne({ email: email })
        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password);
            if (passwordMatch) {
                req.session.adminId = adminData._id;
                res.redirect('/admin')
            } else {
                res.render('login', { errMsg: "Email Or Password Is incorrect" })
            }
        } else {
            res.render('login', { errMsg: "Email Or Password Is incorrect" })
        }
    } catch (error) {
        next(error);
    }
}

// Logout Admin
const logoutAdmin = async (req, res, next) => {
    try {
        req.session.adminId = null;
        res.redirect('/admin/login')
    } catch (error) {
        next(error)
    }
}

// Load adminDashboard
const loadDashoard = async (req, res, next) => {
    try {
        const thirtyDaysAgo = moment().subtract(30, 'days');
        const sixtyDaysAgo = moment().subtract(60, 'days');
        const userCount = await User.countDocuments();


        const currentDate = moment();
        const lastMonthEndDate = moment().subtract(1, 'month').endOf('month');
        const lastMonthStartDate = moment().subtract(1, 'month').startOf('month');
        const currentMonthStartDate = moment().startOf('month');
        
        const lastMonthUsers = await User.countDocuments({ createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate } })
        const currentMonthUsers = await User.countDocuments({ createdAt: { $gte: currentMonthStartDate, $lte: currentDate } })

        const userHike = ((currentMonthUsers - lastMonthUsers) / lastMonthUsers)*100;
        

        const productCount = await Product.countDocuments({ isDeleted: false });
        const productRecent = await Product.countDocuments({ date: { $gte: thirtyDaysAgo }, isDeleted: false });
        const incPercProduct = ((productRecent / productCount) * 100);

        const orderCount = await Order.countDocuments();
        const orderRecent = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const incPercOrder = (((orderRecent - orderCount) / orderCount) * 100);

        const payedOrder = await Order.find({ paymentStatus: "Payed" });
        let revenue = 0;
        if (payedOrder.length > 0) {
            revenue = payedOrder.map((order) => order.cartTotal).reduce((acc, cur) => {
                return acc += cur
            })
        }

        const categoryCount = await Category.countDocuments();
        const categoryRecent = await Category.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const incPercCategory = ((categoryRecent - categoryCount) / 100);

        res.render('dashboard', { userCount, productCount, incPercOrder, incPercProduct, categoryCount, orderCount, incPercCategory, revenue, incPercCategory,userHike })
    } catch (error) {
        next(error)
    }
}

// Chart Datas
const graphDetails = async (req, res, next) => {
    try {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        const orders = await Order.find({ date: { $gte: startDate } })
            .populate('productDatas.productId', 'gender')
            .exec();
        const maleOrders = [];
        const femaleOrders = [];
        const label = [];
        for (let i = 5; i >= 0; i--) {
            const sixMonthsAgo = moment().subtract(i, 'months');
            const startDate = moment(sixMonthsAgo).startOf('month');
            const endDate = moment(sixMonthsAgo).endOf('month');
            const maleOrderCount = orders.filter((order) =>
                order.status == "Delivered" &&
                order.productDatas.some((product) => product.productId.gender == "Men") &&
                new Date(order.date) >= startDate && new Date(order.date) <= endDate
            ).length;
            const femaleOrderCount = orders.filter((order) =>
                order.status == "Delivered" & order.productDatas.some((product) => product.productId.gender == "Women") &&
                new Date(order.date) >= startDate && new Date(order.date) <= endDate
            ).length;
            maleOrders.push(maleOrderCount);
            femaleOrders.push(femaleOrderCount);
            label.push(sixMonthsAgo.format('MMM'))
        }
        const users = [];
        userLabel = [];
        const userData = await User.find({ createdAt: { $gte: startDate } })
        for (let i = 7; i >= 0; i--) {
            const sixMonthsAgo = moment().subtract(i, 'months');
            const startDate = moment(sixMonthsAgo).startOf('month')
            const endDate = moment(sixMonthsAgo).endOf('month');
            const userCount = userData.filter((user) =>
                new Date(user.createdAt) >= startDate && new Date(user.createdAt) <= endDate
            ).length;
            users.push(userCount);
            userLabel.push(sixMonthsAgo.format('MMM'))
        }
        const orderData = await Order.find()
        const paymentData = {
            return: 0,
            online: 0,
            COD: 0,
        }
        const paymentRevenue = {
            CODRevenue: 0,
            onlineRevenue: 0,
            Refunded: 0,
        }
        orderData.forEach((order) => {
            if (order.paymentStatus == "Returned" && order.paymentStatus == "Refunded") {
                paymentData.return += 1;
                paymentRevenue.CODRevenue -= order.cartTotal
            } else if (order.paymentMethod == "RazorPay" && order.paymentStatus == "Payed") {
                paymentData.online += 1;
                paymentRevenue.onlineRevenue += order.cartTotal
            } else if (order.paymentMethod == "COD" && order.paymentStatus == "Payed") {
                paymentData.COD += 1;
                paymentRevenue.CODRevenue += order.cartTotal
            }
        })

        let payments = 0;
        for (let key in paymentData) {
            payments += paymentData[key];
        }
        res.json({ maleOrders, femaleOrders, label, users, userLabel, paymentData, payments, paymentRevenue })
    } catch (error) {
        next(error)
    }
}
//User Management
const loadUserDetails = async (req, res, next) => {
    try {
        const userData = await User.find({})
        if (userData) {
            res.render('userDetails', { userData })
        } else {
            res.render('userDetails')
        }
    } catch (error) {
        next(error);
    }
}
const logOut = async (req, res, next) => {
    try {
        res.redirect('/admin/login')
    } catch (error) {
        next(error)
    }
}
const updateUserStatus = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.query.id });
        if (userData.status == true) {
            await User.findOneAndUpdate({ _id: req.query.id }, { $set: { status: false } });
        } else {
            await User.findOneAndUpdate({ _id: req.query.id }, { $set: { status: true } });
        }
        res.redirect('/admin/users')
    } catch (error) {
        next(error)
    }
}

//Category Management
const loadCategories = async (req, res, next) => {
    try {
        const categoryData = await Category.aggregate([{
            $lookup: { from: Product.collection.name, localField: '_id', foreignField: 'category', as: 'products' }
        },
        { $project: { _id: 1, categoryName: 1, count: { $size: '$products' }, isDisabled: 1 } }]);
        console.log(categoryData)
        res.render('categories', { categoryData })
    } catch (error) {
        next(error)
    }
}
const loadAddCategory = async (req, res, next) => {
    try {

        res.render('addCategory')
    } catch (error) {
        next(error)
    }
}
const loadEditCategory = async (req, res, next) => {
    try {
        const categoryData = await Category.findOne({ _id: req.query.id })
        res.render('editCategory', { category: categoryData })
    } catch (error) {
        next(error)
    }
}
const disableCategory = async (req, res, next) => {
    try {
        console.log("ibde ind")
        await Category.updateOne({ _id: req.query.id }, {
            $set: {
                isDisabled: true
            }
        })
        await Product.updateMany({ category: req.query.id }, {
            $set: {
                isDisabled: true
            }
        })

        res.redirect('/admin/categories');
    } catch (error) {
        next(error)
    }
}
const enableCategory = async (req, res, next) => {
    try {
        await Category.updateOne({ _id: req.query.id }, {
            $set: {
                isDisabled: false
            }
        })
        await Product.updateMany({ category: req.query.id }, {
            $set: {
                isDisabled: false
            }
        })
        res.redirect('/admin/categories');
    } catch (error) {
        next(error)
    }
}
const addCategory = async (req, res, next) => {
    try {
        const categoryName = req.body.categoryName;
        const categoryInc = await Category.findOne({ categoryName: new RegExp(`^${categoryName}$`, 'i') })
        if (categoryInc) {
            res.render("addCategory", { errMsg: "Category is Already exist" })
        } else {
            if (!categoryName.trim() == "") {
                const category = new Category({
                    categoryName: categoryName
                })
                const categoryData = category.save();
                if (categoryData) {
                    res.redirect('/admin/categories')
                } else {
                    res.render("addCategory", { errMsg: "Something went wrong" })
                }
            } else {
                res.render("addCategory", { errMsg: "Input is empty or contains only white space" })
            }
        }
    } catch (error) {
        next(error)
    }
}
const editCategory = async (req, res, next) => {
    try {

        const { id, categoryName } = req.body;
        const categoryInc = await Category.findOne({ categoryName: categoryName })
        console.log(categoryInc);
        const categoryData = await Category.findOne({ _id: id })
        if (categoryInc) {
            res.render("editCategory", { errMsg: "Category is Already exist", category: categoryData })
        } else {
            if (!categoryName.trim() == "") {
                await Category.findByIdAndUpdate({ _id: id }, { $set: { categoryName: categoryName } })
                res.redirect('/admin/categories')
            } else {
                res.render("addCategory", { errMsg: "Input is empty or contains only white space", category: categoryData })
            }
        }
    } catch (error) {
        next(error)
    }
}


// Product Management
const loadProducts = async (req, res, next) => {
    try {
        const productData = await Product.find({ isDeleted: false }).populate('category');
        res.render('productDetails', { productData });
    } catch (error) {
        next(error)
    }
}
const loadAddProduct = async (req, res, next) => {
    try {
        async function generateUniqueSKU() {
            let sku = '';
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let isUnique = false;
            sku = letters.charAt(Math.floor(Math.random() * letters.length)).toUpperCase();
            while (!isUnique) {
                for (let i = 0; i < 7; i++) {
                    sku += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                const existingProduct = await Product.findOne({ SKU: sku });
                if (!existingProduct) {
                    isUnique = true;
                }
            }
            return sku;
        }
        const uniqueSKU = await generateUniqueSKU();
        const categoryData = await Category.find({})
        res.render('addProduct', { SKU: uniqueSKU, categoryData })
    } catch (error) {
        next(error);
    }
}
const addProduct = async (req, res, next) => {
    try {
        let { SKU, productName, MRP, salePrice, category, stock, description, gender } = req.body

        if (!productName.trim() || !MRP.trim() || !salePrice.trim() || !stock.trim() || !description.trim()) {
            const categoryData = await Category.find({})
            res.render('addProduct', { categoryData, SKU, errMsg: "Input is empty or contains only white space" })
        } else {
            const imageUpload = [];
            for (let i = 0; i < req.files.length; i++) {
                imageUpload[i] = req.files[i].filename;
            }
            
            const products = new Product({
                SKU: SKU,
                productName: productName,
                MRP: MRP,
                salePrice: salePrice,
                stock: stock,
                category: category,
                description: description,
                image: imageUpload,
                gender: gender
            })
            const productData = await products.save();
            if (productData) {
                res.redirect('/admin/products')
            } else {
                const categoryData = await Category.find({})
                res.render('addProduct', { categoryData, SKU, errMsg: "Something went wrong. Please Retry Again" })
            }
        }
    } catch (error) {
        next(error);
    }
}
const loadEditProduct = async (req, res, next) => {
    try {
        req.session.productId = req.query.id;
        const categoryData = await Category.find({})
        const productData = await Product.findOne({ _id: req.query.id }).populate('category')
        res.render('editProduct', { productData, categoryData })
    } catch (error) {
        next(error);
    }
}
const updateProduct = async (req, res, next) => {
    try {
        let { id, SKU, productName, MRP, salePrice, category, stock, description } = req.body;
        const productData = await Product.findOne({ _id: id }).populate('category')
        const categoryData = await Category.find({})

        if (!productName.trim() || !MRP.trim() || !salePrice.trim() || !stock.trim() || !description.trim()) {
            res.render("editProduct", { categoryData, errMsg: "Input is empty or contains only white space", productData })
        } else {
            for (let i = 0; i < req.files.length; i++) {
                const imageUpload = req.files[i].filename;
                await Product.updateOne({ _id: req.body.id }, { $push: { image: imageUpload } })
            }
            await Product.findByIdAndUpdate({ _id: id }, {
                $set: {
                    SKU: SKU,
                    productName: productName,
                    MRP: MRP,
                    salePrice: salePrice,
                    stock: stock,
                    category: category,
                    description: description
                }
            })
            res.redirect('/admin/products');
        }

    } catch (error) {
        next(error)
    }
}
const imageDelete = async (req, res, next) => {
    try {
        const img = req.query.img;
        const imageData = await Product.updateMany({ $pull: { image: { $in: [img] } } })
        fs.unlink('./public/productImage/' + img, (err) => {
            if (err) throw err;
            console.log('Image deleted');
        });
        if (imageData) {
            res.redirect('/admin/editProduct?id=' + req.session.productId);
        }
    } catch (error) {
        next(error);
    }
}
const deleteProduct = async (req, res, next) => {
    try {
        await Product.updateOne({ _id: req.query.id }, { isDeleted: true })
        res.redirect('/admin/products')
    } catch (error) {
        next(error);
    }
}

//Order Management
const loadOrderDetails = async (req, res, next) => {
    try {
        let orderData = await Order.find({}).sort({ date: -1 })
        res.render('orderDetails', { orderData })
    } catch (error) {
        next(error)
    }
}
const loadOrderMoreDetails = async (req, res, next) => {
    try {
        let orderData = await Order.findOne({ _id: req.query.id }).populate('productDatas.productId')
        let productData = orderData.productDatas;
        console.log(productData);
        let userData = await User.findOne({ _id: orderData.userId })
        const orderAddress = orderData.addressId.toString();
        const address = userData.address.find(address => address._id == orderAddress);
        res.render('orderMoreDetails', { orderData, productData, userData, address })
    } catch (error) {
        next(error)
    }
}
const changeOrderStatus = async (req, res, next) => {
    try {
        const { id, status, page } = req.query;
        const orderData = await Order.findOne({ _id: id })
        if (status == "Delivered" && orderData.paymentMethod == "COD") {
            await Order.updateOne({ _id: id }, {
                $set: {
                    status: status,
                    statusUpdated: new Date(),
                    paymentStatus: "Payed"
                }
            })
        } else {
            await Order.updateOne({ _id: id }, {
                $set: {
                    status: status,
                    statusUpdated: new Date()
                }
            })
        }

        if (page == "orders") {
            res.redirect('/admin/orders')
        } else {
            res.redirect(`/admin/orderDetail?id=${id}`)
        }

    } catch (error) {
        next(error)
    }
}
//Coupon Details and its Operations
const loadCouponDetails = async (req, res, next) => {
    try {
        let couponData = await Coupon.find({})
        const expiryDate = new Date(couponData.expiryDate);
        let currentDate = new Date();
        if (expiryDate.getTime() < currentDate.getTime()) {
            res.render('couponDetails', { couponData, couponExpired: true })
        } else {
            res.render('couponDetails', { couponData, couponExpired: false })
        }
    } catch (error) {
        next(error)
    }
}
const loadAddCoupon = async (req, res, next) => {
    try {
        res.render('addCoupon')
    } catch (error) {
        next(error);
    }
}
const addCoupon = async (req, res, next) => {
    try {
        const { code, type, value, minOrder, maxDiscount, totalUsage, status, expiryDate } = req.body;
        const couponExist = Coupon.findOne({ code: new RegExp(`^${code}$`, 'i') })
        if (couponExist) {
            res.render('addCoupon', { errMsg: "The Coupon Code is already exist" })
        } else {
            console.log(req.body);
            const addCoupon = new Coupon({
                code: code,
                type: type,
                value: value,
                minOrder: minOrder,
                maxDiscount: maxDiscount,
                status: status,
                expiryDate: expiryDate,
                totalUsage: totalUsage
            })
            const coupon = addCoupon.save()
            if (coupon) {
                res.redirect('/admin/coupons')
            } else {
                res.redirect('/admin/addCoupon')
            }
        }
    } catch (error) {
        next(error);
    }
}
const loadEditCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findOne({ _id: req.query.id })
        res.render('editCoupon', { coupon })
    } catch (error) {
        next(error);
    }
}



// Banner Details and its operations
const loadBannerDetails = async (req, res, next) => {
    try {
        const bannerDetails = await Banner.find()
        res.render('bannerDetails', { bannerDetails })
    } catch (error) {
        next(error);
    }
}
const loadAddBanner = async (req, res, next) => {
    try {
        res.render('addBanner')
    } catch (error) {
        next(error);
    }
}
const insertBanner = async (req, res, next) => {
    try {
        console.log(req.body);
        const { bannerType, mainHead, subHead, btnText, btnLink, status } = req.body;
        if (!bannerType.trim() || !mainHead.trim() || !subHead.trim() || !btnText.trim() || !btnLink.trim() || !status.trim()) {
            res.render('addBanner', { errMsg: "All Input Fields must be valid" })
        } else {
            const imageFile = req.files[0].filename;
            const banner = new Banner({
                bannerType: bannerType,
                mainHeading: mainHead,
                subHeading: subHead,
                btnText: btnText,
                btnLink: btnLink,
                status: status,
                image: imageFile
            })
            await banner.save();
            res.redirect('/admin/banners')
        }
    } catch (error) {
        next(error);
    }
}

const loadEditBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findOne({ _id: req.query.id })
        res.render('editBanner', { banner })
    } catch (error) {
        next(error)
    }
}

const updateBanner = async (req, res, next) => {
    try {
        console.log(req.files);
        const { id, bannerType, mainHead, subHead, btnText, btnLink, status } = req.body;
        if (!bannerType.trim() || !mainHead.trim() || !subHead.trim() || !btnText.trim() || !btnLink.trim() || !status.trim()) {
            res.render('addBanner', { errMsg: "All Input Fields must be valid" })
        } else {
            const imageFile = req.files[0].filename;
            await Banner.findByIdAndUpdate({ _id: id }, {
                $set: {
                    bannerType: bannerType,
                    mainHeading: mainHead,
                    subHeading: subHead,
                    btnText: btnText,
                    btnLink: btnLink,
                    status: status,
                    image: imageFile
                }
            })
            res.redirect('/admin/banner');
        }
    } catch (error) {
        next(error)
    }
}

const deleteBanner = async (req, res, next) => {
    try {
        await Banner.deleteOne({ _id: req.query.id })
        res.redirect('/admin/banner')
    } catch (error) {
        next(error);
    }
}

//Sales Report
const loadSalesReport = async (req, res, next) => {
    try {
        const orderDetails = await Order.find({ status: "Delivered" }).populate('userId').populate('productDatas.productId')
        res.render('salesReport', { orderDetails })
    } catch (error) {
        next(error)
    }
}
const filterSalesReport = async (req, res, next) => {
    try {
        const { dateFrom, dateTo } = req.body;
        console.log(req.body)
        const dateFrom1 = new Date(req.body.dateFrom);
        const dateTo2 = new Date(req.body.dateTo);

        let orderDetails;
        if (dateTo && dateFrom) {
            orderDetails = await Order.find({ $and: [{ date: { $lte: dateTo2 } }, { date: { $gte: dateFrom1 } }, { status: "Delivered" }] }).populate('userId').populate('productDatas.productId')
        }
        else if (dateTo) {
            orderDetails = await Order.find({ status: "Delivered", date: { $lte: dateTo2 } }).populate('userId').populate('productDatas.productId')
        } else {
            orderDetails = await Order.find({ status: "Delivered", date: { $gte: dateFrom1 } }).populate('userId').populate('productDatas.productId')
        }

        res.json({ orderDetails })
    } catch (error) {
        next(error)
    }
}
const SalesPdf = async (req, res, next) => {
    try {
        const start = req.body.dateFrom
        const end = req.body.dateTo
        let orderDetails;
        if (start && end) {
            orderDetails = await Order.find({ $and: [{ date: { $lte: end } }, { date: { $gte: start } }, { paymentStatus: "Payed" }] }).populate('userId').populate('productDatas.productId')
        }
        else if (end) {
            orderDetails = await Order.find({ paymentStatus: "Payed", date: { $lte: end } }).populate('userId').populate('productDatas.productId')
        } else {
            orderDetails = await Order.find({ paymentStatus: "Payed", date: { $gte: start } }).populate('userId').populate('productDatas.productId')
        }
        const data = {
            orderDetails: orderDetails
        }
        const filePath = path.resolve(__dirname, '../views/admin/salesPdf.ejs');
        const htmlString = fs.readFileSync(filePath).toString();
        const ejsData = ejs.render(htmlString, data);
        let options = {
            format: 'A4',
            orientation: "portrait",
            border: "10mm"

        }
        pdf.create(ejsData, options).toStream((err, stream) => {
            if (err) {
                console.log(err);
            }
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="sales-report.pdf"'
            });
            stream.pipe(res);
        });

        console.log('pdf generated')
    } catch (error) {
        next(error);
    }
}
module.exports = {
    loadLogin,
    verifyLogin,
    loadDashoard,
    loadUserDetails,
    logOut,
    updateUserStatus,
    loadCategories,
    loadAddCategory,
    addCategory,
    loadEditCategory,
    disableCategory,
    enableCategory,
    editCategory,
    loadProducts,
    loadAddProduct,
    addProduct,
    loadEditProduct,
    updateProduct,
    imageDelete,
    deleteProduct,
    loadOrderDetails,
    loadOrderMoreDetails,
    logoutAdmin,
    loadCouponDetails,
    loadAddCoupon,
    addCoupon,
    loadBannerDetails,
    loadAddBanner,
    insertBanner,
    loadSalesReport,
    filterSalesReport,
    SalesPdf,
    graphDetails,
    changeOrderStatus,
    loadEditCoupon,
    loadEditBanner,
    updateBanner,
    deleteBanner
}