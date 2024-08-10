const mongoose = require('mongoose');
const User = require('../Model/userSchema')

const walletTransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
   
  },
  description: {
    type: String,
   
  },
  orderId: {
    type:String,
    ref: 'Order',
    
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  transactions: [walletTransactionSchema]
});



module.exports =  mongoose.model('Wallet', walletSchema);