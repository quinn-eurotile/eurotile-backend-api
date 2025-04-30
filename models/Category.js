const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const categorySchema = new Schema({
    name: { type: String, required: true, maxlength: 255 },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default : null },
    isDeleted: { type: Boolean, default: false },
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive  
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Sets the created_at parameter equal to the current time
categorySchema.pre("save", async function (next) {
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

categorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Category', categorySchema);