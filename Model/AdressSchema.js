const mongoose = require('mongoose');
const User = require('../Model/userSchema');  


const addressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: User, 
    required: true 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  locality: {
    type: String,
    trim: true
  },
  pinCode: {
    type: String,
    trim: true
  },
  additionalInfo: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});


module.exports =mongoose.model('Address', addressSchema);
 