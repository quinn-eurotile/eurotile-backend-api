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



module.exports = routes;