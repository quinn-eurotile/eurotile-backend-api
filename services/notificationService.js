const Notification = require('../models/Notification');
const emailService = require('./emailService');
const { getClientUrlByRole } = require('../_helpers/common');
const User = require('../models/User');
const {
    adminRole,
    teamMemberRole,
    tradeProfessionalRole,
    clientRole
} = require('../configs/constant');

class NotificationService {
    constructor() {
        // Define available roles for notifications
        this.ROLES = {
            ADMIN: adminRole.id,
            TEAM_MEMBER: teamMemberRole.id,
            TRADE_PROFESSIONAL: tradeProfessionalRole.id,
            CLIENT: clientRole.id,
            // SUPPLIER: supplierRole.id
        };

        // Define notification types and their default visibility
        this.NOTIFICATION_TYPES = {
            ORDER_STATUS: {
                defaultVisibility: [this.ROLES.CLIENT, this.ROLES.ADMIN],
                defaultTargetRoles: [this.ROLES.ADMIN]
            },
            PAYMENT_CONFIRMATION: {
                defaultVisibility: [this.ROLES.CLIENT, this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER],
                defaultTargetRoles: [this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER]
            },
            TICKET_CREATION: {
                defaultVisibility: [this.ROLES.CLIENT, this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER],
                defaultTargetRoles: [this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER]
            },
            DOCUMENT_STATUS: {
                defaultVisibility: [this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER],
                defaultTargetRoles: [this.ROLES.ADMIN]
            },
            TRADE_PROFESSIONAL_UPDATE: {
                defaultVisibility: [this.ROLES.TRADE_PROFESSIONAL, this.ROLES.ADMIN],
                defaultTargetRoles: [this.ROLES.ADMIN]
            }
        };
    }

    async createNotification(data) {
        try {
            console.log('=== Starting createNotification ===');
            console.log('Input data:', JSON.stringify(data, null, 2));

            // Get default visibility and target roles for the notification type
            const notificationType = this.NOTIFICATION_TYPES[data.type] || {};
            console.log('Notification type config:', JSON.stringify(notificationType, null, 2));
            
            const defaultVisibility = notificationType.defaultVisibility || [null];
            const defaultTargetRoles = notificationType.defaultTargetRoles || [];
            
            console.log('Default visibility:', defaultVisibility);
            console.log('Default target roles:', defaultTargetRoles);

            // Add visibility and target users fields
            const notification = new Notification({     
                ...data,
                visibility: data.visibility || defaultVisibility,   
                targetUsers: data.targetUsers || [],
                targetRoles: data.targetRoles || defaultTargetRoles,
                excludeUsers: data.excludeUsers || [],
                senderId: data.senderId || data.userId, // If no sender specified, use userId
                userId: data.userId || data.senderId, 
            });
            
            console.log('Created notification object:', JSON.stringify(notification, null, 2));
            
            try {
                const savedNotification = await notification.save();
                console.log('Successfully saved notification:', JSON.stringify(savedNotification, null, 2));
                return savedNotification;
            } catch (saveError) {
                console.error('Error saving notification:', saveError);
                throw saveError;
            }
        } catch (error) {
            console.error('Error in createNotification:', error);
            throw {
                message: error?.message || 'Failed to create notification.',
                statusCode: error?.statusCode || 500,
                error: error
            };
        }
    }

