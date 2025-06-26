const router = require('express').Router();
const PromotionController = require('../controllers/PromotionController');
const promotionController = new PromotionController();
const auth = require("../middleware/authMiddleware");
const multer = require("multer");

/* Promotion Management */
router.post('/', multer().any(), auth, promotionController.savePromotion);
router.put('/:id', multer().any(), auth, promotionController.savePromotion);
router.get('/', multer().any(), auth, promotionController.promotionList);
router.delete('/:id', multer().any(), auth, promotionController.deletePromotion);
router.patch('/:id/status', multer().any(), auth, promotionController.updatePromotionStatus);

module.exports = router;