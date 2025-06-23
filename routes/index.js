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

/************* Product route**************/
const productRoutes = require('./ProductRoutes');
routes.use(`/api/${API_V}/product`, productRoutes);

/************* Support Ticket route**************/
const supportTicketRoutes = require('./SupportTicketRoutes');
routes.use(`/api/${API_V}/support-ticket`, supportTicketRoutes);

/************* Order route**************/
const orderRoutes = require('./OrderRoutes');
routes.use(`/api/${API_V}/order`, orderRoutes);

/************* Order route**************/
const commonRoutes = require('./CommonRoutes');
routes.use(`/api/${API_V}/`, commonRoutes);

/************* Cart route**************/
const cartRoutes = require('./cartRoutes');
routes.use(`/api/${API_V}/cart`, cartRoutes);

/************* Address route**************/
const addressRoutes = require('./addressRoutes');
routes.use(`/api/${API_V}/address`, addressRoutes);

/************* Webhook route**************/
const webhookRoutes = require('./WebhookRoutes');
routes.use(`/api/${API_V}/webhook`, webhookRoutes);

/************* PaymentRoutes route**************/
const paymentRoutes = require('./paymentRoutes');
routes.use(`/api/${API_V}/payment`, paymentRoutes);

/************* Notification route**************/
const notificationRoutes = require('./NotificationRoutes');
routes.use(`/api/${API_V}/notification`, notificationRoutes);      

/************* Retail Customer route**************/
const retailCustomerRoutes = require('./RetailCustomerRoutes');
routes.use(`/api/${API_V}/user`, retailCustomerRoutes);

        


module.exports = routes;