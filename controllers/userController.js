const bcrypt = require("bcrypt")
const crypto = require("crypto")
const nodemailer = require('nodemailer');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel');
const Wishlist = require('../models/wishlistModel');
const Banner = require('../models/bannerModel');

const { updateOne } = require('../models/userModel')
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const verifySid = process.env.VERIFY_SID;
const client = require("twilio")(accountSid, authToken);

const Razorpay = require('razorpay');
const { response } = require("../routes/userRoute");

const instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

//Home Page
const loadHome = async (req, res, next) => {
    try {
        const bannerDetails = await Banner.find({ status: "Active" })
        const latestProducts = await Product.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(8);
        const trendingProducts = await Product.aggregate([
            { $match: { isDisabled: { $ne: true }, isDeleted: { $ne: true } } },
            { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$_id", productName: { $first: "$productName" }, MRP: { $first: "$MRP" }, salePrice: { $first: "$salePrice" },
                    stock: { $first: "$stock" }, image: { $first: "$image" }, reviews: { $push: "$reviews" }, averageRating: { $avg: { $ifNull: ["$reviews.starCount", 0] } }
                }
            },
            { $project: { _id: 1, productName: 1, MRP: 1, salePrice: 1, stock: 1, image: 1, reviews: 1, averageRating: 1 } },
            { $sort: { averageRating: -1 } },
            { $limit: 10 },
        ]);
        if (req.session.userId) {
            const userData = await User.findOne({ _id: req.session.userId })
            const wishlistProduct = await Wishlist.findOne({ userId: req.session.userId });
            const cartData = await Cart.findOne({ userId: req.session.userId })
            const wishlist = await Wishlist.findOne({ userId: req.session.userId })
            res.render('home', { userData, cartData, wishlist, bannerDetails, latestProducts, wishlistProduct, trendingProducts })
        } else {
            res.render('home', { bannerDetails, latestProducts, trendingProducts })
        }
    } catch (error) {
        next(error)
    }
}

//User Registrations
const loadLogin = async (req, res, next) => {
    try {
        res.render('login')
    } catch (error) {
        next(error)
    }
}
const loadRegister = async (req, res, next) => {
    try {
        res.render('register')
    } catch (error) {
        next(error);
    }
}

const loadgetOtp = async (req, res, next) => {
    try {
        if (req.session.mobile) {
            const mobileNo = req.session.mobile;
            client.verify.v2
                .services(verifySid)
                .verifications.create({ to: "+91" + mobileNo, channel: "sms" })
                .then((verification) => res.redirect('/verifyOtp'))
        } else if (req.session.regMobile) {
            const mobileNo = req.session.regMobile;
            client.verify.v2
                .services(verifySid)
                .verifications.create({ to: "+91" + mobileNo, channel: "sms" })
                .then((verification) => res.redirect('/register/verifyOtp'))
        } else {
            res.render('getOtp')
        }

    } catch (error) {
        next(error);
    }
}

const loadverifyOtp = async (req, res, next) => {
    try {
        if (req.session.mobile) {
            const mobileNo = req.session.mobile;
            res.render('verifyOtp', { mobileNo, hrefLink: "loginHref" })
        } else if (req.session.regMobile) {
            const mobileNo = req.session.regMobile;
            res.render('verifyOtp', { mobileNo, hrefLink: "regHref" })
        }
        else {
            res.render('verifyOtp')
        }
    } catch (error) {
        next(error);
    }
}
const regGetMobNo = async (req, res, next) => {
    try {
        const mobileNo = req.body.mobile;
        const userData = await User.findOne({ mobile: mobileNo })
        if (userData) {
            res.render('getOtp', { errMsg: "Mobile No Already Registered" })
        } else {
            req.session.regMobile = mobileNo;
            client.verify.v2
                .services(verifySid)
                .verifications.create({ to: "+91" + mobileNo, channel: "sms" })
                .then((verification) => res.redirect('/register/verifyOtp'))
        }
    } catch (error) {
        next(error);
    }
}

