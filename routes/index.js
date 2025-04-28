const routes = require('express').Router();
const { API_V } = process.env;

/*************Admin route**************/
const adminRoutes = require('./AdminRoutes'); 
routes.use(`/api/${API_V}/admin`, adminRoutes);

// /*************Role Permission**************/
const rolePermissionRoutes = require('./RolePermissionRoute');
routes.use(`/api/${API_V}/role-permission`, rolePermissionRoutes);

// /*************User route**************/
// const userRoutes = require('./UserRoutes');
// routes.all('/api/' + API_V + '/user/*', userRoutes);



module.exports = routes;