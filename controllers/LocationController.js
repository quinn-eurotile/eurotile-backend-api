const mongoose = require('mongoose');
const constants = require('../configs/constant');
const Country = require('../models/Country');
const State = require('../models/State');
const City = require('../models/City');

module.exports = class LocationController {

    async getCountries(req, res) {
        try {
            const countries = await Country.find({}, { _id: 1, name: 1 });
            return res.status(201).json({ message: "", data: countries, });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    async getStatesByCountryId(req, res) {
        try {
            const states = await State.find({ country_id: parseInt(req.params.country_id) }, { _id: 1, name: 1 });
            return res.status(201).json({ message: "", data: states, });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    async getCitiesByStateId(req, res) {
        try {
            const cities = await City.find({ state_id: parseInt(req.params.state_id) }, { _id: 1, name: 1});
            return res.status(201).json({ message: "", data: cities, });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

};