const regVerifyOtp = async (req, res, next) => {
    try {
        const otp = req.body.otp;
        if (otp.trim() == "" || otp.length != 6) {
            res.render('verifyOtp', { errMsg: "Incorrect Otp" })
        } else {
            const mobileNo = req.session.regMobile;
            client.verify.v2
                .services(verifySid)
                .verificationChecks.create({ to: "+91" + mobileNo, code: otp })
                .then((verification_check) => {
                    if (verification_check.status == "approved") {
                        res.redirect('/register')
                    } else {
                        res.render('verifyOtp', { errMsg: "Incorrect Otp" })
                    }
                })
        }
    } catch (error) {
        next(error)
    }
}
const insertUser = async (req, res, next) => {
    try {
        const { name, email, password, repassword } = req.body;
        if (name.trim() == "" || email.trim() == "" || password.trim() == "" || repassword.trim() == "") {
            res.render('register', { errMsg: "Input is empty or contains only white space" })
        } else {
            const emailData = await User.findOne({ email: email })
            if (emailData) {
                res.render('register', { errMsg: "Email is already Registered" })
            } else {
                const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;;
                if (password.match(regex)) {
                    if (password != repassword) {
                        res.render('register', { errMsg: "Confirm password is not same" })
                    } else {
                        const sPassword = await bcrypt.hash(password, 10)
                        const user = new User({
                            name: name,
                            email: email,
                            mobile: req.session.regMobile,
                            password: sPassword
                        })
                        const userData = await user.save()
                        if (userData) {
                            res.redirect('/login')
                        } else {
                            res.render('register', { errMsg: "Something went wrong" })
                        }
                    }
                } else {
                    res.render('register', { errMsg: "Password must contain atleast 8 alphanumeric character" })
                }
            }
        }
    } catch (error) {
        next(error)
    }
}
const verifyLogin = async (req, res, next) => {
    try {
        const { emailMobile, password } = req.body;
        const userData = await User.findOne({ $or: [{ email: emailMobile }, { mobile: emailMobile }] })
        if (userData) {
            if (userData.status == true) {
                const passwordMatch = await bcrypt.compare(password, userData.password);
                if (passwordMatch) {
                    req.session.userId = userData._id;
                    res.redirect('/home');
                } else {
                    res.render('login', { errMsg: "Password is Incorrect" })
                }
            } else {
                res.render('login', { errMsg: "Your Account is blocked by Admin" })
            }
        } else {
            res.render('login', { errMsg: "Email Or Phone Number is not Registered" })
        }
    } catch (error) {
        next(error);
    }
}
const getOtp = async (req, res, next) => {
    try {
        const mobile = req.body.mobile;
        const userData = await User.findOne({ mobile: mobile });
        if (userData) {
            if (userData.status == true) {
                req.session.mobile = mobile;
                client.verify.v2
                    .services(verifySid)
                    .verifications.create({ to: "+91" + mobile, channel: "sms" })
                    .then((verification) => res.redirect('/verifyOtp'))
            } else {
                res.render('getOtp', { errMsg: "Your Account is blocked by Admin" })
            }
        } else {
            res.render('getOtp', { errMsg: "Mobile Number is not Registered" })
        }
    } catch (error) {
        next(error);
    }
}
const verifyOtp = async (req, res, next) => {
    try {
        const userData = await User.findOne({ mobile: req.session.mobile });
        const otp = req.body.otp;
        if (otp.trim() == "" || otp.length != 6) {
            res.render('verifyOtp', { errMsg: "Incorrect Otp" })
        } else {
            req.session.loggedId = userData._id;
            const mobileNo = req.session.mobile;
            client.verify.v2
                .services(verifySid)
                .verificationChecks.create({ to: "+91" + mobileNo, code: otp })
                .then((verification_check) => {
                    if (verification_check.status == "approved") {
                        req.session.userId = userData._id;
                        res.redirect('/home');

                    } else {
                        res.render('verifyOtp', { mobileNo, errMsg: "Incorrect Otp" })
                    }
                })
        }
    } catch (error) {
        next(error);
    }
}
const logOut = async (req, res, next) => {
    try {
        delete req.session.userId;
        res.redirect('/home')
    } catch (error) {
        next(error);
    }
}

//User Profile Settings
const profileLoad = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        res.render('userProfile', { userData })
    } catch (error) {
        next(error);
    }
}
const editProfileLoad = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        res.render('userProfileEdit', { userData })
    } catch (error) {
        next(error);
    }
}
const insertEditedProfile = async (req, res, next) => {
    try {
        const userData = await User.updateOne({ _id: req.body.id }, {
            $set: {
                name: req.body.name,
                email: req.body.email
            }
        })
        res.redirect('/userProfile')
    } catch (error) {
        next(error);
    }
}

