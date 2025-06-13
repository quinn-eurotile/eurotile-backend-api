const router = require('express').Router();
const NotificationController = require('../controllers').NotificationController;
const notificationController = new NotificationController();
const auth = require('../middleware/authMiddleware'); 
const { validateNotification } = require('../validators/notificationValidator');        
const multer = require('multer');

// Validation middleware
const createNotificationValidation = validateNotification;


// Routes
router.get('/', auth, notificationController.getNotifications);
router.post('/', multer().any(), auth, createNotificationValidation, notificationController.createNotification);    
router.put('/:id/read', auth, notificationController.markAsRead);
router.put('/mark-all-read', auth, notificationController.markAllAsRead);
router.get('/unread-count', auth, notificationController.getUnreadCount); 

module.exports = router; 