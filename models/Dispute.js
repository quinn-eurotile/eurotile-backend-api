const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    tradeProfessional: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    issueType: {
        type: String,
        enum: ['ORDER_ISSUE', 'PAYMENT_ISSUE', 'INVOICE_ISSUE', 'PRODUCT_ISSUE'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    attachments: [{
        type: String, // URLs to uploaded files
        required: false
    }],
    status: {
        type: Number,
        enum: [0, 1, 2, 3], // 0: Pending, 1: In Progress, 2: Resolved, 3: Closed
        default: 0
    },
    chatThread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatThread',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    resolution: {
        type: String,
        required: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Dispute', disputeSchema); 