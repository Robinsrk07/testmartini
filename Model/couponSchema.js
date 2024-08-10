const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  discountValue: { type: Number, required: true },
  targetValue: { type: Number, required: true },
  minPurchaseValue: { type: Number, required: true },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
});

module.exports= mongoose.model('Coupon', couponSchema);