const { getAddressesByUser, updateAddressData,saveAddressdata , deleteData } = require('../services/addressService');

async function getAddresses(req, res) {
  try {
    const userId = req.params.userId;
    const addresses = await getAddressesByUser(userId);
    res.json({
      success: true,
      message: "Addresses retrieved successfully",
      data: addresses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function saveAddress(req, res) {
  const {  address } = req.body;
 
  try {
    const savedAddress = await saveAddressdata(req?.user?.id, address);
    res.json({
      success: true,
      message: "Address saved successfully",
      data: savedAddress
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}
async function updateAddress(req, res) {
  const {  address } = req.body;
 
  try {
    const savedAddress = await updateAddressData(req?.user?.id, address);
    res.json({
      success: true,
      message: "Address saved successfully",
      data: savedAddress
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}
async function deleteAddress(req, res) {
  try {
    const { userId, addressId } = req.body;
    await deleteData(userId, addressId);
    res.json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

module.exports = { getAddresses, saveAddress, deleteAddress,updateAddress };