const changePassLoad = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        res.render('passChange', { userData })
    } catch (error) {
        next(error);
    }
}

const changePass = async (req, res, next) => {
    try {
        const { oldPass, newPass, confirmPass } = req.body;
        const userData = await User.findOne({ _id: req.session.userId })
        if (!oldPass.trim() || !newPass.trim() || !confirmPass.trim()) {
            res.render('passChange', { userData, errMsg: "Input is empty or contains only white space" })
        } else {
            const passwordMatch = await bcrypt.compare(oldPass, userData.password);
            if (passwordMatch) {
                const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;;
                if (newPass.match(regex)) {
                    const sPassword = await bcrypt.hash(newPass, 10)
                    if (newPass == confirmPass) {
                        const passwordSame = await bcrypt.compare(newPass, userData.password);
                        if (passwordMatch) {
                            res.render('passChange', { userData, errMsg: "Old password and New Password should not be same" })
                        } {
                            await User.updateOne({ _id: req.session.userId }, {
                                $set: {
                                    password: sPassword
                                }
                            })
                            res.redirect('/userProfile')
                        }
                    } else {
                        res.render('passChange', { userData, errMsg: "New Password and Confirm Password must be same" })
                    }
                } else {
                    res.render('passChange', { userData, errMsg: "Password Must contain Alphanumeric Characters" })
                }
            } else {
                res.render('passChange', { userData, errMsg: "Old Password is wrong" })
            }
        }
    } catch (error) {
        next(error);
    }
}

//Address Settings
const addressLoad = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        const addressData = userData.address
        res.render('addressDetails', { userData, addressData })
    } catch (error) {
        next(error);
    }
}
const loadAddAddress = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        res.render('addAddress', { userData })
    } catch (error) {
        next(error);
    }
}
const insertOrEditAddress = async (req, res, next) => {
    try {

        const AddressExist = await User.findOneAndUpdate({ _id: req.session.userId, 'address._id': req.body.id }, {})
        if (!req.body.name.trim || !req.body.mobile.trim || !req.body.pincode.trim() || !req.body.state.trim() || !req.body.district.trim() || !req.body.address.trim() || !req.body.locality.trim() || !req.body.city.trim()) {
            const userData = await User.findOne({ _id: req.session.userId })
            res.render('addAddress', { userData, errMsg: "Input is empty or contains only white space" })
        } else {
            if (AddressExist) {
                await User.findOneAndUpdate({ _id: req.session.userId, 'address._id': req.body.id }, {
                    $set: {
                        'address.$.name': req.body.name,
                        'address.$.mobile': req.body.mobile,
                        'address.$.pincode': req.body.pincode,
                        'address.$.state': req.body.state,
                        'address.$.district': req.body.district,
                        'address.$.address': req.body.address,
                        'address.$.locality': req.body.locality,
                        'address.$.city': req.body.city
                    }
                })
                if (req.session.checkout) {
                    res.redirect('/checkout')
                    delete req.session.checkout;
                } else {
                    res.redirect('/address')
                }
            } else {

                const userData = await User.findOne({ _id: req.session.userId })
                const userAddress = {
                    name: req.body.name,
                    mobile: req.body.mobile,
                    pincode: req.body.pincode,
                    state: req.body.state,
                    district: req.body.district,
                    address: req.body.address,
                    locality: req.body.locality,
                    city: req.body.city
                }
                await User.findByIdAndUpdate({ _id: req.session.userId }, { $push: { address: userAddress } })
                const address = await new User({
                    address: [userAddress]
                })
                if (req.session.checkout) {
                    res.redirect('/checkout')
                    delete req.session.checkout;
                } else {
                    res.redirect('/address')
                }
            }
        }
    } catch (error) {
        next(error);
    }
}
const deleteAddress = async (req, res, next) => {
    try {
        await User.updateOne({ _id: req.session.userId }, { $pull: { address: { _id: req.query.id } } })
        if (req.session.checkout) {
            res.redirect('/checkout')
        } else {
            res.redirect('/address')
        }


    } catch (error) {
        next(error);
    }
}
const editAddress = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        const addressData = userData.address.filter((address) => address._id == req.query.id)[0]
        res.render('editAddress', { userData, addressData })
    } catch (error) {
        next(error);
    }
}

