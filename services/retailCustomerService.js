const User = require('../models/User');
const mongoose = require('mongoose');
const constants = require('../configs/constant');
const helpers = require("../_helpers/common")
const bcrypt = require("bcryptjs");
const stripe = require('../utils/stripeClient');
const { Order } = require('../models');
const userModel = require("../models/User");

class RetailCustomer {


    async getUserById(userId, selectFields = "", populateFields = "") {
            try {
                let query = userModel.findById(userId);
    
                // Select specific fields if provided
                if (selectFields) {
                    query = query.select(selectFields);
                }
    
                // Populate specific fields if provided
                if (populateFields) {
                    for (const path in populateFields) {
                        if (populateFields.hasOwnProperty(path)) {
                            const selectOption = populateFields[path];
                            query = query.populate({
                                path: path,
                                select: selectOption,
                            });
                        }
                    }
                }
    
                return await query.exec();
            } catch (err) {
                throw new Error("User not found");
            }
        }

    async getDashboardData(req) {
        try {
            const userId = req?.user?.id;
            if (!userId) {
                throw { message: 'Unauthorized: User ID not found', statusCode: 401 };
            }

            // Fetch user info with userBusinesses populated
            const user = await User.findById(userId).populate('business').select('-password');

            if (!user) {
                throw { message: 'User not found', statusCode: 404 };
            }

            // Aggregate order status counts
            const orderStatusSummary = await Order.aggregate([
                { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: "$orderStatus",
                        count: { $sum: 1 }
                    }
                }
            ]);

            //0=Cancelled, 1=Delivered, 2=Processing, 3=New, 4=Shipped, 5=Pending
            const statusLabels = { 0: "cancelled", 1: "delivered", 2: "processing", 3: "new", 4: "shipped", 5: "pending" };

            // Initialize all counts as 0
            const formattedSummary = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, new: 0 };

            // Fill in actual counts from aggregation
            orderStatusSummary.forEach(item => {
                const label = statusLabels[item._id];
                if (label) {
                    formattedSummary[label] = item.count;
                }
            });

            return {
                user,
                statusSummary: formattedSummary // fallback in case no orders
            };
        } catch (error) {
            throw { message: error?.message || 'Something went wrong while fetching data', statusCode: error?.statusCode || 500 };
        }
    }

    // Update Retail Customer
    updateRetailCustomer = async (req) => {
                const userId = req.params.id;
                const {
                    name,
                    phone,
                    address,
                } = req.body;
    
                // Step 1: Update User
                const user = await User.findByIdAndUpdate(
                    userId,
                    {
                        name,
                        phone,
                        addresses: typeof address === 'string' ? JSON.parse(address) : address,
                        updatedBy: req?.user?.id || null,
                    },
                    { new: true }
                );
                
                if (!user) throw { message: 'User not found', statusCode: 404 };
                
                return user;
            };

    // Create Retail Customer
    createRetailCustomer = async (req) => {
        const {
            name,
            email,
            phone,
            status,
            password,
            accept_term,
            address
        } = req.body;

        const genSalt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, genSalt); // Hash the password

        const token = helpers.randomString(20);

        const customer = await stripe.customers.create({ name: name, email: email });

        // Step 1: Create User
        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            token,
            addresses: address,
            accept_term: accept_term ?? 0,
            roles: [new mongoose.Types.ObjectId(String(constants?.retailCustomerRole?.id))],
            status: status ?? 2,
            createdBy: req?.user?.id || null,
            updatedBy: req?.user?.id || null,
            stripeCustomerId: customer.id,
        });

        if (!user) throw { message: 'Failed to create user', statusCode: 500 };

        return user;
    };

    /** Build Quert To Get Retail Customer */
    async buildRetailCustomerListQuery(req) {
        const query = req.query;
        const conditionArr = [
            { isDeleted: false, roles: { $in: [new mongoose.Types.ObjectId(String(constants?.retailCustomerRole?.id))] } }
        ];
        if (query.status !== undefined) {
            if (query.status === "0" || query.status === 0) {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1" || query.status === 1) {
                conditionArr.push({ status: { $in: [1, 3] } });
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

    /** Get Retail Customer List */
    async retailCustomerList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            // Build aggregation pipeline
            const pipeline = [
                { $match: query },

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
                        userId: 1,
                        isDeleted: 1,
                        lastLoginDate: 1,
                        userImage: 1,
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
            const data = await User.aggregate(pipeline);

            // Get total count (for pagination meta)
            const totalCountAgg = await User.aggregate([
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
            // //console.log(error, 'error');
            throw {
                message: error?.message || 'Something went wrong while fetching retail customer',
                statusCode: error?.statusCode || 500
            };
        }
    }

}

module.exports = new RetailCustomer();