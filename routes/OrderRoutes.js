const router = require('express').Router();
const OrderController = require('../controllers').OrderController;
const orderController = new OrderController();
const auth = require("../middleware/authMiddleware");
const multer = require("multer");

/* Order Management */
router.get('/', multer().any(), auth, orderController.orderList);
router.get('/stats', multer().any(), auth, orderController.getStats);
router.get('/customer/:customerId', multer().any(), auth, orderController.getCustomerOrders);
router.get('/:id', multer().any(), auth, orderController.orderDetails);
router.put('/:id/status', multer().any(), auth, orderController.updateOrderStatus);

module.exports = router;
