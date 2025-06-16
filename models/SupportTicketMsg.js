const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const supportTicketMsgSchema = new Schema({
    ticket: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
    sender: { type: Schema.Types.ObjectId, refPath: 'User', required: true },
    message: { type: String, defult: null },
    fileName: { type: String, defult: null },
    fileType: { type: String, enum: ['image', 'docs', 'video', 'pdf'], default: null, },
    filePath: { type: String, default: null },
    fileSize: { type: Number, default: 0 },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


supportTicketMsgSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SupportTicketMsg', supportTicketMsgSchema);
