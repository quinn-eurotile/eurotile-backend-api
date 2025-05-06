const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const userBusinessSchema = new Schema({
    businessName: { type: String, required: true, maxlength: 200 },
    businessEmail: { type: String, required: true },
    businessPhone: { type: String, required: true },
    businessIsVerified: { type: Boolean, default: false },
    businessVerifyStatus: { type: Number, default: 0 },
    businessStatus: { type: Number, default: 0 },
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
