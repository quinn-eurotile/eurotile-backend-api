require('dotenv').config();
require("./configs/database");
const BodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const Express = require("express");
var cors = require('cors');
path = require('path');
const express = require('express');
const app = Express();


const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://eurotiles-admin.myfileshosting.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// app.use(cors()); 
/***** for parsing Cookie Parser ****/
app.use(cookieParser());
/***for parsing application/json***/
// Move the general body parser after the webhook route
// app.use(BodyParser.json());
// app.use(BodyParser.raw({ type: 'application/json' }));
app.use('/api/V1/webhook', BodyParser.raw({ type: 'application/json' }));
app.use(BodyParser.json({ limit: "50mb", verify: (req, res, buf) => { req.rawBody = buf; } }));
/*****for parsing application/xwww-*****/
app.use(BodyParser.urlencoded({ limit: "50mb", extended: true }));
// Setting the app router and static folder
app.use(Express.static(path.resolve('uploads')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import webhook routes
const webhookRoutes = require('./routes/WebhookRoutes');
// Mount webhook routes
app.use('/api/V1/webhook', webhookRoutes);

// Logic goes here
module.exports = app;
