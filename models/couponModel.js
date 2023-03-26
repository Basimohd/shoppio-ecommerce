const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const couponSchema=mongoose.Schema({
    code:{
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    value:{
        type:Number,
        required:true
    },
    minOrder:{
        type:Number,
        required:true
    },
    maxDiscount:{
        type:Number,
        required:true
    },
    expiryDate:{
        type:String,
        required:true
    },
    totalUsage:{
        type:Number
    },
    usedUser:{
        type:Array
    }

})

module.exports=mongoose.model('Coupon',couponSchema)