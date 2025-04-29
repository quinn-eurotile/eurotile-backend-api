const supplierModel = require('../models/Supplier');
const bcrypt = require("bcryptjs");
const helpers = require("../_helpers/common");
const mongoose = require('mongoose');
const constants = require('../configs/constant');

class SupplierService {

    async createSupplier(req) {
        try {
            const { name, email, phone } = req.body;
            const lowerCaseEmail = email.trim().toLowerCase();
            const rawPassword = helpers.randomString(10);
            const hashedPassword = await bcrypt.hash(rawPassword, 10);
            const token = helpers.randomString(20);
    
            const newSupplier = new supplierModel({
                name,
                phone,
                token,
                email: lowerCaseEmail,
                password: hashedPassword,
                roles: [new mongoose.Types.ObjectId(String(constants?.teamMemberRole?.id))],
                status: 1,
                createdBy: req?.user?.id || null,
                updatedBy: req?.user?.id || null,
            });
    
            await newSupplier.save();
    
            return newSupplier
        } catch (error) {
            throw {
                message: error.message || 'Failed to create supplier',
                statusCode: error.statusCode || 500
            };
        }
    }

}

module.exports = new SupplierService();