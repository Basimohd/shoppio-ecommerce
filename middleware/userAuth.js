
const User = require('../models/userModel');

const isLogin = async (req, res, next) => {
    try {
        if (req.session.userId) {
            next();
        }
        else {
            res.redirect('/login');
        }

    } catch (error) {
        console.log(error.message);
    }
}
const isLogout = async (req, res, next) => {
    try {
        if (req.session.userId) {
            res.redirect('/home')
        } else {
            next();
        }

    } catch (error) {
        console.log(error.message);
    }
}
const isBlocked = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.session.userId })
        if (user.status == false) {
            req.session.userLogged = false
            res.redirect('/login')
        } else {

            next()
        }
    } catch (error) {
        console.log(error)
    }
}
module.exports = {
    isLogin,
    isLogout,
    isBlocked
}
