const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    name: { type: String, required: true },
    sku: { type: String, unique: true, required: true },
    slug: { type: String, default: null },
    description: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    category: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

module.exports = mongoose.model('Product', productSchema);
