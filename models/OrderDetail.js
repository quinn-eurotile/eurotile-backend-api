const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const orderDetailSchema = new Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null  },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null,
    },
    price : { type: Number, default: 0 },
    quantity : { type: Number, default: 0 },
    productVariation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariation',
        default: null,
    },
    productImages: { type: String, required: true },
    productDetail: { type: String, default : null }, // get all details from the prduct variations include their attributes
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

orderDetailSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('OrderDetail', orderDetailSchema);