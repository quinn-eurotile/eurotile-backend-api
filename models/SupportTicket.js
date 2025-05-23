const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const supportTicketSchema = new Schema({
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    status: { type: Number, default: 1 }, //  1: 'Open', 2: 'Closed', 3: 'Pending', 4: 'In Progress', 5: 'Resolved', 6: 'Rejected', 7: 'Cancelled'
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

supportTicketSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
