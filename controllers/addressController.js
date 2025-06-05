const { getAddressesByUser, updateAddressData,saveAddressData , deleteData } = require('../services/addressService');

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
  console.log(address,'address');

  try {
    const savedAddress = await saveAddressData(req?.user?.id, address);
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

   console.log(req?.user,'req?.user?req?.user?req?.user?');
   
 
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
          
            const id = req.params.id;
            const deleted = await deleteData(req?.user?.id, id);
            if (!deleted) return res.status(404).json({ message: 'Address not found' });
            return res.status(200).json({ message: 'Address deleted successfully' });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }
 

module.exports = { getAddresses, saveAddress, deleteAddress,updateAddress };
