// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;
// const Product = require('../Model/productSchema')
// const Colour = require('../Model/colorSchema');
// const SizeQuantity = require('../Model/sizeQuantitySchema');

// const variantSchema = new Schema({
//     sizeQuantities: [{
//         type: Schema.Types.ObjectId,
//         ref: SizeQuantity
//     }],
//     product: {
//         type: Schema.Types.ObjectId,
//         ref: Product,
//         required: true
//     },
//     colour: {
//         type: Schema.Types.ObjectId,
//         ref: Colour,
//         required: true
//     },
//     price: {
//         type: Number,
//         required: true
//     },
//     images: [{
//         type: String
//     }]
// });

// module.exports = mongoose.model("Variant", variantSchema);