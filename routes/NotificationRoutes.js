const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const NotificationController = require('../controllers/NotificationController');
const auth = require('../middleware/auth');

// Validation middleware
const createNotificationValidation = [
  check('type')
    .isIn(['ORDER_STATUS', 'PAYMENT_CONFIRMATION', 'ADMIN_MESSAGE'])
    .withMessage('Invalid notification type'),
  check('title').notEmpty().withMessage('Title is required'),
  check('message').notEmpty().withMessage('Message is required'),
  check('metadata').optional().isObject().withMessage('Metadata must be an object'),
  check('recipientId').optional().isMongoId().withMessage('Invalid recipient ID'),
  check('sendEmail').optional().isBoolean().withMessage('sendEmail must be a boolean')
];

// Routes
router.get('/', auth, NotificationController.getNotifications);
router.post('/', auth, createNotificationValidation, NotificationController.createNotification);
router.put('/:id/read', auth, NotificationController.markAsRead);
router.put('/mark-all-read', auth, NotificationController.markAllAsRead);
router.get('/unread-count', auth, NotificationController.getUnreadCount);

module.exports = router; 