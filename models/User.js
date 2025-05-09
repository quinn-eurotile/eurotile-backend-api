const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const userSchema = new Schema({
     userId: {
        type: String,
        unique: true,
        // required: true
      },
    email: { type: String, unique: true, required: true, },
    name: { type: String, required: true, },
    phone: { type: String, required: true, },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    password: { type: String },
    emailVerifiedAt: { type: Date, default: Date.now },
    status: { type: Number, default: 0 }, // 1 = Active, 0 = Inactive, 2 = Pending  
    accept_term: { type: Number, default: 0 }, // 1 = Yes, 0 = No  
    lastLoginDate: { type: Date, default: Date.now },
    token: { type: String, default: null },
    addresses: {
        type: { type: String, default: null, },
        addressLine1: { type: String, default: null, },
        addressLine2: { type: String, default: null, },
        lat: { type: String, default: null, },
        long: { type: String, default: null, },
        city: { type: String, default: null, },
        state: { type: String, default: null, },
        postalCode: { type: String, default: null, },
        country: { type: String, default: null, },
    },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

const generateId = () => {
    const prefix = 'EUR'; // You can change this prefix if needed
    const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    return `${prefix}${randomDigits}`;
  };
// Sets the created_at parameter equal to the current time
userSchema.pre("save", async function (next) {
    try {
        now = new Date();
        this.updatedAt = now;
        if (this.isNew) {
            this.createdAt = now;
                // Only set userId if not already set
            if (!this.userId) {
                let newUserId = generateId();

                // Use this.constructor instead of calling mongoose.model()
                const UserModel = this.constructor;
                while (await UserModel.exists({ userId: newUserId })) {
                    newUserId = generateId();
                }

                this.userId = newUserId;
            }
        }
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
