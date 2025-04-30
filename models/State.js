const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const StateSchema = new Schema({
  name: { type: String, required: true },
  country_id: { type: Number, required: true },
  country_code: { type: String },
  country_name: { type: String },
  state_code: { type: String },
  type: { type: String }, // e.g., province, state, etc.
  latitude: { type: String },
  longitude: { type: String },
  country: {
    type: Schema.Types.ObjectId,
    ref: 'Country'
  }
}, {
  timestamps: true
});

StateSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('State', StateSchema);
