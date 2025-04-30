const mongoose = require('mongoose');
const constants = require('../configs/constant');
const Country = require('../models/Country');
const State = require('../models/State');
const City = require('../models/City');

module.exports = class LocationController {

    /** Get List Of Countries */
    async getCountries(req, res) {
        try {
            const countries = await Country.find({}, { _id: 1, name: 1 });
            const formatted = countries.map(country => ({ label: country.name, value: country._id }));
            return res.status(201).json({ message: "", data: formatted, });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Get List Of States Based On Selected Country Id */
    async getStatesByCountryId(req, res) {
        try {
            const states = await State.find({ country_id: parseInt(req.params.country_id) }, { _id: 1, name: 1 });
            const formatted = states.map(country => ({ label: country.name, value: country._id }));
            return res.status(201).json({ message: "", data: formatted, });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

     /** Get List Of Cities Based On Selected State Id */
    async getCitiesByStateId(req, res) {
        try {
            const cities = await City.find({ state_id: parseInt(req.params.state_id) }, { _id: 1, name: 1 });
            const formatted = cities.map(country => ({ label: country.name, value: country._id }));
            return res.status(201).json({ message: "", data: formatted, });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

};