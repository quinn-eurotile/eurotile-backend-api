const mongoose = require("mongoose");

const adminRole = { id: '680f110aa6224872fab09569', name: 'Admin' };
const teamMemberRole = { id: '680f606cb47c317ad30841b5', name: 'Team Member' };
const tradeProfessionalRole = { id: '6819ce06bb8f30e6c73eba48', name: 'Trade Professional' };
// Predefined ObjectIDs for consistency
const measurementUnit = [
  { _id: new mongoose.Types.ObjectId('000000000000000000000001'), name: 'Millimeter', symbol: 'mm' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000002'), name: 'Centimeter', symbol: 'cm' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000003'), name: 'Meter', symbol: 'm' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000004'), name: 'Inch', symbol: 'in' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000005'), name: 'Foot', symbol: 'ft' },
];

module.exports = { adminRole, teamMemberRole, tradeProfessionalRole, measurementUnit };
