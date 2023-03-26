const mongoose=require("mongoose")

const addressSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    pincode:{
        type:Number,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    district:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    locality:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    }

})

const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    },
    address:[addressSchema],
    createdAt:{
        type:Date,
        default:Date.now
    },
    walletBalance:{
        type:Number,
        default:0
    }
})

module.exports=mongoose.model('User',userSchema)