const tradeProfessionalModel = require('../models/User');
const mongoose = require('mongoose');
const constants = require('../configs/constant');
const helpers = require("../_helpers/common");

class TradeProfessional {

    /** Get Trade Professional List */
    async tradeProfessionalList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            // Build aggregation pipeline
            const pipeline = [
                { $match: query },

                // Example $lookup - adjust this according to your schema
                // Country lookup
                {
                    $lookup: {
                        from: 'userbusinesses', // collection name (lowercase plural usually)
                        localField: '_id',
                        foreignField: 'createdBy',
                        as: 'userbusinesses'
                    }
                },
                { $unwind: { path: '$userbusinesses', preserveNullAndEmptyArrays: true } },

                // Optional sort
                { $sort: sort },

                // Optional projection to only return required fields
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        status: 1,
                        isDeleted: 1,
                        lastLoginDate: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        createdBy: 1,
                        updatedBy: 1,
                        // Include only _id and name from each populated field
                        userbusinesses: 1,
                    }
                },
                // Pagination
                { $skip: skip },
                { $limit: limit }
            ];

            // Run aggregation
            const data = await tradeProfessionalModel.aggregate(pipeline);

            // Get total count (for pagination meta)
            const totalCountAgg = await tradeProfessionalModel.aggregate([
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

    /** Create Trade Professional */
    async createTradeProfessional(req) {
        try {
            const { name, email, phone, status } = req.body;
            const lowerCaseEmail = email.trim().toLowerCase();
            const token = helpers.randomString(20);

            const newTradeProfessional = new tradeProfessionalModel({
                name,
                phone,
                token,
                email: lowerCaseEmail,
                roles: [new mongoose.Types.ObjectId(String(constants?.tradeProfessionalRole?.id))],
                status: status ?? 0,
                createdBy: req?.user?.id || null,
                updatedBy: req?.user?.id || null,
            });

            await newTradeProfessional.save();

            if (!newTradeProfessional) {
                throw { message: 'Failed to create trade professional', statusCode: 500 };
            }

            return newTradeProfessional;

        } catch (error) {
            throw { message: error?.message || 'Error creating team member', statusCode: error?.statusCode || 500 };
        }
    }

    /** Build Quert To Get Trade Professional */
    async buildTradeProfessionalListQuery(req) {
        const query = req.query;
        const conditionArr = [
            { isDeleted: false, roles: { $in: [new mongoose.Types.ObjectId(String(constants?.tradeProfessionalRole?.id))] } }
        ];
        if (query.status !== undefined) {
            if (query.status === "0" || query.status === 0) {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1" || query.status === 1) {
                conditionArr.push({ status: 1 });
            } else if (query.status === "2" || query.status === 2) {
                conditionArr.push({ status: 2 });
            }
        }


        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { email: new RegExp(query.search_string, "i") },
                    { name: new RegExp(query.search_string, "i") },
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

    /** Soft Delete Trade Professional */
    async softDeleteTradeProfessional(userId) {
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
            const tradeProfessionaler = await tradeProfessionalModel.findById({ _id: userId });
            if (!tradeProfessionaler) throw new Error({ message: 'Trade professional not found', statusCode: 404 });
            tradeProfessionaler.isDeleted = true;
            await tradeProfessionaler.save();
            return true;
        } catch (error) {
            throw { message: error?.message || 'Something went wrong while fetching users', statusCode: error?.statusCode || 500 };
        }
    }

    /** Get Trade Professional */
    async getTradeProfessionalById(id) {
        return await tradeProfessionalModel.findById({ _id: id, roles: { $in: [new mongoose.Types.ObjectId(String(constants?.tradeProfessionalRole?.id))] } });
    }

}

module.exports = new TradeProfessional();