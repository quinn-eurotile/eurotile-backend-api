const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const supplierSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String, default: null },
    areaInSquareFeetNeedForDiscount: { type: Number, default: 0 },
    discountInPercentage: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    addresses: {
        type: { type: String, default: null },
        addressLine1: { type: String, default: null },
        addressLine2: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        postalCode: { type: String, default: null },
        country: { type: String, default: null },
        lat: { type: String, default: null, },
        long: { type: String, default: null, },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Sets the created_at parameter equal to the current time
supplierSchema.pre("save", async function (next) {
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
  
  supplierSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Supplier', supplierSchema);
