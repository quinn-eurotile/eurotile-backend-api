
const mongoose = require('mongoose');
const orderModel = require('../models/Order');

class Order {

    /** * Build MongoDB query object for filtering orders */
    async buildOrderListQuery(req) {
        const queryParams = req.query;
        const conditions = [];

        const orderStatus = Number(queryParams.orderStatus);
        if (!isNaN(orderStatus) && [1, 2, 3, 4, 5].includes(orderStatus)) {
            conditions.push({ orderStatus });
        }

        const paymentStatus = Number(queryParams.paymentStatus);
        if (!isNaN(paymentStatus) && [1, 2, 3, 4, 5].includes(paymentStatus)) {
            conditions.push({ paymentStatus });
        }

        if (queryParams.search_string && queryParams.search_string.trim() !== '') {
            const regex = new RegExp(queryParams.search_string.trim(), 'i');
            conditions.push({
                $or: [
                    { orderNumber: regex },
                    { 'shippingAddress.fullName': regex },
                    { 'shippingAddress.phoneNumber': regex }
                ]
            });
        }

        if (conditions.length === 0) {
            return {};
        } else if (conditions.length === 1) {
            return conditions[0];
        }

        return { $and: conditions };
    }

    /** * Get paginated and filtered order list with status summary */
    async orderList(query, options) {
        const { page, limit, sort } = options;
        const skip = (page - 1) * limit;

        const pipeline = [
            { $match: query },
            {
                $facet: {
                    // Total document count for pagination
                    metadata: [{ $count: "totalDocs" }],

                    // Grouping order statuses for summary
                    orderStatus: [
                        {
                            $group: {
                                _id: "$orderStatus",
                                count: { $sum: 1 }
                            }
                        }
                    ],

                    // Main data pipeline
                    data: [
                        { $sort: sort },
                        { $skip: skip },
                        { $limit: limit },

                        // Join OrderDetails with the current Order
                        {
                            $lookup: {
                                from: "orderdetails", // Make sure this matches your MongoDB collection name
                                localField: "_id",
                                foreignField: "order",
                                as: "orderDetails"
                            }
                        },

                        {
                            $lookup: {
                                from: "users",            // collection to join
                                localField: "createdBy",  // field in orders
                                foreignField: "_id",      // field in users
                                as: "createdByDetails"    // output array field
                            }
                        },
                        {
                            $unwind: "$createdByDetails" // optional: convert array to object if only one user per order
                        },

                        // Select required fields
                        {
                            $project: {
                                orderNumber: 1,
                                orderStatus: 1,
                                paymentStatus: 1,
                                shippingAddress: 1,
                                totalAmount: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                createdBy: 1,
                                updatedBy: 1,
                                createdByDetails:{
                                    _id : 1,
                                    name : 1,
                                    email : 1,
                                    userImage : 1
                                },
                                orderDetails: {
                                    productId: 1,
                                    productDetail: 1,
                                    totalPrice: 1,
                                }
                            }
                        }
                    ]
                }
            },
            {
                // Final structure
                $project: {
                    data: 1,
                    totalDocs: { $ifNull: [{ $arrayElemAt: ["$metadata.totalDocs", 0] }, 0] },
                    orderStatus: 1
                }
            }
        ];

        const [result] = await orderModel.aggregate(pipeline);

        // Map status numbers to status keys
        const statusMap = {
            1: 'pending',
            2: 'processing',
            3: 'shipped',
            4: 'delivered',
            5: 'cancelled'
        };

        const statusSummary = result.orderStatus.reduce((summary, item) => {
            const statusKey = statusMap[item._id];
            if (statusKey) {
                summary[statusKey] = item.count;
            }
            return summary;
        }, {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        });

        // Return final response structure
        return {
            docs: result.data,
            totalDocs: result.totalDocs,
            limit,
            page,
            totalPages: Math.ceil(result.totalDocs / limit),
            hasNextPage: page * limit < result.totalDocs,
            hasPrevPage: page > 1,
            nextPage: page * limit < result.totalDocs ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null,
            statusSummary
        };
    }
}

module.exports = new Order();
