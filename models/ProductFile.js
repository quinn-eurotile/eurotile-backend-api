const mongoose = require('mongoose');
const { Schema } = mongoose;

const productFileSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    fileName: { type: String, required: true },
    fileType: {
        type: String,
        enum: ['image', 'video', 'pdf', 'doc', 'spreadsheet', 'other'],
        required: true,
    },
    filePath: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

module.exports = mongoose.model('ProductFile', productFileSchema);
