const mongoose=require("mongoose")

const bannerSchema=mongoose.Schema({
    bannerType:{
        type:String,
        required:true
    },
    mainHeading:{
        type:String,
        required:true
    },
    subHeading:{
        type:String,
        required:true
    },
    btnText:{
        type:String,
        required:true
    },
    btnLink:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    }
})

module.exports=mongoose.model('Banner',bannerSchema)