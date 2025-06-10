const mongoose = require('mongoose');
const orderModel = require('../models/Order');
const orderDetailModel = require('../models/OrderDetail');
const paymentDetailModel = require('../models/PaymentDetail');

class Order {

    /** Create a new order */
    async createOrderOld(data) {
        const orderItems = data?.cartItems;
        const paymentInfo = data?.paymentIntent;
        const orderData = data?.orderData;
        const userId = orderData?.userId;

        // console.log('orderItems', orderItems);
        // console.log('paymentInfo', { ...paymentInfo });
        // console.log('userId', userId);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const newData = {
                orderId: paymentInfo?.metadata?.orderId || `ORD-${Date.now()}`,
                commission: data?.commission ?? 0,
                shippingAddress: orderData?.shippingAddress || null,
                paymentMethod: orderData?.paymentMethod || 'stripe',
                paymentStatus: paymentInfo?.status === 'succeeded' ? 'paid' : 'pending',
                orderStatus: 3, // New order
                subtotal: orderData?.subtotal ?? 0,
                shipping: orderData?.shipping ?? 0,
                tax: orderData?.tax ?? 0,
                discount: orderData?.discount ?? 0,
                total: orderData?.total ?? 0,
                promoCode: orderData?.promoCode ?? null,
                shippingMethod: orderData?.shippingMethod ?? 'standard',
                createdBy: userId,
                updatedBy: userId,
            };

