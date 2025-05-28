const router = require('express').Router();
const { CommonController } = require('../controllers');
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const commonController = new CommonController();
/* Common Management */
router.get('/profile', multer().any(), auth, commonController.getProfile);
router.put('/profile/:id', upload.single("userImage"), auth, commonController.updateProfile);
router.put("/profile/password/:id",  multer().any(), auth, commonController.updateUserPassword);

module.exports = router;
