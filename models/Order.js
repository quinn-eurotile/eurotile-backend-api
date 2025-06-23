const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },

  isFreeOrder: {
    type: Boolean,
    default: false
  },
 
  orderDetails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderDetail'
  }],
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  paymentDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentDetail',
    default: null
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shipping: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  supplierStatuses: [{
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    confirmedAt: Date,
    lastUpdated: Date
  }],
  allSuppliersConfirmed: {
    type: Boolean,
    default: false
  },
  commission: {type: Number, default: 0},
  paymentMethod: { type: String, enum: ['stripe', 'klarna', 'cash_on_delivery'], default: 'stripe'},
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
  shippingOption: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingOption' },
  discount: {type: Number, default: 0 },
  tax: {type: Number, default: 0 }, 
  promoCode: {type: String, default: null},
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'next-day'],
    default: 'standard'
  },
  trackingId: { type: String, default: null },
  shippedAt: {type: Date, default: null},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  currency: { type: String, default: 'EUR' },
}, {
  timestamps: true
}); 

orderSchema.plugin(mongoosePaginate);
// Index for faster supplier queries
orderSchema.index({ 'supplierStatuses.supplier': 1 }); 
module.exports = mongoose.model('Order', orderSchema);