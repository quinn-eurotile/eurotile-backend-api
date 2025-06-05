const router = require('express').Router();
const OrderController = require('../controllers').OrderController;
const orderController = new OrderController();
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer(); // If you haven't set a custom storage yet

/* Order Management */
router.get('/', multer().any(), auth, orderController.orderList);
router.get('/:id', multer().any(), auth, orderController.orderDetails);

module.exports = router;
