const router = require('express').Router();
const auth = require("../middleware/authMiddleware");
const user_validation = require('../validation-helper/user-validate');
const TradeProfessionalController = require('../controllers').TradeProfessionalController;
const tradeProfessionalController = new TradeProfessionalController(); 
const multer = require("multer");

// /* Trade Professional Management */
// router.get('/user/trade-professional', multer().any(), auth, tradeProfessionalController.tradeProfessionalList);
router.post('/user/trade-professional', multer().any(), auth,  tradeProfessionalController.createTradeProfessional);
// router.put('/user/trade-professional/:id', multer().any(), auth, user_validation.saveTradeProfessional, tradeProfessionalController.updateTradeProfessional);
// router.delete('/user/trade-professional/:id', multer().any(), auth, tradeProfessionalController.deleteTradeProfessional);
// router.patch('/user/trade-professional/:id/status', multer().any(), auth, tradeProfessionalController.updateTradeProfessionalStatus);


module.exports = router;