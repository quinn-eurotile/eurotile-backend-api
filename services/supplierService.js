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
            const newSupplier = new supplierModel({
                name,
                phone,
                email: lowerCaseEmail,
                status: 1,
                createdBy: req?.user?.id || null,
                updatedBy: req?.user?.id || null,
            });

            await newSupplier.save();

            if (!newSupplier) {
                throw { message: 'Failed to create team member', statusCode: 500 };
            }

            return newSupplier;
        } catch (error) {
            throw {
                message: error.message || 'Failed to create supplier',
                statusCode: error.statusCode || 500
            };
        }
    }

    /** Get Supplier List */
    async supplierList(query, options) {
        try {
            const result = await supplierModel.paginate(query, options);
            if (!result) {
                throw { message: 'Supplier list not found', statusCode: 404 };
            }
            return result;
        } catch (error) {
            console.log(error, 'error');

            throw {
                message: error?.message || 'Something went wrong while fetching supplier',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async buildSupplierListQuery(req) {
        const query = req.query;
        const conditionArr = [
            {
                createdBy: new mongoose.Types.ObjectId(String(req.user.id)),
                isDeleted: false,
            },
        ];
        if (query.status !== undefined) {
            if (query.status === "0") {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1") {
                conditionArr.push({ status: 1 });
            }
        }


        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { name: new RegExp(query.search_string, "i") },
                    { email: new RegExp(query.search_string, "i") },
                    { phone: new RegExp(query.search_string, "i") },
                ],
            });
        }

        // Construct the final query
        let builtQuery = {};
        if (conditionArr.length === 1) {
            builtQuery = conditionArr[0];
        } else if (conditionArr.length > 1) {
            builtQuery = { $and: conditionArr };
        }

        return builtQuery;
    }

    /*** Update Supplier By Id ***/
    async updateSupplierById(req) {
        try {
            const { name, email, phone } = req.body;
            const { id } = req.params;

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw {
                    message: 'Invalid supplier ID',
                    statusCode: 400
                };
            }

            const lowerCaseEmail = email.trim().toLowerCase();

            const updatedSupplierData = await supplierModel.findByIdAndUpdate(
                id,
                { name, phone, email: lowerCaseEmail },
                { new: true }
            );

            if (!updatedSupplierData) {
                throw {
                    message: 'Supplier not found',
                    statusCode: 404
                };
            }

            return updatedSupplierData;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update supplier',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async softDeleteSupplier(userId) {
        try {
            // const isUserAssignToCase = await caseModal.findOne({ case_team: { $in: [userId] } });
            // if (isUserAssignToCase) throw new Error("User is already assigned to another case");
            // Find the user and update the `deleted_at` field

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw {
                    message: 'Invalid supplier ID',
                    statusCode: 400
                };
            }
            const supplier = await supplierModel.findById({ _id: userId });
            if (!supplier) throw new Error({ message: 'Supplier not found', statusCode: 404 });
            supplier.isDeleted = true;
            await supplier.save();
            return true;
        } catch (error) {
            
            throw {
                message: error?.message || 'Something went wrong while fetching users',
                statusCode: error?.statusCode || 500
            };
        }
    }


}

module.exports = new SupplierService();