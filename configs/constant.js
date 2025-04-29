const roles = [
  { name: "Admin", id: 1 },
  { name: "Attorney", id: 2 },
  { name: "Party", id: 3 },
];

const currencyOptions = [
  { name: "ued", icon: "$", id: 1 },
  { name: "eur", icon: "€", id: 2 },
];

const adminRole = { id: '680f110aa6224872fab09569', name: 'Admin' };
const teamMemberRole = { id: '680f606cb47c317ad30841b5', name: 'Team Member' };
const supplierRole = { id: '68109c73f40c15ef1e51bd5a', name: 'Supplier' };

module.exports = { roles, currencyOptions, adminRole, teamMemberRole, supplierRole };
