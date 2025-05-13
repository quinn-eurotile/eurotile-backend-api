const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const userBusinessDocumentSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'UserBusiness', required: true },
  type: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: {
    type: String,
    enum: ['image', 'video', 'pdf', 'doc', 'spreadsheet', 'xls', 'csv', 'other'],
    default: 'other',
  },
  docType: {
    type: String,
    enum: ['business_documents', 'registration_certificate', 'trade_license', 'proof_of_business','other'],
    default: 'other',
  },
  filePath: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  status: { type: Number, default: 2 }, //1 = Verified, 0 = UnVerified, 2 = Pending
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Sets the created_at parameter equal to the current time
userBusinessDocumentSchema.pre("save", async function (next) {
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

userBusinessDocumentSchema.virtual('docTypeLabel').get(function () {
    if (!this.docType) return null;
 
    // Convert snake_case to "Title Case"
    return this.docType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
});

userBusinessDocumentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('UserBusinessDocument', userBusinessDocumentSchema);
