const router = require('express').Router();
const SupportTicketController = require('../controllers').SupportTicketController;
const supportTicketController = new SupportTicketController();
const auth = require("../middleware/authMiddleware");
const supportTicketValidation = require('../validation-helper/support-ticket-validate');


/* Support Ticket Management */
router.post('/support-ticket', auth, supportTicketValidation.saveSupportTicket, supportTicketController.saveSupportTicket);
router.get('/support-ticket', auth, supportTicketController.supportTicketList);

module.exports = router;
