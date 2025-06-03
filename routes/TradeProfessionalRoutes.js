const router = require('express').Router();
const auth = require("../middleware/authMiddleware");
const userValidation = require('../validation-helper/user-validate');
const TradeProfessionalController = require('../controllers').TradeProfessionalController;
const tradeProfessionalController = new TradeProfessionalController();
const multer = require('multer');
const { saveFiles } = require('../middleware/fileUploadMiddleware');
const user_validation = require('../validation-helper/user-validate');

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
router.put(  '/trade-professional/:id',
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
router.get('/trade-professional', auth, tradeProfessionalController.getDashboardData);
router.post('/trade-professional/create-connect-account', auth, tradeProfessionalController.createConnectAccount);

/* Client Management */
router.get('/trade-professional/client', multer().any(), auth, tradeProfessionalController.clientList);
router.post('/trade-professional/client', multer().any(), auth,  user_validation.saveCustomer,  tradeProfessionalController.saveClient);
router.put('/trade-professional/client/:id', multer().any(), auth, user_validation.saveCustomer, tradeProfessionalController.saveClient);
router.delete('/trade-professional/client/:id', multer().any(), auth, tradeProfessionalController.deleteClient);


module.exports = router;