//Shop Catalog
const loadCatalog = async (req, res, next) => {
    try {
        const wishlistProduct = await Wishlist.findOne({ userId: req.session.userId });
        const productData = await Product.find({ isDeleted: false })
        const itemsPerPage = 10;
        const totalItems = await Product.countDocuments({ isDeleted: false });
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const categoryData = await Category.aggregate([
            { $lookup: { from: Product.collection.name, localField: '_id', foreignField: 'category', as: 'products' } },
            { $project: { _id: 1, categoryName: 1, count: { $size: '$products' } } }]);
        const men = await Product.countDocuments({ $and: [{ gender: "Men" }, { isDeleted: false }] });
        const women = await Product.countDocuments({ $and: [{ gender: "Women" }, { isDeleted: false }] });
        const genderCount = {
            men: men,
            women: women
        }
        res.render('shopCategory', { productData, wishlistProduct, categoryData, genderCount, totalPages })
    } catch (error) {
        next(error);
    }
}

//Single Product Catalog
const loadProduct = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        const productData = await Product.findOne({ _id: req.query.id }).populate('category')
        let reviewPercentage = 0;
        if (productData.reviews.length) {
            totalStarCount = productData.reviews.map((review) => review.starCount).reduce((acc, cur) => acc += cur)
            reviewPercentage = totalStarCount / productData.reviews.length;
        }
        const relatedProduct = await Product.find({ category: productData.category._id, isDisabled: false, _id: { $ne: req.query.id } })
        console.log(relatedProduct)
        const offerPercentage = ((productData.MRP - productData.salePrice) / productData.MRP) * 100;
        if (userData) {
            const wishlistProduct = await Wishlist.findOne({
                $and: [
                    { userId: userData._id },
                    { "products.productId": productData._id }
                ]
            })
            res.render('singleProduct', { product: productData, offerPercentage, wishlistProduct, relatedProduct, reviewPercentage })
        } else {
            res.render('singleProduct', { product: productData, offerPercentage, relatedProduct, reviewPercentage })
        }
    } catch (error) {
        next(error);
    }
}

//Wishlists and its operations
const loadWishlist = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const userData = await User.findOne({ _id: req.session.userId })
            const wishlist = await Wishlist.findOne({ userId: req.session.userId }).populate('products.productId')
            if (wishlist) {
                let productData = wishlist.products;
                res.render('wishlist', { productData, userData })
            } else {
                res.render('wishlist', { userData })
            }
        } else {
            res.render('wishlist')
        }
    } catch (error) {
        next(error);
    }
}

const insertWishlist = async (req, res, next) => {
    try {
        const productId = await Product.findById({ _id: req.query.id })
        const userData = await User.findOne({ _id: req.session.userId })
        const userExist = await Wishlist.findOne({ userId: userData._id })
        const productData = {
            productId: productId._id
        }
        if (userExist) {
            const productExist = await Wishlist.findOne({
                userId: userData._id,
                "products.productId": { $in: [req.query.id] }
            })
            if (productExist) {
                await Wishlist.updateOne({ userId: userData._id }, { $pull: { products: { productId: req.query.id } } })
                res.json({ success: false })
            } else {
                await Wishlist.updateOne({ userId: userData._id }, { $push: { products: productData } })
                res.json({ success: true })

            }
        } else {
            let wishlist = new Wishlist({
                userId: userData._id,
                products: productData
            })
            await wishlist.save()
            res.json({ success: true })
        }

    } catch (error) {
        next(error);
    }
}

