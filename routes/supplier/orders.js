const express = require('express');
const router = express.Router();
const supplierOrderController = require('../../controllers/SupplierOrderController');
const { authenticateSupplier } = require('../../middleware/auth');

// Get all orders for a supplier with pagination
router.get('/', authenticateSupplier, supplierOrderController.getOrders);

// Get specific order details for a supplier
router.get('/:orderId', authenticateSupplier, supplierOrderController.getOrderDetails);

// Update supplier order status
router.patch('/:orderId/status', authenticateSupplier, supplierOrderController.updateOrderStatus);

module.exports = router; 