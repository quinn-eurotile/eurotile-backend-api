const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const userBusinessSchema = new Schema({
    name: { type: String, required: true, maxlength: 200 },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: Number, default: 2 }, // 1 = Verified, 0 = UnVerified, 2 = Pending
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Sets the created_at parameter equal to the current time
userBusinessSchema.pre("save", async function (next) {
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

userBusinessSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('UserBusiness', userBusinessSchema);
