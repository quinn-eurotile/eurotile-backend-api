const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

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

// Sets the created_at parameter equal to the current time
supportTicketMsgSchema.pre("save", async function (next) {
    try {
        now = new Date();
        this.updatedAt = now;
        if (this.isNew) {
            this.createdAt = now;
        }
        next();
    } catch (err) {
        next(err);
    }
  });
  
  supportTicketMsgSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SupportTicketMsg', supportTicketMsgSchema);
