const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");
// Helper function to generate a unique supplier ID
const generateSupplierId = () => {
    const prefix = 'SUP'; // You can change this prefix if needed
    const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    return `${prefix}${randomDigits}`;
  };
const supplierSchema = new Schema({
    supplierId: {
        type: String,
        unique: true,
        // required: true
      },
    companyName: { type: String, required: true },
    companyEmail: { type: String, unique: true, required: true },
    companyPhone: { type: String, unique: true, required: true },    
    status: { type: Number, default: 0 }, // 1 = Active, 0 = Inactive, 2 = Pending  
    contactInfo: [{
        name: { type: String, default: null },
        email: { type: String, default: null },
        phone: { type: String, default: null },
    }],
    isDeleted: { type: Boolean, default: false },
    addresses: {
        type: { type: String, default: null },
        addressLine1: { type: String, default: null },
        addressLine2: { type: String, default: null },
        city: { type: Number,  default: null  },
        state: { type: Number,   default: null },
        postalCode: { type: String, default: null },
        country: { type: Number,   default: null },
        lat: { type: String, default: null, },
        long: { type: String, default: null, },
    },
    discounts: [{ type: Schema.Types.ObjectId, ref: 'SupplierDiscount', default: null }],
    teamMembers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
 
// Hook to set createdAt and updatedAt, and generate supplierId if not present
supplierSchema.pre("save", async function (next) {
    try {
        const now = new Date();
        this.updatedAt = now;

        if (this.isNew) {
            this.createdAt = now;

            // Only set supplierId if not already set
            if (!this.supplierId) {
                let newSupplierId = generateSupplierId();

                // Use this.constructor instead of calling mongoose.model()
                const SupplierModel = this.constructor;
                while (await SupplierModel.exists({ supplierId: newSupplierId })) {
                    newSupplierId = generateSupplierId();
                }

                this.supplierId = newSupplierId;
            }
        }

        next();
    } catch (err) {
        next(err);
    }
});
supplierSchema.virtual('country', {
    ref: 'Country',
    localField: 'addresses.country', // nested field
    foreignField: '_id',         // assuming Country schema has "country"
    justOne: true
  });
  supplierSchema.virtual('city', {
    ref: 'City',
    localField: 'addresses.city', // nested field
    foreignField: '_id',         // assuming Country schema has "country"
    justOne: true
  });
  supplierSchema.virtual('state', {
    ref: 'State',
    localField: 'addresses.state', // nested field
    foreignField: '_id',         // assuming Country schema has "country"
    justOne: true
  });
supplierSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Supplier', supplierSchema);
