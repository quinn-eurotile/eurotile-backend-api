const mongoose = require("mongoose");

const adminRole = { id: '680f110aa6224872fab09569', name: 'Admin' };
const teamMemberRole = { id: '680f606cb47c317ad30841b5', name: 'Team Member' };
const tradeProfessionalRole = { id: '6819ce06bb8f30e6c73eba48', name: 'Trade Professional' };
const clientRole = { id: '683ec5d85fabaae3a4c5de07', name: 'Client' };
// Predefined ObjectIDs for consistency
const measurementUnit = [
 // Length Units
  { _id: new mongoose.Types.ObjectId('000000000000000000000001'), name: 'Millimeter', symbol: 'mm', type: 'length' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000002'), name: 'Centimeter', symbol: 'cm', type: 'length' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000003'), name: 'Meter', symbol: 'm', type: 'length' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000004'), name: 'Inch', symbol: 'in', type: 'length' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000005'), name: 'Foot', symbol: 'ft', type: 'length' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000006'), name: 'Yard', symbol: 'yd', type: 'length' },

  // Area Units
  { _id: new mongoose.Types.ObjectId('000000000000000000000007'), name: 'Square Meter', symbol: 'm²', type: 'area' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000008'), name: 'Square Foot', symbol: 'ft²', type: 'area' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000009'), name: 'Square Yard', symbol: 'yd²', type: 'area' },

  // Volume Units
  { _id: new mongoose.Types.ObjectId('000000000000000000000010'), name: 'Liter', symbol: 'L', type: 'volume' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000011'), name: 'Cubic Meter', symbol: 'm³', type: 'volume' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000012'), name: 'Cubic Foot', symbol: 'ft³', type: 'volume' },

  // Weight Units
  { _id: new mongoose.Types.ObjectId('000000000000000000000013'), name: 'Gram', symbol: 'g', type: 'weight' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000014'), name: 'Kilogram', symbol: 'kg', type: 'weight' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000015'), name: 'Pound', symbol: 'lb', type: 'weight' },

  // Piece / Count Unit
  { _id: new mongoose.Types.ObjectId('000000000000000000000016'), name: 'Piece', symbol: 'pc', type: 'count' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000017'), name: 'Box', symbol: 'box', type: 'count' },
  { _id: new mongoose.Types.ObjectId('000000000000000000000018'), name: 'Pallet', symbol: 'pallet', type: 'count' },
];

module.exports = { adminRole, teamMemberRole, tradeProfessionalRole, measurementUnit, clientRole };