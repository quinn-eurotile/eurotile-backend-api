const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const userSchema = new Schema({
    userId: { type: String, unique: true, },
    email: { type: String, required: true, },
    name: { type: String, required: true, },
    phone: { type: String, required: true, },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    password: { type: String },
    userImage: { type: String,default: null, },
    emailVerifiedAt: { type: Date, default: Date.now },
    status: { type: Number, default: 2 }, // 1 = Active, 0 = Inactive, 2 = Pending , 3 = Approve , 4 = Reject 
    accept_term: { type: Number, default: 0 }, // 1 = Yes, 0 = No  
    lastLoginDate: { type: Date, default: Date.now },    
    reason: { type: String, default: null },
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

userSchema.virtual('roleNames').get(function () {
  if (this.roles && Array.isArray(this.roles)) {
    return this.roles
      .map(role => (typeof role === 'object' && role !== null ? role.name : null))
      .filter(name => name); // Filter out nulls
  }
  return [];
});

// Add these virtual fields to your schema
userSchema.virtual('business', {
    ref: 'UserBusiness',
    localField: '_id',
    foreignField: 'createdBy',
    justOne: true
});

userSchema.virtual('documents', {
    ref: 'UserBusinessDocument',
    localField: '_id',
    foreignField: 'createdBy'
});

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);