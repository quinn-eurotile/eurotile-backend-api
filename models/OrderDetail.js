const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const orderDetailSchema  = new Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    productDetail: {
        name: { type: String, required: true },
        sku: { type: String },
        image: { type: String }, // main thumbnail image
        price: { type: Number, required: true },
        size: { type: String }, // example: "1kg", "500ml"
        quantity: { type: Number, required: true, min: 1 },
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps : true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});



orderDetailSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('OrderDetail', orderDetailSchema);