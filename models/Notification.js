const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    default: null
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    default: null
  },
  type: {
    type: String,
    enum: ['ORDER_STATUS','ORDER_CREATION', 'PAYMENT_CONFIRMATION', 'ADMIN_MESSAGE', 'TICKET_CREATION', 'TRADE_PROFESSIONAL_UPDATE'],
    default: 'TICKET_CREATION'
  },
  title: {
    type: String, 
    default: 'New Support Ticket'
  },
  message: {
    type: String, 
    default: 'You have received a new support ticket from {sender}'
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  visibility: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Role',
    default: [null] // null means visible to all
  },
  targetUsers: {    
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  targetRoles: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Role',
    default: []
  },
  excludeUsers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },        
  metadata: {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentDetail',
      default: null
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket',
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ senderId: 1 });
notificationSchema.index({ targetRoles: 1 });
notificationSchema.index({ visibility: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 