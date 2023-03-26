const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const productSchema=mongoose.Schema({
    productId:{
        type:ObjectId,
        ref:'Product'
    },
    quantity:{
        type:Number,
        require:true
    },
    price:{
        type:Number,
        require:true
    }
})
const cartSchema=mongoose.Schema({
    userId:{
        type:ObjectId,
        required:true
    },
    products:[productSchema],
    subTotal:{
        type:Number,
        require:true
    },
    coupon:{
        type:ObjectId,
        ref:'Coupon'
    }
})

module.exports=mongoose.model('Cart',cartSchema)