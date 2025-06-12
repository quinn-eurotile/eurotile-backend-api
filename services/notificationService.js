const { getClientUrlByRole } = require('../utils/url');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const emailService = require('./emailService');

class NotificationService {
    constructor() {}

    async createNotification(data) {
        try {
            const notification = new Notification(data);
            await notification.save();
            return notification;
        } catch (error) {
            throw new Error('Failed to create notification: ' + error.message);
        }
    }

    async getUserNotifications(userId, query = {}) {
        try {
            const { page = 1, limit = 10, status } = query;
            const skip = (page - 1) * limit;

            const filter = { userId };
            if (status) {
                filter.status = status;
            }

            const notifications = await Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('metadata.orderId')
                .populate('metadata.paymentId')
                .populate('metadata.documentId');

            const total = await Notification.countDocuments(filter);

            return {
                notifications,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error('Failed to fetch notifications: ' + error.message);
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, userId },
                { status: 'read' },
                { new: true }
            );
            return notification;
        } catch (error) {
            throw new Error('Failed to mark notification as read: ' + error.message);
        }
    }

    async markAllAsRead(userId) {
        try {
            await Notification.updateMany(
                { userId, status: 'unread' },
                { status: 'read' }
            );
            return true;
        } catch (error) {
            throw new Error('Failed to mark all notifications as read: ' + error.message);
        }
    }

    async getUnreadCount(userId) {
        try {
            return await Notification.countDocuments({ userId, status: 'unread' });
        } catch (error) {
            throw new Error('Failed to get unread count: ' + error.message);
        }
    }

    // Order Status Notifications
    async notifyOrderStatusUpdate(order, newStatus, notes = '') {
        try {
            // Create notification for customer
            await this.createNotification({
                userId: order.customerId,
                type: 'ORDER_STATUS',
                title: `Order #${order.orderId} Status Updated`,
                message: `Your order status has been updated to: ${newStatus}${notes ? `. Notes: ${notes}` : ''}`,
                metadata: {
                    orderId: order._id
                }
            });

            // Send email to customer
            await emailService.sendEmail({
                template: 'order-status-update',
                email: order.customer.email,
                subject: `Order Status Update - #${order.orderId}`,
                context: {
                    orderId: order.orderId,
                    status: newStatus,
                    notes,
                    customerName: order.customer.name
                }
            });

            return true;
        } catch (error) {
            console.error('Error sending order status notification:', error);
            return false;
        }
    }

    // Payment Notifications
    async notifyPaymentConfirmation(payment, order) {
        try {
            // Create notification for customer
            await this.createNotification({
                userId: order.customerId,
                type: 'PAYMENT_CONFIRMATION',
                title: `Payment Confirmed for Order #${order.orderId}`,
                message: `Your payment of PHP ${payment.amount} has been confirmed for order #${order.orderId}`,
                metadata: {
                    orderId: order._id,
                    paymentId: payment._id
                }
            });

            // Send email
            await emailService.sendEmail({
                template: 'payment-confirmation',
                email: order.customer.email,
                subject: `Payment Confirmed - Order #${order.orderId}`,
                context: {
                    orderId: order.orderId,
                    amount: payment.amount,
                    customerName: order.customer.name,
                    paymentMethod: payment.method
                }
            });

            return true;
        } catch (error) {
            console.error('Error sending payment confirmation notification:', error);
            return false;
        }
    }

    // Document Approval/Rejection Notifications
    async notifyDocumentStatus(userId, document, status, reason = '') {
        try {
            // Create notification
            await this.createNotification({
                userId,
                type: 'ADMIN_MESSAGE',
                title: `Document ${status === 'approved' ? 'Approved' : 'Rejected'}: ${document.type}`,
                message: `Your ${document.type} has been ${status}${reason ? `. Reason: ${reason}` : ''}`,
                metadata: {
                    documentId: document._id
                }
            });

            // Get user email
            const user = await User.findById(userId);

            // Send email
            await emailService.sendEmail({
                template: 'document-status',
                email: user.email,
                subject: `Document ${status === 'approved' ? 'Approved' : 'Rejected'}: ${document.type}`,
                context: {
                    documentType: document.type,
                    status,
                    reason,
                    userName: user.name
                }
            });

            return true;
        } catch (error) {
            console.error('Error sending document status notification:', error);
            return false;
        }
    }

    // Account Verification Notifications
    async notifyAccountVerification(userId, status, reason = '') {
        try {
            // Create notification
            await this.createNotification({
                userId,
                type: 'ADMIN_MESSAGE',
                title: `Account ${status === 'verified' ? 'Verified' : 'Verification Failed'}`,
                message: `Your account has been ${status}${reason ? `. Reason: ${reason}` : ''}`,
                metadata: {}
            });

            // Get user email
            const user = await User.findById(userId);

            // Send email
            await emailService.sendEmail({
                template: 'account-verification',
                email: user.email,
                subject: `Account ${status === 'verified' ? 'Verified' : 'Verification Failed'}`,
                context: {
                    status,
                    reason,
                    userName: user.name
                }
            });

            return true;
        } catch (error) {
            console.error('Error sending account verification notification:', error);
            return false;
        }
    }

    // Supplier Order Notifications
    async notifySupplierNewOrder(order, supplier, items) {
        try {
            // Calculate supplier-specific totals
            const supplierSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const supplierShipping = order.shipping * (supplierSubtotal / order.subtotal);
            const supplierTotal = supplierSubtotal + supplierShipping;

            // Create notification for supplier
            await this.createNotification({
                userId: supplier._id,
                type: 'ORDER_STATUS',
                title: `New Order #${order.orderId}`,
                message: `You have received a new order worth PHP ${supplierTotal}`,
                metadata: {
                    orderId: order._id
                }
            });

            // Send email to supplier
            await emailService.sendEmail({
                template: 'supplier-new-order',
                email: supplier.email,
                subject: `New Order Notification - #${order.orderId}`,
                context: {
                    orderId: order.orderId,
                    items,
                    supplierName: supplier.companyName,
                    subtotal: supplierSubtotal,
                    shipping: supplierShipping,
                    total: supplierTotal,
                    clientUrl: getClientUrlByRole('Supplier')
                }
            });

            return true;
        } catch (error) {
            console.error('Error sending supplier order notification:', error);
            return false;
        }
    }
}

module.exports = new NotificationService(); 