const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const productMeasurementUnitSchema = new mongoose.Schema({
    name: { type: String, required: true },     // e.g., "Millimeter"
    symbol: { type: String, required: true },   // e.g., "mm"
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive
    status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('ProductMeasurementUnit', productMeasurementUnitSchema);
