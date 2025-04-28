const mongoose = require("mongoose");

const { MONGO_URI } = process.env;

mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("database connection successful",MONGO_URI);
    })
    .catch((err) => {
        console.log("database connection failed", err);
    });