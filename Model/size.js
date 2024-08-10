const mongoose = require("mongoose")

const sizeSchema = new mongoose.Schema({
    size:{
        type:String,
        required:true
    }
}) 

module.exports = mongoose.model("Size",sizeSchema);