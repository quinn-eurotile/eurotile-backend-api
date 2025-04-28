const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const productSchema = new Schema({
    name: { type: String, required: true },
    sku: { type: String, unique: true, required: true },
    slug: { type: String, default: null },
    description: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    category: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
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
