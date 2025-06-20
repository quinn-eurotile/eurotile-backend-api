const mongoose = require("mongoose");
const ProductMeasurementUnit = require('../models/ProductMeasurementUnit');
const { MONGO_URI } = process.env;
const constants = require('./constant');

mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000 // Increase timeout
    })
    .then(async () => {
        await ProductMeasurementUnit.deleteMany(); // optional: clears collection
        await ProductMeasurementUnit.insertMany(constants?.measurementUnit);
        // //console.log("database connection successful", MONGO_URI);
    })
    .catch((err) => {
        // //console.log("database connection failed", err);
    });