const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  companyId: { type: Schema.Types.ObjectId, ref: "UserBusiness", default: null }, // B2B optional
  name: { type: String, default: null },
  phone: { type: String, default: null },
  addressLine1: { type: String, default: null },
  addressLine2: { type: String, default: null },
  lat: { type: String, default: null },
  long: { type: String, default: null },
  street: { type: String, default: null },
  city: { type: String, default: null },
  state: { type: String, default: null },
  postalCode: { type: String, default: null },
  country: { type: String, default: null },
  type: {
    type: String,
    enum: ["Home", "Office", "Warehouse", "Billing", "Shipping"],
    default: "Home",
  },
  isDefault: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  label: { type: String, default: "General" },
  tags: [{ type: String }],
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
AddressSchema.index({ userId: 1, isDeleted: 1 });
AddressSchema.index({ companyId: 1, isDeleted: 1 });
AddressSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Address', AddressSchema);
