const mongoose = require('mongoose');


 const ProductOfferSchema =   new mongoose .Schema({
    name : String ,
    Product : { type: mongoose.Schema.Types.ObjectId , ref: 'product'},
    type: { type: String, enum: ['percentage', 'fixed'] },
    value : Number,
    startDate : Date,
    endDate : Date ,
    IsActive : { type: Boolean, default: true }
 })
  module . exports = mongoose. model('ProductOffer',ProductOfferSchema)