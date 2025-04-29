const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const userBusinessDocumentSchema = new Schema({
  type: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: {
    type: String,
    enum: ['image', 'video', 'pdf', 'doc', 'spreadsheet', 'other'],
    required: true,
  },
  filePath: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  status: { type: Number, default: 0 },
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

userBusinessDocumentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('UserBusinessDocument', userBusinessDocumentSchema);
