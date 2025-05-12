const routes = require('express').Router();
const { API_V } = process.env;

/*************Admin route**************/
const adminRoutes = require('./AdminRoutes'); 
routes.use(`/api/${API_V}/admin`, adminRoutes);

/*************Role Permission**************/
const rolePermissionRoutes = require('./RolePermissionRoute');
routes.use(`/api/${API_V}/role-permission`, rolePermissionRoutes);

/************* Location route**************/
const locationRoutes = require('./LocationRoutes');
routes.use(`/api/${API_V}/location`, locationRoutes);

/************* Categories route**************/
const categoryRoutes = require('./CategoryRoutes');
routes.use(`/api/${API_V}/category`, categoryRoutes);

/************* Categories route**************/
const taxRoutes = require('./TaxRoutes');
routes.use(`/api/${API_V}/admin`, taxRoutes);

/************* Trade Professional route**************/
const tradeProfessionalRoutes = require('./TradeProfessionalRoutes');
routes.use(`/api/${API_V}/user`, tradeProfessionalRoutes);


module.exports = routes;