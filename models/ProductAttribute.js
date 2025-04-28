const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const productAttributeSchema = new Schema({
    name: { type: String, required: true },
    alias: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['type', 'material', 'measure', 'surface', 'color'] },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Sets the created_at parameter equal to the current time
productAttributeSchema.pre("save", async function (next) {
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



productAttributeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ProductAttribute', productAttributeSchema);
