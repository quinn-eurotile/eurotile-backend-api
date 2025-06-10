const express = require('express');
const router = express.Router();
const DisputeController = require('../controllers/DisputeController');
const { validateRequest } = require('../middleware/validateRequest');
const { disputeValidate } = require('../validation-helper/dispute-validate');
const { auth } = require('../middleware/auth');

const disputeController = new DisputeController();

// Trade Professional Routes
router.post('/', auth, disputeController.createDispute);

router.get('/', auth, disputeController.disputeList);

router.get('/:id', auth, disputeController.getDisputeById);

// Admin Routes
router.put('/status/:id', auth, validateRequest(disputeValidate.updateStatus), disputeController.updateDisputeStatus);

router.delete('/:id', auth, disputeController.deleteDispute);

module.exports = router; 