            // 1. Save payment detail
            const paymentDetailDoc = await paymentDetailModel.create(
                [{
                    ...paymentInfo,
                    amount: paymentInfo.amount / 100, // Convert from cents back to dollars
                    status: paymentInfo.status,
                    paymentMethod: orderData?.paymentMethod,
                    createdBy: userId
                }],
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

            // 4. Create OrderDetails with all required fields
            const orderDetails = await Promise.all(orderItems.map(item =>
                orderDetailModel.create([{
                    order: orderDoc[0]._id,
                    product: item.product?._id,
                    price: item?.price ?? 0,
                    quantity: item?.quantity ?? 0,
                    productVariation: item.variation?._id,
                    productImages: item.productImages || '',
                    productDetail: JSON.stringify({
                        ...item.variation,
                        product: {
                            name: item.product?.name,
                            sku: item.product?.sku,
                            description: item.product?.description
                        }
                    }),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }], { session })
            ));

            // 5. Update order with orderDetail references
            orderDoc[0].orderDetails = orderDetails.map(d => d[0]._id);
            await orderDoc[0].save({ session });

            await session.commitTransaction();
            session.endSession();

            // Return populated order
            return await orderModel
                .findById(orderDoc[0]._id)
                .populate('orderDetails')
                .populate('shippingAddress')
                .populate('paymentDetail')
                .populate('createdBy', 'name email');

        } catch (error) {
            console.error('Order creation error:', error);
            await session.abortTransaction();
            session.endSession();
            throw new Error(error?.message || 'Order creation failed');
        }
    }
    async createOrder(data) {
        const orderItems = data?.cartItems;
        const paymentInfo = data?.paymentIntent;
        const orderData = data?.orderData;
        const userId = orderData?.userId;

        console.log('orderData', orderData);
        console.log('orderItems', orderItems);
        // console.log('paymentInfo', { ...paymentInfo });
        // console.log('userId', userId);

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const newData = {
                orderId: paymentInfo?.metadata?.orderId || `ORD-${Date.now()}`,
                commission: orderData?.commission ?? 0,
                shippingAddress: orderData?.shippingAddress || null,
                paymentMethod: orderData?.paymentMethod || 'stripe',
                paymentStatus: paymentInfo?.status === 'succeeded' ? 'paid' : 'pending',
                orderStatus: 3,
                subtotal: orderData?.subtotal ?? 0,
                shipping: orderData?.shipping ?? 0,
                tax: orderData?.tax ?? 0,
                discount: orderData?.discount ?? 0,
                total: orderData?.total ?? 0,
                promoCode: orderData?.promoCode ?? null,
                shippingMethod: orderData?.shippingMethod ?? 'standard',
                createdBy: userId,
                updatedBy: userId,
            };

            // 1. Save payment detail
            const paymentDetailDoc = await paymentDetailModel.create(
                [{
                    ...paymentInfo,
                    amount: paymentInfo.amount / 100, // Convert from cents back to dollars
                    status: paymentInfo.status,
                    paymentMethod: orderData?.paymentMethod,
                    createdBy: userId
                }],
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
            // 4. Create OrderDetails with all required fields
            const orderDetails = await Promise.all(orderItems.map(item =>
                orderDetailModel.create([{
                    order: orderDoc[0]._id,
                    product: item.product?._id,
                    price: item?.price ?? 0,
                    quantity: item?.quantity ?? 0,
                    commission: item?.commission ?? 0,
                    totalCommission: item?.totalCommission ?? 0,
                    productVariation: item.variation?._id,
                    productImages: item.productImages || '',
                    productDetail: JSON.stringify({
                        ...item.variation,
                        product: {
                            name: item.product?.name,
                            sku: item.product?.sku,
                            description: item.product?.description
                        },
                        supplierName : item.product?.supplier?.companyName,
                    }),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }], { session })
            ));

            // 5. Update order with orderDetail references
            orderDoc[0].orderDetails = orderDetails.map(d => d[0]._id);
            await orderDoc[0].save({ session });

            await session.commitTransaction();
            session.endSession();

            // Return populated order
            return await orderModel
                .findById(orderDoc[0]._id)
                .populate('orderDetails')
                .populate('shippingAddress')
                .populate('paymentDetail')
                .populate('createdBy', 'name email');

        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    /** * Build MongoDB query object for filtering orders */
    async buildOrderListQuery(req) {
        const queryParams = req.query;
        // console.log(queryParams.status, 'queryParamsqueryParamsqueryParamsqueryParams');
        const conditions = [];
        // Date range filter
        if (queryParams?.startDate && queryParams?.endDate) {
            conditions.push({
                createdAt: {
                    $gte: new Date(queryParams.startDate),
                    $lte: new Date(queryParams.endDate)
                }
            });
        }
        // Customer type filter
        if (queryParams?.customerType) {
            conditions.push({ customerType: queryParams.customerType });
        }
        if (queryParams?.status !== undefined && queryParams?.status !== "") {
            conditions.push({ orderStatus: Number(queryParams?.status) });
        }

        const paymentStatus = Number(queryParams.paymentStatus);
        if (!isNaN(paymentStatus) && [0,1, 2, 3, 4, 5].includes(paymentStatus)) {
            conditions.push({ paymentStatus });
        }

        if (queryParams.search_string && queryParams.search_string.trim() !== '') {
            const regex = new RegExp(queryParams.search_string.trim(), 'i');
            conditions.push({
                $or: [
                    { orderNumber: regex },
                    { 'shippingAddress.fullName': regex },
                    { 'shippingAddress.phoneNumber': regex },
                    { orderId: regex },
                    { 'customerDetails.name': regex },
                    { 'customerDetails.email': regex },
                    { trackingId: regex }
                ]
            });
        }
        // Customer specific orders
        if (queryParams?.customerId) {
            conditions.push({
                $or: [
                    { createdBy: new mongoose.Types.ObjectId(queryParams.customerId) },
                    { clientOf: new mongoose.Types.ObjectId(queryParams.customerId) }
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
        const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
        const skip = (page - 1) * limit;

        const pipeline = [
            { $match: query },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'clientOf',
                    foreignField: '_id',
                    as: 'tradeProfessionalDetails'
                }
            },
            {
                $lookup: {
                    from: 'orderdetails',
                    localField: 'orderDetails',
                    foreignField: '_id',
                    as: 'orderItems'
                }
            },
            {
                $lookup: {
                    from: 'addresses',
                    localField: 'shippingAddress',
                    foreignField: '_id',
                    as: 'shippingAddressDetails'
                }
            },
            {
                $lookup: {
                    from: 'paymentdetails',
                    localField: 'paymentDetail',
                    foreignField: '_id',
                    as: 'paymentInfo'
                }
            },
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
                    totalCommission: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$commission" }
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
                                customerType: 1,
                                commission: 1,
                                totalCommission: 1,
                                total: 1,
                                orderStatus: 1,
                                paymentStatus: 1,
                                shippingAddress: 1,
                                trackingId: 1,
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
                                },
                                tradeProfessionalDetails: { $arrayElemAt: ['$tradeProfessionalDetails', 0] },
                                shippingAddress: { $arrayElemAt: ['$shippingAddressDetails', 0] },
                                paymentInfo: { $arrayElemAt: ['$paymentInfo', 0] },
                                itemCount: { $size: '$orderItems' }
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
            0: 'cancelled',
            1: 'delivered',
            2: 'processing',
            3: 'new',
            4: 'shipped',
            5: 'pending'
        };

        const statusSummary = result.orderStatus.reduce((summary, item) => {
            const statusKey = statusMap[item._id];
            if (statusKey) {
                summary[statusKey] = item.count;
            }
            return summary;
        }, {
            new: 0,
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
                { path: 'orderDetails' },
                { path: 'shippingAddress' },
                { path: 'createdBy' },
                { path: 'updatedBy' }
            ]);

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        return order;
    }
    async  updateOrderStatus(orderId, status) {
        const order = await orderModel.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true });
        return order;
    }
    async  getOrderById(orderId) {
        const order = await orderModel.findById(orderId) .populate([
            { path: 'orderDetails' },
            { path: 'shippingAddress' },
            { path: 'createdBy' },
            { path: 'updatedBy' }
        ]);

        return order;
    }

    /** Get Order Statistics */
    async getStats() {
        console.log('getStats');
        const pipeline = [
            {
                $facet: {
                    // Order status counts
                    orderStatus: [
                        {
                            $group: {
                                _id: "$orderStatus",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    // Total orders
                    totalOrders: [{ $count: "count" }],
                    // Total revenue
                    revenue: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$total" }
                            }
                        }
                    ],
                    // Total commission
                    commission: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$commission" }
                            }
                        }
                    ]
                }
            }
        ];

        const [result] = await orderModel.aggregate(pipeline);

        // Map status numbers to status keys
        const statusMap = {
            0: 'cancelled',
            1: 'delivered',
            2: 'processing',
            3: 'new',
            4: 'shipped',
            5: 'pending'
        };

        // Initialize status summary with zeros
        const statusSummary = {
            new: 0,
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };

        // Fill in actual counts
        result.orderStatus.forEach(item => {
            const statusKey = statusMap[item._id];
            if (statusKey) {
                statusSummary[statusKey] = item.count;
            }
        });

        return {
            statusSummary,
            totalOrders: result.totalOrders[0]?.count || 0,
            totalRevenue: result.revenue[0]?.total || 0,
            totalCommission: result.commission[0]?.total || 0
        };
    }
}


module.exports = new Order();
