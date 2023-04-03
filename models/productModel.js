const { ObjectId } = require("mongodb")
const mongoose=require("mongoose")

const productReview=mongoose.Schema({
    starCount:{
        type:Number,
        require:true
    },
    name:{
        type:String,
        require:true
    },
    title:{
        type:String,
        require:true
    },
    review:{
        type:String,
        require:true
    },
    postedOn:{
        type:Date,
        default:Date.now()
    }
})
const productSchema=mongoose.Schema({
    SKU:{
        type:String,
        required:true
    },
    productName:{
        type:String,
        required:true
    },
    MRP:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    category:{
        type:ObjectId,
        required:true,
        ref:"Category"
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:Array
    },
    isDeleted:{
        type:Boolean,
        default:false
    },createdAt:{
        type:Date,
        default:Date.now
    },
    gender:{
        type:String,
        required:true
    },
    isDisabled:{
        type:Boolean,
        default:false
    },
    reviews:[productReview],
    specialOffer: {
        discountPercentage: { type: Number },
        expiryDate: { type: Date }
      }

})

module.exports=mongoose.model('Product',productSchema)