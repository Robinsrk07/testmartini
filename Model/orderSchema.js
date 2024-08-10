const mongoose = require('mongoose');
const User = require('./userSchema');
const Address = require('./AdressSchema');
const Product = require('./productSchema');
const Size = require('./size');
const Colour = require('./colorSchema');

const orderItemSchema = new mongoose.Schema({
    
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productTitle: { type: String, required: true },
    variantIndex: { type: Number, required: true },
    colour: { type: mongoose.Schema.Types.ObjectId, ref: 'Colour', required: true },
    colourName: { type: String, required: true },
    size: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },
    status: { type: String, default: 'Pending' },
    returnReason :{type:String},
    sizeName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    Discount :{ type: Number },
    DiscountedPrice :{ type: Number },
    couponDiscount :{ type: Number },
    totalPayable : { type: Number },

    image: {
        imagedata: { type: Buffer },
        _id: { type: mongoose.Schema.Types.ObjectId }
    },
 
    //razorpayPaymentId: String,
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending'
    }
});



const orderAdressSchema = new mongoose.Schema({
    name: { type: String, required: true,  },
    phoneNumber: { type: String},
    email: { type: String},
    address: { type: String},
    locality: { type: String },
    pinCode: { type: String },
    additionalInfo: { type: String}
});



const orderSchema = new mongoose.Schema({
    orderId :{ type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    items: [orderItemSchema],
    address: orderAdressSchema,
    total: { type: Number, required: true },
    totalPayable: { type: Number  },
    offerDiscount: {type : Number},
    CouponDiscount: { type: Number },
    paymentStatus: {
        type: String,
        default: 'Pending'
      },

   // status: { type: String, default: 'Pending' },
     razorpayOrderId:{ type: String},

    paymentMethod: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] }
})

module.exports = mongoose.model('Order', orderSchema);
