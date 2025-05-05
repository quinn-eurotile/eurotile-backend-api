const router = require('express').Router();
const TaxController = require('../controllers').TaxController;
const taxController = new TaxController();
const auth = require("../middleware/authMiddleware");
const taxValidation = require('../validation-helper/tax-validate');


/* Categories Management */
router.post('/tax', auth, taxValidation.saveTax, taxController.saveTax);
router.put('/tax/:id', auth, taxValidation.saveTax, taxController.saveTax);
router.patch('/tax/:id/status', auth, taxController.updateTaxStatus);
router.get('/tax', auth, taxController.taxList);
router.get('/tax/:id', auth, taxController.getTax);
router.delete('/tax/:id', auth, taxController.deleteTax);

module.exports = router;
