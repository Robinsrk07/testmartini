const mongoose = require('mongoose');
const user = require("../Model/userSchema");
const product = require('../Model/productSchema');

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: user, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: product }]
});

module.exports = mongoose.model("Wishlist", wishlistSchema);