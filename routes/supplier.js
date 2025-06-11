const express = require('express');
const router = express.Router();
const { authenticateSupplier } = require('../middleware/auth');
const supplierOrderRoutes = require('./supplier/orders');

// Supplier authentication routes
router.post('/login', supplierAuthController.login);
router.post('/register', supplierAuthController.register);
router.post('/forgot-password', supplierAuthController.forgotPassword);
router.post('/reset-password', supplierAuthController.resetPassword);

// Protected supplier routes
router.use(authenticateSupplier);

// Profile management
router.get('/profile', supplierController.getProfile);
router.put('/profile', supplierController.updateProfile);

// Product management
router.use('/products', supplierProductRoutes);

// Order management
router.use('/orders', supplierOrderRoutes);

module.exports = router; 