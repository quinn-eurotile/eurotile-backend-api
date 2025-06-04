const router = require('express').Router();
const { getAddresses, saveAddress, deleteAddress,updateAddress } = require('../controllers/addressController');
const auth = require("../middleware/authMiddleware");

// Get all addresses
router.get('/:userId', auth, getAddresses);

// Create or update address
router.post('/', auth, saveAddress);
router.put('/:id', auth, updateAddress);

// Soft delete address
router.delete('/', auth, deleteAddress);



module.exports = router;