const insertCartWishlist = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        const userId = await Cart.findOne({ userId: userData._id })
        const productDatas = await Product.findOne({ _id: req.query.id })
        const salePrice = productDatas.salePrice;
        let productData = {
            productId: productDatas._id,
            quantity: 1,
            price: salePrice
        }
        if (userId) {
            const productExist = userId.products.findIndex(product => product.productId == req.query.id)
            if (productExist != -1) {
                await Cart.updateOne({ userId: userData._id, 'products.productId': req.query.id }, {
                    $inc: { 'products.$.quantity': 1, 'products.$.price': salePrice, subTotal: salePrice }
                })
                await Wishlist.updateOne({ userId: userData._id }, { $pull: { products: { productId: req.query.id } } })
                res.redirect('/cart')
            } else {
                await Cart.updateOne({ userId: userData._id }, { $push: { products: productData } })
                await Cart.updateOne({ userId: userData._id }, { $inc: { subTotal: salePrice } })
                await Wishlist.updateOne({ userId: userData._id }, { $pull: { products: { productId: req.query.id } } })
                res.redirect('/cart')
            }
        } else {
            const cart = new Cart({
                userId: userData._id,
                products: productData,
                subTotal: salePrice
            })
            await cart.save()
            await Wishlist.updateOne({ userId: userData._id }, { $pull: { products: { productId: req.query.id } } })
            res.redirect('/cart')
        }
    } catch (error) {
        next(error);
    }
}

const deleteWishlist = async (req, res, next) => {
    try {
        await Wishlist.updateOne({ userId: req.session.userId }, { $pull: { products: { productId: req.query.id } } })
        res.redirect('/wishlist')
    } catch (error) {
        next(error);
    }
}

//Cart and its operations
const loadCart = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        if (userData) {
            const userCart = await Cart.findOne({ userId: userData._id }).populate('products.productId')
            if (userCart) {
                let subTotal = 0;
                userCart.products.forEach((product) => {
                    subTotal += product.productId.salePrice * product.quantity;
                });
                await Cart.updateOne({ _id: userCart._id }, { $set: { subTotal: subTotal } });
                const productsArray = userCart.products;
                const products = productsArray.map((product) => ({
                    id: product._id,
                    productId: product.productId._id,
                    productName: product.productId.productName,
                    salePrice: product.productId.salePrice,
                    MRP: product.productId.MRP,
                    quantity: product.quantity,
                    image: product.productId.image,
                    totalMRP: product.productId.MRP * product.quantity,
                    totalPrice: product.productId.salePrice * product.quantity
                }))
                const totalMRP = products.reduce((acc, cur) => acc + cur.totalMRP, 0)
                const totalPrice = subTotal
                res.render('cart', { products, userCart, totalMRP, totalPrice, userData })
            } else {
                let products = []
                res.render('cart', { products, userData })

            }
        } else {
            res.render('cart')
        }
    } catch (error) {
        next(error);
    }
}
const insertCart = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        const userId = await Cart.findOne({ userId: userData._id })
        const productDatas = await Product.findOne({ _id: req.query.id })
        const salePrice = productDatas.salePrice;
        let productData = {
            productId: req.query.id,
            quantity: 1,
            price: salePrice
        }
        if (userId) {
            const productExist = userId.products.findIndex(product => product.productId == req.query.id)
            if (productExist != -1) {
                await Cart.updateOne({ userId: userData._id, 'products.productId': req.query.id }, {
                    $inc: { 'products.$.quantity': 1, subTotal: salePrice }
                })
                res.redirect('/cart')
            } else {
                await Cart.updateOne({ userId: userData._id }, { $push: { products: productData } })
                await Cart.updateOne({ userId: userData._id }, { $inc: { subTotal: salePrice } })
                res.redirect('/cart')
            }
        } else {
            const cart = new Cart({
                userId: userData._id,
                products: productData,
                subTotal: salePrice
            })
            await cart.save()
            res.redirect('/cart')
        }
    } catch (error) {
        next(error);
    }
}
const changeQuantity = async (req, res, next) => {
    try {
        const { userData, productId, quantity, salePrice, id } = req.body;
        const cartData = await Cart.findOneAndUpdate({ userId: userData, 'products.productId': productId }, {
        })
        const product = cartData.products.find(item => item.productId == productId)
        const afterQuantity = product.quantity + Number(quantity);
        if (afterQuantity != 0) {
            if (quantity == 1) {
                await Cart.findOneAndUpdate({ userId: userData, 'products.productId': productId }, {
                    $inc: { 'products.$.quantity': quantity, subTotal: salePrice }
                })
                res.json({ success: true })
            } else {
                await Cart.findOneAndUpdate({ userId: userData, 'products.productId': productId }, {
                    $inc: { 'products.$.quantity': quantity, subTotal: -salePrice }
                })
                res.json({ success: false })
            }
        } else {
            res.json({ negative: true })
        }
    } catch (error) {
        next(error);
    }
}
const deleteCart = async (req, res, next) => {
    try {
        const id = req.query.id;
        const productDatas = await Product.findOne({ _id: id })
        const salePrice = productDatas.salePrice;
        await Cart.updateOne(
            { userId: req.session.userId },
            { $pull: { products: { productId: id } } }
        )
        await Cart.updateOne(
            { userId: req.session.userId },
            { $inc: { subTotal: -salePrice } }
        )
        res.redirect('/cart')
    } catch (error) {
        next(error);
    }
}

