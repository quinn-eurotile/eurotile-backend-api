const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");


const supplierDiscountSchema = new Schema({
    minimumAreaSqFt: { type: Number, required: true }, // e.g., 60
    discountPercentage: { type: Number, required: true }, // e.g., 10
    applicableToClient: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }], // optional targeting
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive,  
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Sets the created_at parameter equal to the current time
supplierDiscountSchema.pre("save", async function (next) {
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

supplierDiscountSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SupplierDiscount', supplierDiscountSchema);
