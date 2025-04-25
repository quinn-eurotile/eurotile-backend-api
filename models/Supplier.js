const mongoose = require('mongoose');
const { Schema } = mongoose;
const supplierSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String, default: null },
    areaInSquareFeetNeedForDiscount: { type: Number, default: 0 },
    discountInPercentage: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    addresses: {
        type: { type: String, default: null },
        addressLine1: { type: String, default: null },
        addressLine2: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        postalCode: { type: String, default: null },
        country: { type: String, default: null },
        lat: { type: String, default: null, },
        long: { type: String, default: null, },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

module.exports = mongoose.model('Supplier', supplierSchema);
