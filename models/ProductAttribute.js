const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const productAttributeSchema = new Schema({
    externalId: { type: String, default: null },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive,  
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    timestamps : true,
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
