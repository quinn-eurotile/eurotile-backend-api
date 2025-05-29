const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const orderSchema = new Schema({
    orderNumber: { type: String, required: true, unique: true, },
    orderStatus: { type: Number,  default: 1, }, // 1 = 'pending', 2 = 'processing', 3 = 'shipped', 4 = 'delivered', 5 = 'cancelled'
    paymentStatus: { type: Number, default: 1, }, // 1 = 'pending', 2 = 'paid', 3 = 'failed', 4 = 'refunded'
    shippingAddress: {
        fullName: { type: String, required: true },
        phoneNumber: { type: String, default: null, },
        addressLine1: { type: String, default: null, },
        addressLine2: { type: String, default: null, },
        lat: { type: String, default: null, },
        long: { type: String, default: null, },
        city: { type: String, default: null, },
        state: { type: String, default: null, },
        postalCode: { type: String, default: null, },
        country: { type: String, default: null, },
    },
    commission: { type: Number, default : 0},
    totalAmount: { type: Number, required: true, },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});


orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Order', orderSchema);