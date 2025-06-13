const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['created', 'updated', 'status_changed', 'tracking_updated', 'email_sent', 'note_added', 'forward_to_suppliers']
    },
    previousStatus: {
        type: Number,
        default: null
    },
    newStatus: {
        type: Number,
        default: null
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('OrderHistory', orderHistorySchema); 