//Checkout and its operations
const checkout = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        const addressData = userData.address
        const userCart = await Cart.findOne({ userId: userData._id }).populate('products.productId')
        const subTotal = userCart.subTotal;
        await Cart.updateOne({ userId: req.session.userId }, {
            $unset: { coupon: "" }
        })
        const productsArray = userCart.products;
        const products = productsArray.map((product) => ({
            productName: product.productId.productName,
            salePrice: product.productId.salePrice,
            quantity: product.quantity,
            image: product.productId.image
        }))

        req.session.checkout = userCart._id;
        res.render('checkout', { userData, addressData, subTotal, products });

    } catch (error) {
        next(error);
    }
}
const insertOrderDetails = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId }).populate('products.productId')
        const cartProducts = cart.products;
        const coupon = await Coupon.findOne({ _id: cart.coupon })
        console.log(cartProducts)
        let totalPrice;
        let couponDis;
        let orderSave;
        if (!coupon) {
            totalPrice = cart.subTotal;
            const orderDetails = new Order({
                userId: req.session.userId,
                productDatas: cartProducts,
                paymentMethod: req.body.payment,
                paymentStatus: 'Not Payed',
                addressId: req.body.address,
                date: Date.now(),
                cartTotal: totalPrice,
                status: "Placed",
                couponName: "NIL",
                couponDiscount: 0
            })
            orderSave = await orderDetails.save()
        } else {
            if (coupon.type == "Percentage") {
                let subTotal = cart.subTotal
                let couponPercentage = coupon.value
                let couponDiscount = couponPercentage / 100;
                let maxDiscount = coupon.maxDiscount;
                let couponDis = subTotal * couponDiscount;
                if (couponDis > maxDiscount) {
                    couponDis = maxDiscount;
                }
                totalPrice = subTotal - couponDis;
            } else {
                totalPrice = cart.subTotal - coupon.value;
                couponDis = coupon.value;
            }
            const orderDetails = new Order({
                userId: req.session.userId,
                productDatas: cartProducts,
                paymentMethod: req.body.payment,
                paymentStatus: 'Not Payed',
                addressId: req.body.address,
                date: Date.now(),
                cartTotal: totalPrice,
                status: "Placed",
                couponName: coupon.code,
                couponDiscount: couponDis
            })
            orderSave = await orderDetails.save()
        }
        req.session.orderId = orderSave._id;
        const userData = await User.findOne({ _id: req.session.userId })
        if (orderSave.paymentMethod == "RazorPay") {
            instance.orders.create({
                amount: parseInt(totalPrice) * 100,
                currency: "INR",
                receipt: orderSave._id.toString()
            }).then((order) => {
                res.json({ order: order, user: userData });
            }).catch((err) => {
                console.log(err);
            })

        } else if (orderSave.paymentMethod == "COD") {
            res.json({ success: true })
        }
    } catch (error) {
        next(error);
    }
}
const verifyPayment = async (req, res, next) => {
    try {
        console.log(req.body);
        const details = req.body;
        let hmac = crypto.createHmac('sha256', 'lr9jSMWROkOlet6vcLmPP250')
        hmac.update(details['order[razorpay_order_id]'] + '|' + details['order[razorpay_payment_id]'])
        hmac = hmac.digest("hex")
        if (hmac == details['order[razorpay_signature]']) {
            await Order.updateOne({ _id: details['payment[receipt]'] }, {
                $set: {
                    paymentStatus: 'Payed'
                }
            })
            res.json({ success: true })
        } else {
            await Order.updateOne({ _id: details['payment[receipt]'] }, {
                $set: {
                    paymentStatus: 'Failed'
                }
            })
            res.json({ success: false })
        }
    } catch (error) {
        next(error)
    }
}
const orderConfirm = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId });
        const orderDetails = await Order.findOne({ _id: req.session.orderId });
        console.log(orderDetails);
        const orderAddress = orderDetails.addressId.toString();
        const addressData = userData.address.find(address => address._id == orderAddress);
        const date = orderDetails.date
        const orderDate = date.toISOString().split('T')[0];
        const cart = await Cart.findOne({ userId: req.session.userId }).populate('products.productId')
        await Coupon.updateOne({ _id: cart.coupon }, {
            $push: {
                usedUser: req.session.userId
            }
        })
        await Coupon.updateOne({ _id: cart.coupon }, {
            $inc: {
                totalUsage: -1
            }
        })
        await Cart.deleteOne({ userId: req.session.userId })
        res.render('orderConfirm', { userData, orderDate, addressData, orderDetails })
    } catch (error) {
        next(error);
    }
}

