const router = require('express').Router();
const SupportTicketController = require('../controllers').SupportTicketController;
const supportTicketController = new SupportTicketController();
const auth = require("../middleware/authMiddleware");
const supportTicketValidation = require('../validation-helper/support-ticket-validate');
const multer = require("multer");
const upload = multer(); // If you haven't set a custom storage yet

/* Support Ticket Management */
router.post('/', auth, multer().any(), supportTicketValidation.saveSupportTicket, supportTicketController.saveSupportTicket);
router.put('/:id', auth, multer().any(), supportTicketValidation.saveSupportTicket, supportTicketController.saveSupportTicket);
router.get('/', auth, multer().any(), supportTicketController.supportTicketList);

module.exports = router;
