const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const userId = req.user.id;

      const result = await notificationService.getUserNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  async createNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, title, message, metadata, recipientId, sendEmail = false } = req.body;
      const userId = recipientId || req.user.id;

      const notification = await notificationService.createNotification({
        userId,
        type,
        title,
        message,
        metadata
      });

      // If sendEmail is true, send an email notification
      if (sendEmail) {
        await emailService.sendEmail({
          to: req.user.email,
          subject: title,
          template: 'notification',
          context: {
            title,
            message,
            type,
            actionUrl: this._getActionUrl(type, metadata)
          }
        });
      }

      res.json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Failed to create notification' });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.markAsRead(id, userId);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      await notificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  }

  _getActionUrl(type, metadata) {
    switch (type) {
      case 'ORDER_STATUS':
        return `/orders/${metadata.orderId}`;
      case 'PAYMENT_CONFIRMATION':
        return `/payments/${metadata.paymentId}`;
      case 'ADMIN_MESSAGE':
        return `/documents/${metadata.documentId}`;
      default:
        return '/notifications';
    }
  }
}

module.exports = new NotificationController(); 