const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const productAttributeVariationSchema = new mongoose.Schema({
    productAttribute: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductAttribute', required: true },
    metaKey: { type: String, default: null },
    metaValue: { type: String, default: null },
    productMeasurementUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductMeasurementUnit', default: null },
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive
    isDeleted: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

productAttributeVariationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ProductAttributeVariation', productAttributeVariationSchema);