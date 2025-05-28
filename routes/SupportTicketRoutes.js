const router = require('express').Router();
const SupportTicketController = require('../controllers').SupportTicketController;
const supportTicketController = new SupportTicketController();
const supportTicketValidation = require('../validation-helper/support-ticket-validate');
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer(); // If you haven't set a custom storage yet

/* Support Ticket Management */
router.post('/', upload.any(), auth, supportTicketController.saveSupportTicket);
router.put('/:id', upload.any(), auth, supportTicketController.saveSupportTicket);
router.get('/', multer().any(),auth,  supportTicketController.supportTicketList);
router.delete('/:id', multer().any(), auth, supportTicketController.deleteSupportTicket);
router.patch('/:id/status', multer().any(), auth, supportTicketController.updateSupportTicketStatus);

/** Chat Related Routes For Support Ticket */
router.get('/chat', multer().any(), auth, supportTicketController.getChatByTicket);
router.get('/chat/:id', multer().any(), auth, supportTicketController.getChatByTicket);
router.post('/chat', multer().any(),auth,  supportTicketController.sendChatMessage );

module.exports = router;
