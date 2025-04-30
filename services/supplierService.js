const supplierModel = require('../models/Supplier');
const bcrypt = require("bcryptjs");
const helpers = require("../_helpers/common");
const mongoose = require('mongoose');
const constants = require('../configs/constant');
const SupplierDiscount = require('../models/SupplierDiscount'); // adjust path as needed

class SupplierService {

    /** Save Supplier **/
    async saveSupplier(req) { 
        try {
            const { id } = req.params;
            const { companyName, companyPhone,status, companyEmail, contactInfo, discounts,addresses } = req.body;
            // Validate the email
            if (!companyEmail || !companyEmail.trim()) {
                throw { message: 'Email cannot be empty', statusCode: 400 };
            }
            const lowerCaseEmail = companyEmail.trim().toLowerCase(); 
            let discountIds = [];

            if (Array.isArray(discounts) && discounts.length > 0) {
                const savedDiscounts = await SupplierDiscount.insertMany(discounts);
                discountIds = savedDiscounts.map(discount => discount._id);
            }
            const commonData = {
                companyName,
                companyPhone,
                companyEmail: lowerCaseEmail,
                status: status ?? 1,
                contactInfo: contactInfo,
                discounts: discountIds, 
                addresses: addresses ?? [], 
                // supplierId:'',
                createdBy: req?.user?.id || null,
                updatedBy: req?.user?.id || null,
            }
 
            
            // Check if we're updating
            if (id) {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    throw { message: 'Invalid supplier ID', statusCode: 400 };
                }

                const updated = await supplierModel.findByIdAndUpdate(id, commonData, { new: true });

                if (!updated) {
                    throw { message: 'Supplier not found', statusCode: 404 };
                }

                return updated;
            }

            // Creating new supplier
            const newSupplier = new supplierModel({ ...commonData, status: 1, createdBy: req?.user?.id || null });

            await newSupplier.save();

            if (!newSupplier) {
                throw { message: 'Failed to create supplier', statusCode: 500 };
            }

            return newSupplier;

        } catch (error) {
            throw { message: error?.message || 'Failed to save supplier', statusCode: error?.statusCode || 500 };
        }
    }


    /** Get Supplier List */
    async supplierList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            // Build aggregation pipeline
            const pipeline = [
                { $match: query },

                // Example $lookup - adjust this according to your schema
                /* {
                    $lookup: {
                        from: 'users', // target collection to join
                        localField: 'userId', // local field in supplierModel
                        foreignField: '_id',  // field in users collection
                        as: 'userDetails'
                    }
                },
                { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } }, */

                // Optional sort
                { $sort: sort },

                // Pagination
                { $skip: skip },
                { $limit: limit }
            ];

            // Run aggregation
            const data = await supplierModel.aggregate(pipeline);

            // Get total count (for pagination meta)
            const totalCountAgg = await supplierModel.aggregate([
                { $match: query },
                { $count: 'total' }
            ]);
            const totalDocs = totalCountAgg[0]?.total || 0;

            const result = {
                docs: data,
                totalDocs,
                limit,
                page,
                totalPages: Math.ceil(totalDocs / limit),
                hasNextPage: page * limit < totalDocs,
                hasPrevPage: page > 1
            };

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
            if (query.status === "0" || query.status === 0) {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1" || query.status === 1) {
                conditionArr.push({ status: 1 });
            }
            
        }
     console.log(conditionArr,'conditionArr');
     

        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { companyName: new RegExp(query.search_string, "i") },
                    { companyEmail: new RegExp(query.search_string, "i") },
                    { companyPhone: new RegExp(query.search_string, "i") },
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
        async getSupplierById(id) {
            return await supplierModel.findById(id).populate('discounts') ;
        }
    


}

module.exports = new SupplierService();