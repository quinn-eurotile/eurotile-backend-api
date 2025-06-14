const UserController = require('./UserController');
const RolePermissionController = require('./RolePermissionController');
const AdminController = require('./AdminController');
const CategoryController = require('./CategoryController');
const LocationController = require('./LocationController');
const TaxController = require('./TaxController');
const TradeProfessionalController = require('./TradeProfessionalController');
const ProductController = require('./ProductController');
const SupportTicketController = require('./SupportTicketController');
const OrderController = require('./OrderController');
const CommonController = require('./CommonController');
const WebhookController = require('./WebhookController');
const PaymentController = require('./paymentController');

module.exports = { PaymentController,WebhookController,CommonController,OrderController,ProductController, TradeProfessionalController, TaxController, AdminController, UserController, LocationController, RolePermissionController, CategoryController, SupportTicketController };