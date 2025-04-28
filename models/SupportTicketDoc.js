const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const supportTicketDocSchema = new Schema({
  ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // Optional
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Sets the created_at parameter equal to the current time
supportTicketDocSchema.pre("save", async function (next) {
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

supportTicketDocSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SupportTicketDoc', supportTicketDocSchema);
