const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const ProductVariationSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    description: { type: String, default: true },
    stockStatus: {
        type: String,
        enum: ['in_stock', 'out_of_stock', 'on_backorder'],
        required: true
    },
    stockQuantity: { type: Number, required: true },
    allowBackorders: { type: Boolean, default: false },
    weight: { type: Number, required: true },
    dimensions: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    },
    regularPrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    purchasedPrice: { type: Number, required: true },
    customImageUrl: { type: String, default: null },
    image: { type: Schema.Types.ObjectId, ref: 'Image', default: null },
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




