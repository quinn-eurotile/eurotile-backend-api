const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {type: String, required: true},
  commission: {type: Number, default: 0},
  orderDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderDetail', default: [] }],
  shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null  },
  paymentMethod: { type: String, enum: ['stripe', 'klarna', 'cash_on_delivery'], default: 'stripe'},
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending'},
  orderStatus: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5], //0=Cancelled, 1=Delivered, 2=Processing, 3=New, 4=Shipped, 5=Pending
    default: 3
  },
  customerType: {
    type: String,
    enum: ['retail', 'trade'],
    required: true,
    default: 'trade'
  },
  clientOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'If order is placed by Trade Professional for their client',
    default: null
  },
  subtotal: {type: Number, required: true},
  shipping: {type: Number, required: true },
  discount: {type: Number, default: 0 },
  tax: {type: Number, default: 0 },
  total: {type: Number, required: true},
  promoCode: {type: String, default: null},
  paymentDetail: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentDetail', default: null  },
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'next-day'],
    default: 'standard'
  },
  trackingId: { type: String, default: null },
  shippedAt: {type: Date, default: null},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);