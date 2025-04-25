const mongoose = require('mongoose');
const { Schema } = mongoose;

const supportTicketMsgSchema = new Schema({
    ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
    senderId: { type: Schema.Types.ObjectId, refPath: 'User', required: true },
    senderType: { type: String, required: true, enum: ['Retail', 'Trade'] },
    message: { type: String, required: true },
    attachments: [{ type: String, default: [] }],
    createdAt: { type: Date, default: Date.now },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('SupportTicketMsg', supportTicketMsgSchema);
