const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    email: { type: String, unique: true, required: true, },
    name: { type: String, required: true, },
    phone: { type: String, required: true, },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    password: { type: String },
    emailVerifiedAt: { type: Date, default: Date.now },
    status: { type: Number, default: 0 }, // 1 = Active, 0 = Inactive  
    lastLoginDate: { type: Date, default: Date.now },
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
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

module.exports = mongoose.model('User', userSchema);
