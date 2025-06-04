const mongoose = require('mongoose');

const AdminSettingSchema = new mongoose.Schema({
  commissionRate: Number,
  vatOnOrder: Number,
  vatOnCommission: Number,
  // Add new fields here as needed
}, {
  strict: false, // Allows storing fields not explicitly defined
  timestamps: true,
});

module.exports = mongoose.model('AdminSetting', AdminSettingSchema);