    async getUserNotifications(userId, query = {}) {
        try {
            const { page = 1, limit = 10, status } = query;
            const skip = (page - 1) * limit;

            // Get user with roles
            const user = await User.findById(userId).populate('roles');
            console.log('User data for notifications:', JSON.stringify(user, null, 2));
            
            if (!user) {
                throw new Error('User not found');
            }

            // Get user's role IDs
            const userRoleIds = user.roles.map(role => role._id);
            console.log('User role IDs:', userRoleIds);

            // Build visibility filter based on user role and specific targeting
            const visibilityFilter = {
                $or: [
                    // Check if notification is visible to all (visibility contains null)
                    { visibility: { $elemMatch: { $eq: null } } },
                    // Check if user's roles match visibility roles
                    { visibility: { $in: userRoleIds } },
                    // Check if user is specifically targeted
                    { targetUsers: userId },
                    // Check if user's roles are targeted
                    { targetRoles: { $in: userRoleIds } },
                    // Check if notification is meant for this user
                    { userId: userId }
                ]
            };

            const filter = {
                $and: [
                    visibilityFilter,
                    // Exclude if user is in excludeUsers
                    { excludeUsers: { $ne: userId } }
                ]
            };
            
            if (status) {
                filter.status = status;
            }

            console.log('Final notification filter:', JSON.stringify(filter, null, 2));

            // First get notifications without population
            const notifications = await Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            // Then populate each notification individually to handle errors gracefully
            const populatedNotifications = await Promise.all(
                notifications.map(async (notification) => {
                    try {
                        // Populate each field individually
                        if (notification.metadata.orderId) {
                            await notification.populate('metadata.orderId');
                        }
                        if (notification.metadata.paymentId) {
                            await notification.populate('metadata.paymentId');
                        }
                        if (notification.metadata.documentId) {
                            await notification.populate('metadata.documentId');
                        }
                        if (notification.metadata.ticketId) {
                            await notification.populate('metadata.ticketId');
                        }
                        if (notification.targetUsers && notification.targetUsers.length > 0) {
                            await notification.populate('targetUsers', 'name email roles');
                        }
                        if (notification.senderId) {
                            await notification.populate('senderId', 'name email roles');
                        }
                        if (notification.visibility && notification.visibility.length > 0) {
                            await notification.populate('visibility');
                        }
                        if (notification.targetRoles && notification.targetRoles.length > 0) {
                            await notification.populate('targetRoles');
                        }
                        return notification;
                    } catch (populateError) {
                        console.error('Error populating notification:', populateError);
                        // Return the notification without population if there's an error
                        return notification;
                    }
                })
            );

            console.log('Found notifications:', populatedNotifications.length);

            const total = await Notification.countDocuments(filter);

            return {
                notifications: populatedNotifications,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error in getUserNotifications:', error);
            throw {
                message: error?.message || 'Failed to fetch notifications.',
                statusCode: error?.statusCode || 500,
                error: error
            };
        }
    }

    // Helper method to get users by roles
    async getUsersByRoles(roles) {
        try {
            return await User.find({ role: { $in: roles } }).select('_id');
        } catch (error) {
            console.error('Error getting users by roles:', error);
            return [];
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
    async notifyOrderStatusUpdate(order, newStatus, notes = '', { additionalUsers = [], additionalRoles = [], excludeUsers = [] } = {}) {
        try {
            // Create notification for customer with specific targeting
            await this.createNotification({
                userId: order.customerId,
                type: 'ORDER_STATUS',
                title: `Order #${order.order} Status Updated`,
                message: `Your order status has been updated to: ${newStatus}${notes ? `. Notes: ${notes}` : ''}`,
                metadata: {
                    orderId: order._id
                },
                visibility: [this.ROLES.CLIENT, this.ROLES.ADMIN],
                targetUsers: [order.customerId, ...additionalUsers],
                targetRoles: [this.ROLES.ADMIN, ...additionalRoles],
                excludeUsers
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
            throw {
                message: error?.message || 'Failed to send order status notification.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    // Payment Notifications
    async notifyPaymentConfirmation(payment, order) {
        try {
            // Create notification for customer
            await this.createNotification({
                userId: constants.adminRole.id,  // client
                senderId: order.clientOf._id,  // client
                type: order.orderStatus === 2 ? 'PAYMENT_CONFIRMATION' : 'PAYMENT_FAILED',
                title: order.orderStatus === 2 ?    `Payment Confirmed for Order #${order.orderId}` : `Payment Failed for Order #${order.orderId}`,
                message: order.orderStatus === 2 ? `Your payment of € ${payment.amount.toFixed(2)} has been confirmed for order #${order.orderId}` : `Your payment of € ${payment.amount.toFixed(2)} has been failed for order #${order.orderId}`,
                metadata: {
                    orderId: order._id,
                    paymentId: payment._id
                },
                visibility: [this.ROLES.CLIENT, this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER, this.ROLES.TRADE_PROFESSIONAL]   // Customers, admins, and finance team can see payment notifications
            });

            // Create notification for finance team
            await this.createNotification({
                userId: constants.adminRole.id,
                senderId: order.createdBy._id, 
                type: order.orderStatus === 2 ? 'PAYMENT_CONFIRMATION' : 'PAYMENT_FAILED',
                title: order.orderStatus === 2 ? `New Payment Received: Order #${order.orderId}` : `Payment Failed for Order #${order.orderId}`,
                message: order.orderStatus === 2 ? `Payment of € ${payment.amount.toFixed(2)} received for order #${order.orderId}` : `Payment of € ${payment.amount.toFixed(2)} failed for order #${order.orderId}`,
                metadata: {
                    orderId: order._id,
                    paymentId: payment._id
                },
                visibility: [this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER] // Only admins and finance team can see this notification
            });

            // Send email

            await emailService.sendEmail({
                template: order.orderStatus === 2 ? 'payment-confirmation' : 'payment-failed',
                email: order.clientOf.email,
                subject: order.orderStatus === 2 ? `Payment Confirmed - Order #${order.orderId}` : `Payment Failed - Order #${order.orderId}`,
                context: {
                    orderId: order.orderId,
                    amount: payment.amount.toFixed(2),
                    customerName: order.clientOf.name,
                    paymentMethod: payment.method,
                    status: order.orderStatus === 2 ? 'confirmed' : 'failed'
                }
            });

            return true;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to send payment confirmation notification.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    // Document Approval/Rejection Notifications
    async notifyDocumentStatus(userId, document, status, reason = '') {
        try {
            // Create notification for user
            await this.createNotification({
                userId,
                type: 'ADMIN_MESSAGE',
                title: `Document ${status === 'approved' ? 'Approved' : 'Rejected'}: ${document.type}`,
                message: `Your ${document.type} has been ${status}${reason ? `. Reason: ${reason}` : ''}`,
                metadata: {
                    documentId: document._id
                },
                visibility: [this.ROLES.ADMIN, document.userRole || this.ROLES.CLIENT] // Admins and document owner's role can see
            });

            // Create notification for admin team
            await this.createNotification({
                userId: null,
                type: 'ADMIN_MESSAGE',
                title: `Document ${status}: ${document.type}`,
                message: `Document ${document.type} has been ${status} for user ${userId}`,
                metadata: {
                    documentId: document._id
                },
                visibility: [this.ROLES.ADMIN] // Only admins can see this notification
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
            throw {
                message: error?.message || 'Failed to send document status notification.',
                statusCode: error?.statusCode || 500
            };
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
            throw {
                message: error?.message || 'Failed to get product raw data.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    // Supplier Order Notifications
    // async notifySupplierNewOrder(order, supplier, items) {
    //     try {
    //         // Calculate supplier-specific totals
    //         const supplierSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    //         const supplierShipping = order.shipping * (supplierSubtotal / order.subtotal);
    //         const supplierTotal = supplierSubtotal + supplierShipping;

    //         // Create notification for supplier
    //         await this.createNotification({
    //             userId: supplier._id,
    //             type: 'ORDER_STATUS',
    //             title: `New Order #${order.orderId}`,
    //             message: `You have received a new order worth PHP ${supplierTotal}`,
    //             metadata: {
    //                 orderId: order._id
    //             }
    //         });

    //         // Send email to supplier
    //         await emailService.sendEmail({
    //             template: 'supplier-new-order',
    //             email: supplier.email,
    //             subject: `New Order Notification - #${order.orderId}`,
    //             context: {
    //                 orderId: order.orderId,
    //                 items,
    //                 supplierName: supplier.companyName,
    //                 subtotal: supplierSubtotal,
    //                 shipping: supplierShipping,
    //                 total: supplierTotal,
    //                 clientUrl: getClientUrlByRole('Supplier')
    //             }
    //         });

    //         return true;
    //     } catch (error) {
    //         throw {
    //             message: error?.message || 'Failed to get product raw data.',
    //             statusCode: error?.statusCode || 500
    //         };
    //     }
    // }

    // Method to notify specific users about an event
    async notifySpecificUsers({ users, roles, excludeUsers, title, message, type, metadata }) {
        try {
            // Create notification with specific targeting
            const notification = await this.createNotification({
                type,
                title,
                message,
                metadata,
                targetUsers: users || [], // Specific user IDs
                targetRoles: roles || [], // Specific roles
                excludeUsers: excludeUsers || [], // Users to exclude
                visibility: 'targeted' // Special visibility type for targeted notifications
            });

            // Get all target users (both specific users and users with specified roles)
            const targetUserIds = new Set(users || []);
            if (roles && roles.length > 0) {
                const roleUsers = await this.getUsersByRoles(roles);
                roleUsers.forEach(user => targetUserIds.add(user._id.toString()));
            }

            // Remove excluded users
            if (excludeUsers) {
                excludeUsers.forEach(userId => targetUserIds.delete(userId));
            }

            // Send emails to all target users
            const targetUsers = await User.find({ _id: { $in: Array.from(targetUserIds) } });
            for (const user of targetUsers) {
                await emailService.sendEmail({
                    template: 'general-notification',
                    email: user.email,
                    subject: title,
                    context: {
                        title,
                        message,
                        userName: user.name
                    }
                });
            }

            return notification;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to send targeted notification.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async notifyTicketCreation(ticket, { senderId, userId, additionalUsers = [], additionalRoles = [], excludeUsers = [] } = {}) {
        try {
            console.log('=== Starting notifyTicketCreation ===');
            console.log('Ticket data:', JSON.stringify(ticket, null, 2));
            console.log('Additional params:', JSON.stringify({ senderId, userId, additionalUsers, additionalRoles, excludeUsers }, null, 2));

            // Get all support team members and admins
            const supportTeam = await this.getUsersByRoles([this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER]);
            const supportTeamIds = supportTeam.map(user => user._id.toString());
            console.log('Support team IDs:', supportTeamIds);

            // If no specific userId provided, use the first support team member
            const targetUserId = userId || supportTeamIds[0];
            const notificationSenderId = senderId || ticket.sender;

            // Create notification for support team
            const notification = await this.createNotification({
                userId: targetUserId,
                senderId: notificationSenderId,
                type: 'TICKET_CREATION',
                title: `New Support Ticket #${ticket.ticketNumber}`,
                message: `New support ticket from ${ticket.sender}`,
                metadata: {
                    ticketId: ticket._id
                },
                // Set visibility to admin and team member roles
                visibility: [this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER],
                // Target specific roles
                targetRoles: [this.ROLES.ADMIN, this.ROLES.TEAM_MEMBER, ...additionalRoles],
                // Target specific users
                targetUsers: [...supportTeamIds, ...additionalUsers],
                excludeUsers
            });

            console.log('Created notification:', JSON.stringify(notification, null, 2));

            return {
                success: true,
                data: {
                    status: 'success',
                    message: 'Notification created successfully',
                    data: notification
                }
            };
        } catch (error) {
            console.error('Error in notifyTicketCreation:', error);
            throw {
                message: error?.message || 'Failed to create ticket notification.',
                statusCode: error?.statusCode || 500,
                error: error
            };
        }
    }

    async notifyTradeProfessional(userId, type, message, { additionalUsers = [], additionalRoles = [], excludeUsers = [] } = {}) {
        try {
            await this.createNotification({
                userId,
                type: 'TRADE_PROFESSIONAL_UPDATE',
                title: `Trade Professional Update`,
                message,
                metadata: {
                    type
                },
                visibility: [this.ROLES.TRADE_PROFESSIONAL, this.ROLES.ADMIN],
                targetUsers: [userId, ...additionalUsers],
                targetRoles: [this.ROLES.ADMIN, ...additionalRoles],
                excludeUsers
            });

            const user = await User.findById(userId);
            if (user && user.email) {
                await emailService.sendEmail({
                    template: 'trade-professional-update',
                    email: user.email,
                    subject: `Trade Professional Update`,
                    context: {
                        message,
                        type,
                        userName: user.name
                    }
                });
            }

            return true;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to send trade professional notification.',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async notifyOrderCreation(order, { senderId, userId, additionalUsers = [], additionalRoles = [], excludeUsers = [] } = {}) {
        try {
            await this.createNotification({
                senderId,
                userId,
                type: 'ORDER_CREATION',
                title: `New Order #${order.orderId}`,       
                message: `New order has been created for you`,
                metadata: {
                    orderId: order._id
                },
                visibility: [this.ROLES.TRADE_PROFESSIONAL, this.ROLES.ADMIN],
                targetUsers: [userId, ...additionalUsers],
                targetRoles: [this.ROLES.ADMIN, ...additionalRoles],
                excludeUsers
            });

            return true;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to send order creation notification.',
                statusCode: error?.statusCode || 500
            };  
        }
    }

}

module.exports = new NotificationService(); 