const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const orderDetailSchema = new Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null,
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    commission: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    productVariation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariation',
        default: null,
    },
    // productImages: [{ type: String, required: true }],
    productDetail: {
        type: String,
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    supplierNotified: {
        type: Boolean,
        default: false
    },
    supplierConfirmed: {
        type: Boolean,
        default: false
    },
    supplierNotes: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

orderDetailSchema.plugin(mongoosePaginate);

// Add an index for faster supplier queries
orderDetailSchema.index({ supplier: 1, orderId: 1 });

// Virtual for parsed product detail
orderDetailSchema.virtual('parsedProductDetail').get(function() {
    try {
        return JSON.parse(this.productDetail);
    } catch (error) {
        console.error('Error parsing product detail:', error);
        return {};
    }
});

module.exports = mongoose.model('OrderDetail', orderDetailSchema);