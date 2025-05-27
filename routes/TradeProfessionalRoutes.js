const router = require('express').Router();
const auth = require("../middleware/authMiddleware");
const userValidation = require('../validation-helper/user-validate');
const TradeProfessionalController = require('../controllers').TradeProfessionalController;
const tradeProfessionalController = new TradeProfessionalController();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { saveFiles } = require('../middleware/fileUploadMiddleware');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Register Trade Professional Route
router.post(
  '/trade-professional',
  upload.fields([
    { name: 'business_documents', maxCount: 10 },
    { name: 'registration_certificate', maxCount: 1 },
    { name: 'trade_license', maxCount: 1 },
    { name: 'proof_of_business', maxCount: 10 },
  ]),
  userValidation.saveTradeProfessional,
  saveFiles,
  tradeProfessionalController.createTradeProfessional
);

// Update Trade Professional Route
router.put(
  '/trade-professional/:id',
  upload.fields([
    { name: 'business_documents', maxCount: 10 },
    { name: 'registration_certificate', maxCount: 1 },
    { name: 'trade_license', maxCount: 1 },
    { name: 'proof_of_business', maxCount: 10 },
  ]),
  auth,
  /* userValidation.updateTradeProfessional, */
  saveFiles,
  tradeProfessionalController.updateTradeProfessional
);

router.patch('/trade-professional/:token/status', multer().any(), tradeProfessionalController.updateTradeProfessionalStatus);
router.get('/trade-professional', multer().any(),auth, tradeProfessionalController.getDashboardData);

module.exports = router;