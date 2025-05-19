const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const ProductVariationSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    description: { type: String, default: null },
    stockStatus: {
        type: String,
        enum: ['in_stock', 'out_of_stock', 'on_backorder'],
        default: 'in_stock'
    },
    stockQuantity: { type: Number, default: 0 },
    allowBackorders: { type: Boolean, default: false },
    weight: { type: Number, default: 0 },
    dimensions: {
        length: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 }
    },
    variationImages: [{ type: Schema.Types.ObjectId, ref: 'ProductFile', default: [] }],
    regularPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    purchasedPrice: { type: Number, default: 0 },
    customImageUrl: { type: String, default: null },
    shippingClass: { type: String, default: null },
    taxClass: {
        type: String,
        enum: ['Taxable', 'Non-Taxable'],
        default: 'Taxable'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});


ProductVariationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ProductVariation', ProductVariationSchema);




