const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {type: String, required: true},
  commission: {type: Number},
  orderDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderDetail', required: true }],
  shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  paymentMethod: { type: String, enum: ['stripe', 'klarna', 'cash_on_delivery'],required: true},
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending'},
  orderStatus: {type: Number,
    enum: [0, 1, 2, 3, 4], //0=Cancelled, 1 = Delivered, 2= Processing, 3 = New, , 4 = Shipped,
    default: 2
  },
  subtotal: {type: Number, required: true},
  shipping: {type: Number, required: true },
  discount: {type: Number, default: 0 },
  tax: {type: Number, default: 0 },
  total: {type: Number, required: true},
  promoCode: {type: String, default: null},
  paymentDetail: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentDetail', required: true },
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'overnight'],
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);