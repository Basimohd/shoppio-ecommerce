const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const productSchema=mongoose.Schema({
    productId:{
        type:ObjectId,
        ref:'Product'
    }
})
const wishlistSchema=mongoose.Schema({
    userId:{
        type:ObjectId,
        required:true
    },
    products:[productSchema]
})

module.exports=mongoose.model('Wishlist',wishlistSchema)