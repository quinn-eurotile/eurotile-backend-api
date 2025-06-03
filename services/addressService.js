const Address = require('../models/Address'); 
/**
 * Get all active addresses for a user (can be trade professional ordering for someone else)
 */
async function getAddressesByUser(userId) {
  return Address.find({ userId, isDeleted: false }).exec();
}

/**
 * Create or update an address for a user
 */
async function saveAddressData(userId, addressData) {
  let address;

  if (addressData?._id) {
    // Update existing address
    address = await Address.findOne({ _id: addressData._id, userId, isDeleted: false });

    console.log(address,'addressaddressaddressaddress');

    if (!address) throw new Error("Address not found");

    Object.assign(address, addressData);
  } else {
    // Create new address
    address = new Address({
      userId,
      ...addressData,
    });
  }

  // If marked as default, unset others
  if (addressData.isDefault) {
    await Address.updateMany(
      { userId, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );
  }

  await address.save();
  return address;
}
/**
 * Update an address for a user (no creation)
 */
async function updateAddressData(userId, addressData) {
  if (!addressData?._id) {
    throw new Error("Address ID is required for updating");
  }

  // Find existing address
  const address = await Address.findOne({ _id: addressData._id, userId, isDeleted: false });

  console.log(address, 'addressaddressaddressaddress');

  if (!address) throw new Error("Address not found");

  // Update fields
  Object.assign(address, addressData);

  // If marked as default, unset others
  if (addressData.isDefault) {
    await Address.updateMany(
      { userId, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );
  }

  // Save updated address
  await address.save();

  return address;
}

/**
 * Soft delete address
 */
async function deleteData(userId, addressId) {
  const address = await Address.findOne({ _id: addressId, userId, isDeleted: false });
  if (!address) throw new Error("Address not found");

  address.isDeleted = true;
  await address.save();
  return address;
}

module.exports = { getAddressesByUser, saveAddressData, deleteData, updateAddressData };
