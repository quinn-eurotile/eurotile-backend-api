const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const CitySchema = new Schema({
  name: { type: String, required: true },
  state_id: { type: Number, required: true },
  state_code: { type: String },
  state_name: { type: String },
  country_id: { type: Number, required: true },
  country_code: { type: String },
  country_name: { type: String },
  latitude: { type: String },
  longitude: { type: String },
  wikiDataId: { type: String },
  state: {
    type: Schema.Types.ObjectId,
    ref: 'State'
  },
  country: {
    type: Schema.Types.ObjectId,
    ref: 'Country'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  }
}, {
  timestamps: true
});

CitySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('City', CitySchema);
