const router = require('express').Router();
const { CommonController } = require('../controllers');
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer(); // If you haven't set a custom storage yet
const commonController = new CommonController();
/* Order Management */
router.get('/profile', multer().any(), auth, commonController.getProfile);
router.put('/profile/:id', multer().any(), auth, commonController.updateProfile);
router.put("/profile/password/:id",  multer().any(), auth, commonController.updateUserPassword);

module.exports = router;
