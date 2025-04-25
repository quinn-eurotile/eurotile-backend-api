const mongoose = require('mongoose');
const { Schema } = mongoose;

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

module.exports = mongoose.model('UserBusinessDocument', userBusinessDocumentSchema);
