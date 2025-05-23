const User = require('./User');
const Order = require('./Order');
const Product = require('./Product');
const ProductFile = require('./ProductFile');
const ProductAttribute = require('./ProductAttribute');
const Role = require('./Role');
const Permission = require('./Permission');
const Promotion = require('./Promotion');
const Supplier = require('./Supplier');
const SupplierDiscount = require('./SupplierDiscount');
const SupportTicket = require('./SupportTicket');
const SupportTicketMsg = require('./SupportTicketMsg');
const UserBusiness = require('./UserBusiness');
const UserBusinessDocument = require('./UserBusinessDocument');
const Category = require('./Category');
const Tax = require('./Tax');
const ProductMeasurementUnit = require('./ProductMeasurementUnit');
const ProductAttributeVariation = require('./ProductAttributeVariation');
const ProductVariation = require('./ProductVariation');



module.exports = { ProductVariation,ProductAttributeVariation,ProductMeasurementUnit,Tax, Category, SupplierDiscount, User, Order, Product, ProductFile, ProductAttribute, Role, Permission, Promotion, Supplier, SupportTicket, SupportTicketMsg, UserBusinessDocument, UserBusiness };