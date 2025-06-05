
const mongoose = require('mongoose');
const orderModel = require('../models/Order');
const orderDetailModel = require('../models/OrderDetail');
const paymentDetailModel = require('../models/PaymentDetail');

class Order {

    /** Create a new order */
    async createOrder(data) {
        const orderItems = data.cartItems;
        const paymentInfo = data.paymentIntent;
        const userId = data.userId;

        console.log('orderItems', orderItems);
        console.log('paymentInfo', { ...paymentInfo });
        console.log('userId', userId);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const newData = {
                orderId : 'EUR-2315656',
                shippingAddress: data?.shippingAddress ?? new mongoose.Types.ObjectId("68414ec3f7976b29062836a1"),
                paymentMethod: data?.paymentMethod ?? 'stripe',
                subtotal: data?.subtotal ?? 0,
                shipping: data?.shipping ?? 0,
                tax: data?.tax ?? 0,
                discount: data?.discount ?? 0,
                total: data?.total ?? 0,
                promoCode: data?.promoCode ?? null,
                shippingMethod: data?.shippingMethod ?? null,
                createdBy: userId,
                updatedBy: userId,
            };

            // 1. Save payment detail (without order yet)
            const paymentDetailDoc = await paymentDetailModel.create(
                [{ ...paymentInfo }],
                { session }
            );

            // 2. Create order (temporarily empty orderDetails)
            const orderDoc = await orderModel.create(
                [{
                    ...newData,
                    paymentDetail: paymentDetailDoc[0]._id,
                    orderDetails: [],
                }],
                { session }
            );

            // 3. Link paymentDetail to order
            await paymentDetailModel.findByIdAndUpdate(
                paymentDetailDoc[0]._id,
                { order: orderDoc[0]._id },
                { session }
            );

            // 4. Create OrderDetails
            const orderDetails = await Promise.all(orderItems.map(item =>
                orderDetailModel.create([{
                    order: orderDoc[0]._id,
                    product: item.product?._id,
                    price: item?.price ?? 0,
                    quantity: item?.quantity ?? 0,
                    productVariation: item.variation?._id,
                    productDetail: JSON.stringify(item.variation)
                }], { session })
            ));

            // 5. Update order with orderDetail references
            orderDoc[0].orderDetails = orderDetails.map(d => d[0]._id);
            await orderDoc[0].save({ session });

            await session.commitTransaction();
            session.endSession();

            return orderDoc[0];

        } catch (error) {
            console.log('error',error)
            await session.abortTransaction();
            session.endSession();
            // Fix: throw proper Error
            throw new Error(error?.message || 'Order creation failed');
        }
    }

    /** * Build MongoDB query object for filtering orders */
    async buildOrderListQuery(req) {
        const queryParams = req.query;
        console.log(queryParams.status, 'queryParamsqueryParamsqueryParamsqueryParams');
        const conditions = [];

        if (queryParams?.status !== undefined && queryParams?.status !== "") {
            conditions.push({ orderStatus: Number(queryParams?.status) });
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
                                orderId: 1,
                                commission: 1,
                                total: 1,
                                orderStatus: 1,
                                paymentStatus: 1,
                                shippingAddress: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                createdBy: 1,
                                updatedBy: 1,
                                createdByDetails: {
                                    _id: 1,
                                    name: 1,
                                    email: 1,
                                    userImage: 1
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

    async orderDetails(req) {
        const orderId = req.params.id;

        if (!orderId) {
            const error = new Error('Order ID is required.');
            error.statusCode = 400;
            throw error;
        }

        // Fetch the order with full population
        const order = await orderModel.findById(orderId)
            .populate([
                {
                    path: 'orderDetails' // array of OrderDetail objects
                },
                {
                    path: 'shippingAddress'
                },
                // {
                //     path: 'paymentDetail'
                // },
                {
                    path: 'createdBy'
                },
                {
                    path: 'updatedBy'
                }
            ]);

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        return order;
    }
}

module.exports = new Order();
