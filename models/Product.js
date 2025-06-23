const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const productSchema = new Schema({
    externalId: { type: Number, default: null },
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, default: null },
    shortDescription: { type: String, default: null },
    description: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    stockStatus: { type: String, enum: ['in_stock', 'out_of_stock'], default: 'in_stock' },
    allowSample: { type: Boolean, default: false },
    isFeatured:{ type: Boolean, default: false },
    samples: {
        small: {
            enabled: { type: Boolean, default: true },
            freePerMonth: { type: Boolean, default: true },
            price: { type: Number, default: 0 }
        },
        large: {
            enabled: { type: Boolean, default: true },
            priceType: { type: String, enum: ['fixed', 'proportional'], default: 'fixed' },
            price: { type: Number, default: 0 }
        },
        full: {
            enabled: { type: Boolean, default: true },
            priceType: { type: String, enum: ['fixed', 'proportional'], default: 'fixed' },
            price: { type: Number, default: 0 }
        }
    },
    status: { type: Number, default: 1 }, // 1 = Published, 0 = Draft, 
    defaultPrice: { type: Number, default: 0.00 },
    minPriceB2B: { type: Number, default: 0.00 },
    maxPriceB2B: { type: Number, default: 0.00 },
    minPriceB2C: { type: Number, default: 0.00 },
    maxPriceB2C: { type: Number, default: 0.00 },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    attributes: [{ type: Schema.Types.ObjectId, ref: 'ProductAttribute', default: [] }],
    attributeVariations: [{ type: Schema.Types.ObjectId, ref: 'ProductAttributeVariation', default: [] }],
    productVariations: [{ type: Schema.Types.ObjectId, ref: 'ProductVariation', default: [] }],
    productFeaturedImage: { type: Schema.Types.ObjectId, ref: 'ProductFile', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// In your Mongoose model
productSchema.virtual('statusLabel').get(function () {
    return this.status === 1 ? 'Published' : 'Draft';
});

productSchema.virtual('stockStatusLabel').get(function () {
    return this.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock';
});

// Sets the created_at parameter equal to the current time
productSchema.pre("save", async function (next) {
    try {
        now = new Date();
        this.updatedAt = now;
        if (this.isNew) {
            this.createdAt = now;
        }
        next();
    } catch (err) {
        next(err);
    }
});

productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);
