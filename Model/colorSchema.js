const mongoose = require("mongoose")
// const Product = require('../Model/productSchema')


const colourSchema = new mongoose.Schema({
    // product:{
    //     type : mongoose.Schema.Types.ObjectId,ref : Product
    // },
    colour : {
        type :String,
        required :false
    },
    colour_code :{
        type : String
    }
    
})
 module.exports = mongoose.model("colour", colourSchema)