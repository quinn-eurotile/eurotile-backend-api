const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const productSchema = new Schema({
    externalId: { type: Number, default: null },
    code: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // name
    alternateName: { type: String, default: null },
    slug: { type: String, default: null }, // url
    description: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    category: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    productAttributeVariation: [{ type: Schema.Types.ObjectId, ref: 'ProductAttributeVariation', default: null }],
    
    
    // image: { type: String, default: null }, // file
    // variantImage: { type: String, default: null },
    // expressSample: { type: Boolean, default: false },

    // size: {
    //     x: { type: Number, default: null },
    //     y: { type: Number, default: null },
    //     z: { type: Number, default: null },
    // },

    // packaging: {
    //     count: { type: Number, default: null },
    //     countFt: { type: Number, default: null },
    //     countPC: { type: Number, default: null },
    //     m2OnePs: { type: Number, default: null }
    // },

    // prices: {
    //     prx: { type: Number, default: null },
    //     usd: { type: Number, default: null },
    //     mqUSD: { type: Number, default: null },
    //     fqUSD: { type: Number, default: null },
    //     use: { type: Number, default: null },
    //     mqUSE: { type: Number, default: null },
    // },

    // measure: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', default: null },
    // material: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', default: null },
    // surface: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', default: null },
    // shape: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', default: null },
    // type: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', default: null },
    // collection: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', default: null },
    // factoryColors: [{ type: Schema.Types.ObjectId, ref: 'ProductAttribute',default: null }],
    // textures: [{ type: Schema.Types.ObjectId, ref: 'ProductAttribute',default: null }],
    // styles: [{ type: Schema.Types.ObjectId, ref: 'ProductAttribute',default: null }],
    // motivs: [{ type: Schema.Types.ObjectId, ref: 'ProductAttribute',default: null }],
    // delivery: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', default: null },
    // measurementSize: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', default: null },

    // discountsAmount: [{
    //     price: { type: Number, default: null },
    //     startAmount: { type: Number, default: null },
    //     endAmount: { type: Number, default: null },
    //     woVATPrice: { type: Number, default: null },
    //     fold: { type: Schema.Types.Mixed, default: null },
    // }],

    // priceDiscounts: [{
    //     amount: { type: Number, default: null },
    //     amountFt: { type: Number, default: null },
    //     priceUSD: { type: Number, default: null },
    //     priceFqUSD: { type: Number, default: null },
    //     priceUSE: { type: Number, default: null },
    //     priceFqUSE: { type: Number, default: null },
    //     fold: { type: Schema.Types.Mixed, default: null }
    // }],

    // artImgSrc: { type: String, default: null },
    // alt: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
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
