const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const TimezoneSchema = new Schema({
    zoneName: { type: String },
    gmtOffset: { type: Number },
    gmtOffsetName: { type: String },
    abbreviation: { type: String },
    tzName: { type: String }
}, { _id: false });

const CountrySchema = new Schema({
    name: { type: String, required: true },
    iso3: { type: String, required: true },
    iso2: { type: String, required: true },
    numeric_code: { type: String },
    phonecode: { type: String },
    capital: { type: String },
    currency: { type: String },
    currency_name: { type: String },
    currency_symbol: { type: String },
    tld: { type: String },
    native: { type: String },
    region: {
        type: Schema.Types.ObjectId,
        ref: 'regions'
    },
    region_id: { type: Number },
    subregion: {
        type: Schema.Types.ObjectId,
        ref: 'subregions'
    },
    subregion_id: { type: Number },
    nationality: { type: String },
    timezones: [TimezoneSchema],
    translations: { type: Map, of: String },
    latitude: { type: String },
    longitude: { type: String },
    emoji: { type: String },
    emojiU: { type: String }
}, {
    timestamps: true,
    _id: false 
});

CountrySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Country', CountrySchema);
