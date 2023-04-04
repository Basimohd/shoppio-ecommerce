const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const orderProducts=mongoose.Schema({
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

const orderSchema=mongoose.Schema({
    userId:{
        type:ObjectId,
        required:true,
        ref:'User'
    },
    productDatas:[orderProducts],
    paymentMethod:{
        type:String,
        required: true
    },
    paymentStatus:{
        type:String,
        required: true
    },
    addressId:{
        type:ObjectId,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    cartTotal:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        required:true
    },
    couponName:{
        type:String
    },
    couponDiscount:{
        type:Number
    },statusUpdated:{
        type:Date,
        default:Date.now
    },returnReason:{
        type:String,
        default:""
    }
})

module.exports=mongoose.model('Order',orderSchema)