//Coupon and its operations
const applyCoupon = async (req, res, next) => {
    try {
        const { couponCode } = req.body;
        const couponDetails = await Coupon.findOne({ code: couponCode })
        const coupounApplied = await Cart.findOne({ $and: [{ userId: req.session.userId }, { coupon: { $exists: true, $ne: null } }] })
        if (!coupounApplied) {
            const cartData = await Cart.findOne({ userId: req.session.userId })
            if (couponDetails) {
                const userUsed = await Coupon.findOne({ $and: [{ usedUser: { $in: [req.session.userId] } }, { code: couponCode }] })
                const expiryDate = new Date(couponDetails.expiryDate);
                let currentDate = new Date();
                if (userUsed) {
                    res.json({ success: true, couponDetails: couponDetails, userUsed: true })
                } else if (couponCode.totalUsage == 0) {
                    res.json({ success: true, couponDetails: couponDetails, totalUsageErr: true })
                } else if (expiryDate.getTime() < currentDate.getTime()) {
                    res.json({ success: true, couponDetails: couponDetails, expiryDateErr: true })
                } else if (couponDetails.minOrder >= cartData.subTotal) {
                    res.json({ success: true, couponDetails: couponDetails, minOrderErr: true })
                } else {

                    res.json({ success: true, couponDetails: couponDetails })
                    await Cart.updateOne({ userId: req.session.userId },
                        { $set: { coupon: couponDetails._id } }, { upsert: true })
                }
            } else {
                res.json({ success: false })
            }
        } else {
            res.json({ success: false, applied: true })
            await Cart.updateOne({ userId: req.session.userId }, {
                $unset: { coupon: "" }
            })
        }
    } catch (error) {
        next(error);
    }
}

