const mongoose = require('mongoose');

const AdminSettingSchema = new mongoose.Schema({
  currencyConversionRate: Number,
  vatOnOrder: Number,
  vatOnCommission: Number,
}, {
  strict: false, // Allows storing fields not explicitly defined
  timestamps: true,
});

module.exports = mongoose.model('AdminSetting', AdminSettingSchema);