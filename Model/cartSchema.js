const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Size = require('../Model/size');
const Product = require('../Model/productSchema');  
const User = require('../Model/userSchema');  
const Colour = require('../Model/colorSchema');


const cartItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: Product, required: true },
    variantIndex: { type: Number, required: true },  
    colour :{ type: Schema.Types.ObjectId, ref: Colour, required: true},
    size: { type: Schema.Types.ObjectId, ref: Size, required: true },
    quantity: { type: Number, required: true },
    discountedPrice: { type: Number }

});

const cartSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: User, required: true },
    items: [cartItemSchema]
});

module.exports = mongoose.model('Cart', cartSchema);
