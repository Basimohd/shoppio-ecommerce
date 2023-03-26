const mongoose=require("mongoose")

const categorySchema=mongoose.Schema({
    categoryName:{
        type:String,
        required:true
    },createdAt:{
        type:Date,
        default:Date.now
    },isDisabled:{
        type:Boolean,
        default:false
    }
    
})

module.exports=mongoose.model('Category',categorySchema)