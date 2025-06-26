const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variation: { type: Schema.Types.ObjectId, ref: 'ProductVariation', required: true },
  quantity: { type: Number, required: true, min: 1 },
  numberOfTiles: { type: Number, default: 0 },
  numberOfBoxes: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  attributes: { type: Schema.Types.Mixed, default: {} }, // store selected attribute key-values
  price: { type: Number, required: true, min: 0 },
  isSample: { type: Boolean, default: false },
  sampleAttributes: { type: Schema.Types.Mixed, default: null }
}, {
  timestamps: true,
});

const CartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [CartItemSchema],
  shippingOption: { type: Schema.Types.ObjectId, ref: 'ShippingOption', default: null },
  totalItems: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  vat: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  promoCode: { type: String },
  subtotal: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  tradeProfessionalId: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

CartSchema.plugin(mongoosePaginate);

CartSchema.pre('save', function (next) {
    // this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    // this.subtotal = Number(this.items.reduce((sum, item) => {
    //   // If discount exists and is > 0, apply it
    //   const discount = item.discount && item.discount > 0 ? item.discount : 0;
    //   const discountedPrice = item.price * (1 - discount / 100);
    //   return sum + (discountedPrice * item.quantity);
    // }, 0).toFixed(2));
  // this.totalAmount = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  next();
});

// Index for expired carts cleanup
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster lookups
CartSchema.index({ userId: 1 });
CartSchema.index({ isDeleted: 1 });
CartSchema.index({ promoCode: 1 });
CartSchema.index({ status: 1 });

module.exports = mongoose.model('Cart', CartSchema);
