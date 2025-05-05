const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const taxSchema = new mongoose.Schema({
  customerType: {type: String,enum: ['Retail', 'Trade'],required: true,unique: true},
  taxPercentage: {type: Number,required: true},
  isDeleted: { type: Boolean, default: false },
  status: { type: Number, default: 1 }, // 1 = Active, 0 = Inactive  
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});


taxSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Tax', taxSchema);

