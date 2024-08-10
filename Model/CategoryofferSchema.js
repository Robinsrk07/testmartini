const mongoose = require('mongoose');
const Category = require('../Model/categorySchema')

const categoryOfferSchema = new mongoose.Schema({
  name: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: Category },
  type: { type: String, enum: ['percentage', 'fixed'] },
  value: Number,
  startDate: Date,
  endDate: Date,
  isActive: Boolean
});

module.exports = mongoose.model('CategoryOffer', categoryOfferSchema);