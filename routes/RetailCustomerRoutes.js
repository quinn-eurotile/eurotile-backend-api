const router = require('express').Router();
const userValidation = require('../validation-helper/user-validate');
const RetailCustomerController = require('../controllers').RetailCustomerController;
const retailCustomerController = new RetailCustomerController();
const multer = require('multer');
const auth = require('../middleware/authMiddleware');

// Register Retail Customer Route
router.post('/retail-customer',  multer().any(), userValidation.saveRetailCustomer,  retailCustomerController.createRetailCustomer);
router.get('/retail-customer', multer().any(), auth, retailCustomerController.getDashboardData);
router.get('/retail-customer/:id', multer().any(), auth, retailCustomerController.getRetailCustomerById);
router.put('/retail-customer/:id', multer().any(), auth, retailCustomerController.updateRetailCustomer);


module.exports = router;