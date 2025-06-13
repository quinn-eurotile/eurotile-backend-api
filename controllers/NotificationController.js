const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
 

module.exports =  class NotificationController {
  async getNotifications(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const userId = req.user.id;

      const result = await notificationService.getUserNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      }); 

      return res.status(201).json({ message: "", data: result, });
    } catch (error) {
      console.error('Error fetching notifications:', error);
            return res.status(error?.statusCode || 500).json({ message: error?.message });
    }
  }

  async createNotification(req, res) {
    try {
      

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

      return res.status(201).json({ message: "", data: notification, });
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(error?.statusCode || 500).json({ message: error?.message });
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

      return res.status(201).json({ message: "", data: notification, });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(error?.statusCode || 500).json({ message: error?.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      await notificationService.markAllAsRead(userId);
      return res.status(201).json({ message: "", data: { success: true }, });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(error?.statusCode || 500).json({ message: error?.message });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      console.log("userId", userId);

      const count = await notificationService.getUnreadCount(userId);
      return res.status(201).json({ message: "", data: { count } });
    } catch (error) {
      console.error('Error getting unread count:', error);
        return res.status(error?.statusCode || 500).json({ message: error?.message });
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

 