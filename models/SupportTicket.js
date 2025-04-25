const mongoose = require('mongoose');
const { Schema } = mongoose;

const supportTicketSchema = new Schema({
    ticketNumber: { type: String, required: true, unique: true },
    issue: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    status: { type: String, enum: ['open', 'awaiting response', 'resolved'], default: 'open' },
    requestDateTime: { type: Date, default: Date.now },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
