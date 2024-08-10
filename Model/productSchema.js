const mongoose = require("mongoose");
const category = require('../Model/categorySchema');
const Brand = require('../Model/brandSchema');
const Colour = require('../Model/colorSchema');
const Size = require('../Model/size');

  

const imageSchema= new mongoose.Schema({
    imagedata:{
        type :Buffer,
        required : false
    },
    imagetype : {
        type : String,
        required : false
    }
   
});
const variantSchema = new mongoose.Schema({
    colour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Colour,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    
    sizeQuantities: [{
        size: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Size,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    images: [imageSchema]
    
});

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: category
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Brand
    },
    is_list: {
        type: Boolean,
        required: false,
        default: true
    },
    variants: [variantSchema]
});

module.exports = mongoose.model("product", productSchema);