const loadOrders = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.userId })
        const orderData = await Order.find({ userId: req.session.userId }).sort({ date: -1 }).populate('productDatas.productId')
        res.render('orders', { userData, orderData })
    } catch (error) {
        next(error)
    }
}
const loadOrderTrack = async (req, res, next) => {
    try {
        const id = req.query.id
        const userData = await User.findOne({ _id: req.session.userId })
        const orderData = await Order.findOne({ _id: id }).populate('productDatas.productId')
        let user = await User.findOne({ _id: orderData.userId })
        const orderAddress = orderData.addressId.toString();
        const address = user.address.find(address => address._id == orderAddress);
        res.render('orderTrack', { userData, orderData, address })
    } catch (error) {
        next(error)
    }
}
const cancelOrder = async (req, res, next) => {
    try {
        await Order.findOneAndUpdate({ _id: req.query.id }, {
            $set: {
                status: "Cancelled"
            }
        })
        const order = await Order.findOne({ _id: req.query.id });
        console.log(order.paymentStatus, order.cartTotal)
        if (order.paymentStatus == "Payed") {
            await User.updateOne({ _id: req.session.userId }, { $inc: { walletBalance: order.cartTotal } })
        }
        res.redirect('/orders')
    } catch (error) {
        next(error)
    }
}
const requestReturn = async (req, res, next) => {
    try {
        await Order.findOneAndUpdate({ _id: req.query.id }, {
            $set: {
                status: "Returning"
            }
        })
        res.redirect('/orders')
    } catch (error) {
        next(error)
    }
}
const filterProduct = async (req, res, next) => {
    try {
        const filters = req.body;
        const incFilters = { isDeleted: false };
        if (filters.gender) {
            incFilters.gender = filters.gender;
        }
        if (filters['category[]'] && filters['category[]'].length > 0) {
            incFilters.category = { $in: filters['category[]'] };
        }
        if (filters['price[]']) {
            let priceFilter = [];
            const priceRanges = Array.isArray(filters['price[]']) ? filters['price[]'] : [filters['price[]']];
            for (let range of priceRanges) {
                if (range.includes('<')) {
                    priceFilter.push({ $lte: parseInt(range.substring(1)) });
                } else {
                    const [minPrice, maxPrice] = range.split('-');
                    console.log("asdf" + priceFilter)
                    if (priceFilter.length == 0) {
                        priceFilter.push({ $gte: parseInt(minPrice), $lte: parseInt(maxPrice) });
                    }
                    else if (priceFilter[0].$lte < parseInt(maxPrice)) {
                        priceFilter[0].$lte = parseInt(maxPrice)
                    } else {
                        priceFilter[0].$gte = parseInt(minPrice)
                    }
                }
            }
            if (priceFilter.length > 1) {
                incFilters.salePrice = { $or: priceFilter };
            } else {
                incFilters.salePrice = priceFilter[0]
            }
        }
        sortCondition = {};
        if (filters.sort == "Product Name (A - Z)") {
            sortCondition.productName = 1;
        } else if (filters.sort == "Price(High to Low)") {
            sortCondition.salePrice = -1;
        } else if (filters.sort == "Price(Low to High)") {
            sortCondition.salePrice = 1;
        }
        const itemsPerPage = filters.limit || 10
        const page = req.query.page || 1; // Get the current page from the query string
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = page * itemsPerPage;
        const totalItems = await Product.countDocuments(incFilters);
        const totalPages = Math.ceil(totalItems / itemsPerPage);


        const filteredProduct = await Product.find(incFilters).sort(sortCondition).skip(startIndex).limit(itemsPerPage);
        const wishlistProduct = await Wishlist.findOne({ userId: req.session.userId });
        res.json({ filteredProduct: filteredProduct, wishlistProduct: wishlistProduct, totalPages: totalPages })
    } catch (error) {
        next(error)
    }
}

const saveReview = async (req, res) => {
    try {
        const { rating, productId, title, review } = req.body
        const userData = await User.findOne({ _id: req.session.userId })

        if (userData) {
            const orderData = await Order.findOne({ $and: [{ userId: req.session.userId }, { 'productDatas.productId': productId }] })
            if (orderData) {

                let reviewDetails = {
                    starCount: rating,
                    name: userData.name,
                    title: title,
                    review: review
                }
                await Product.updateOne({ _id: productId }, { $push: { reviews: reviewDetails } })
                res.json({ success: true })
            } else {
                res.json({ success: false })
            }
        } else {
            res.json({ success: false, userLoggedIn: true })
        }
    } catch (error) {
        console.log(error)
    }
}

const handleSubscribeForm = async (req, res, next) => {
    try {
        const { email } = req.body;
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: 'basimohammedkt@gmail.com',
              pass: 'knefsvqfqrrjcqpu',
            },
        });
        
        const mailOptions = {
            from: 'basimohammedkt@gmail.com',
            to: email,
            subject: 'Thank you for subscribing!',
            html: '<p>Thank you for subscribing to our newsletter!</p>',
        };
        await transporter.sendMail(mailOptions);
        res.json({success: true})
    } catch (err) {
        next(err);
    }
};

module.exports = {
    loadLogin,
    loadRegister,
    loadgetOtp,
    loadverifyOtp,
    regGetMobNo,
    regVerifyOtp,
    insertUser,
    verifyLogin,
    getOtp,
    verifyOtp,
    loadHome,
    loadCatalog,
    loadProduct,
    logOut,
    loadWishlist,
    loadCart,
    insertCart,
    changeQuantity,
    deleteCart,
    addressLoad,
    loadAddAddress,
    insertOrEditAddress,
    deleteAddress,
    editAddress,
    profileLoad,
    editProfileLoad,
    insertEditedProfile,
    changePassLoad,
    changePass,
    checkout,
    insertOrderDetails,
    verifyPayment,
    orderConfirm,
    applyCoupon,
    insertWishlist,
    insertCartWishlist,
    deleteWishlist,
    loadOrders,
    loadOrderTrack,
    filterProduct,
    cancelOrder,
    saveReview,
    requestReturn,
    handleSubscribeForm
}