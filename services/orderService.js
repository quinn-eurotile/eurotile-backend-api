const mongoose = require('mongoose');
const orderModel = require('../models/Order');
const orderDetailModel = require('../models/OrderDetail');
const paymentDetailModel = require('../models/PaymentDetail');
const orderHistoryModel = require('../models/OrderHistory');
const supplierModel = require('../models/Supplier');
const nodemailer = require('nodemailer');
const emailService = require('./emailService');
const notificationService = require('./notificationService');
const constants = require('../configs/constant');
const { getClientUrlByRole } = require('../_helpers/common');
    
const { AdminSetting } = require('../models');

class Order {
    constructor() {
        // Bind methods to preserve 'this' context
        this.updateOrderStatus = this.updateOrderStatus.bind(this);
        this.addOrderHistory = this.addOrderHistory.bind(this);
    }

        /** Create a new free order */
        async createFreeOrder(data) {
            //console.log('data in createOrder', data);
            const orderItems = data?.cartItems;
            const paymentInfo = data?.paymentIntent;
            const orderData = data?.orderData;
            const userId = orderData?.userId;
            const tradeProfessionalId = orderData?.tradeProfessionalId;
    
            // //console.log('orderData', orderData);
            // //console.log('orderItems', orderItems);
            // //console.log('paymentInfo', { ...paymentInfo });
            // //console.log('userId', userId);
    
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                // Collect unique suppliers from order items
                const uniqueSuppliers = [...new Set(orderItems
                    .map(item => item.product?.supplier)
                    .filter(supplier => supplier))];
    
                const newData = {
                    orderId: paymentInfo?.metadata?.orderId || `ORD-${Date.now()}`,
                    isFreeOrder: true,
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
                    clientOf: tradeProfessionalId || null,
                    createdBy: userId,
                    updatedBy: userId,
                    supplierStatuses: uniqueSuppliers.map(supplier => ({
                        supplier: supplier,
                        status: 'pending',
                        confirmedAt: null,
                        lastUpdated: new Date()
                    }))
                };

                // 2. Create order (temporarily empty orderDetails)
                const orderDoc = await orderModel.create(
                    [{
                        ...newData,
                        paymentDetail: null,
                        orderDetails: [],
                    }],
                    { session }
                );

                // 4. Create OrderDetails with all required fields
                const orderDetails = await Promise.all(orderItems.map(item => {
                    if (!item.product?.supplier) {
                        throw new Error(`Supplier is required for product ${item.product?.name || 'unknown'}`);
                    }
                    return orderDetailModel.create([{
                        orderId: orderDoc[0]._id,
                        order: orderDoc[0]._id,
                        product: item.product?._id,
                        supplier: item.product.supplier,
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
                            supplierName: item.product?.supplier?.companyName,
                        }),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }], { session })
                }));
    
                // 5. Update order with orderDetail references
                orderDoc[0].orderDetails = orderDetails.map(d => d[0]._id);
                await orderDoc[0].save({ session });
    
                await session.commitTransaction();
                session.endSession();
    
                // Fetch the complete order with all details
                const completeOrder = await orderModel
                    .findById(orderDoc[0]._id)
                    .populate('orderDetails')
                    .populate('shippingAddress')
                    .populate('paymentDetail')
                    .populate('createdBy', 'name email');
    
                // Send order confirmation to customer
                await emailService.sendOrderConfirmationEmail(
                    completeOrder, 
                    completeOrder.createdBy.email,
                    completeOrder.createdBy.name
                );
    
                const notification = await notificationService.notifyOrderCreation(completeOrder, {
                    senderId: completeOrder.createdBy._id,
                    userId: constants.adminRole.id,
                    additionalUsers: [],
                    additionalRoles: [],
                    excludeUsers: []
                });
                // Notify suppliers about their portion of the order
                const notifyRes = await this.notifySuppliers(completeOrder);
                
                //console.log(notifyRes,'notifyRes');
                
    
                return completeOrder;
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                console.error('Order creation error:', error);
                throw error;
            }
        }
    

    /** Create a new order */
    async createOrder(data) {
        //console.log('data in createOrder', data);
        const orderItems = data?.cartItems;
        const paymentInfo = data?.paymentIntent;
        const orderData = data?.orderData;
        const userId = orderData?.userId;
        const tradeProfessionalId = orderData?.tradeProfessionalId;

        console.log('orderData in createOrder', orderData);
        // //console.log('orderItems', orderItems);
        // //console.log('paymentInfo', { ...paymentInfo });
        // //console.log('userId', userId);

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Collect unique suppliers from order items
            const uniqueSuppliers = [...new Set(orderItems
                .map(item => item.product?.supplier)
                .filter(supplier => supplier))];

            const newData = {
                orderId: paymentInfo?.metadata?.orderId || `ORD-${Date.now()}`,
                commission: orderData?.commission ?? 0,
                shippingAddress: orderData?.shippingAddress || null,
                paymentMethod: orderData?.paymentMethod || 'stripe',
                paymentStatus: paymentInfo?.status === 'succeeded' ? 'paid' : 'pending',
                shippingOption: orderData?.shippingMethod ?? null,
                orderStatus: 3,
                subtotal: orderData?.subtotal ?? 0,
                shipping: orderData?.shipping ?? 0,
                tax: orderData?.vat ?? 0,
                discount: orderData?.discount ?? 0,
                total: orderData?.total ?? 0,
                promoCode: orderData?.promoCode ?? null,
                //shippingMethod: orderData?.shippingMethod ?? 'standard',
                clientOf: tradeProfessionalId || null,
                createdBy: userId,
                updatedBy: userId,
                supplierStatuses: uniqueSuppliers.map(supplier => ({
                    supplier: supplier,
                    status: 'pending',
                    confirmedAt: null,
                    lastUpdated: new Date()
                }))
            };

            // 1. Save payment detail
            const paymentDetailDoc = await paymentDetailModel.create(
                [{
                    ...paymentInfo,
                    amount: paymentInfo?.amount ? paymentInfo?.amount / 100 : 0, // Convert from cents back to dollars
                    status: paymentInfo?.status,
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
            const orderDetails = await Promise.all(orderItems.map(item => {
                if (!item.product?.supplier) {
                    throw new Error(`Supplier is required for product ${item.product?.name || 'unknown'}`);
                }
                return orderDetailModel.create([{
                    orderId: orderDoc[0]._id,
                    order: orderDoc[0]._id,
                    product: item.product?._id,
                    supplier: item.product.supplier,
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
                        supplierName: item.product?.supplier?.companyName,
                    }),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }], { session })
            }));

            // 5. Update order with orderDetail references
            orderDoc[0].orderDetails = orderDetails.map(d => d[0]._id);
            await orderDoc[0].save({ session });

            await session.commitTransaction();
            session.endSession();

            // Fetch the complete order with all details
            const completeOrder = await orderModel
                .findById(orderDoc[0]._id)
                .populate('orderDetails')
                .populate('shippingAddress')
                .populate('paymentDetail')
                .populate('createdBy', 'name email');

            // Send order confirmation to customer
            await emailService.sendOrderConfirmationEmail(
                completeOrder, 
                completeOrder.createdBy.email,
                completeOrder.createdBy.name
            );

            await notificationService.notifyOrderCreation(completeOrder, {
                senderId: completeOrder.createdBy._id,
                userId: constants.adminRole.id,
                additionalUsers: [],
                additionalRoles: [],
                excludeUsers: []
            });
            // Notify suppliers about their portion of the order
            await this.notifySuppliers(completeOrder);
            
            //console.log(notifyRes,'notifyRes');
            

            return completeOrder;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Order creation error:', error);
            throw error;
        }
    }

    /** * Build MongoDB query object for filtering orders */
    async buildOrderListQuery(req) {
        const queryParams = req.query;
        // //console.log(queryParams.status, 'queryParamsqueryParamsqueryParamsqueryParams');
        const conditions = [];
        const roles = req?.user?.roles?.map((el) => el?.id);

        if (!roles?.includes(constants?.adminRole?.id)) {
            conditions.push({ createdBy: new mongoose.Types.ObjectId(String(req?.user?.id)) })
        }
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

    /*** Get order list for support ticket (last 1 month) for admin  */
    async getOrderListForSupportTicket(req) {
        try {
            // //console.log('I am in')
            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
            return await orderModel.find({ createdBy: new mongoose.Types.ObjectId(String(req?.user?.id)), createdAt: { $gte: oneMonthAgo } });
        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching users',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** * Get paginated and filtered order list with status summary */
    async orderList(query, options) {
        //console.log('i am comming orderList')
        const { page, limit, sort } = options;
        const skip = (page - 1) * limit;

        const adminSettings = await AdminSetting.findOne();

        // Calculate total commission and eligible commission separately
        const commissionResult = await orderModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalCommission: { $sum: "$commission" },
                    eligibleCommission: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$orderStatus", 4] }, // Only include shipped orders (status 4)
                                        {
                                            $gte: [
                                                { $subtract: [new Date(), "$shippedAt"] },
                                                -14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
                                            ]
                                        }
                                    ]
                                },
                                "$commission",
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const commissionData = commissionResult.length > 0 ? commissionResult[0] : { totalCommission: 0, eligibleCommission: 0 };
        
        const pipeline = [
            { $match: query },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createdByDetails'
                }
            },
            {
                $unwind: "$createdByDetails"
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
                    metadata: [{ $count: "totalDocs" }],
                    orderStatus: [
                        {
                            $group: {
                                _id: "$orderStatus",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    data: [
                        { $sort: sort },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                orderId: 1,
                                customerType: 1,
                                commission: 1,
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
                                clientOf: 1,
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
            totalCommission: commissionData.totalCommission,
            eligibleCommission: commissionData.eligibleCommission,
            adminSettings: adminSettings ?? null,
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
                { path: 'paymentDetail' },
                { path: 'supplierStatuses.supplier' },
                { path: 'supplierStatuses.supplier.addresses' },
                { path: 'createdBy' },
                { path: 'updatedBy' },
                { path: 'clientOf', select: 'name email companyName userImage' }
            ]);

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        return order;
    }

    async updateOrderStatus(orderId, data) {
        try {
            //console.log(data, orderId, 'data, orderId in updateOrderStatus');
            
            if (!orderId) {
                throw new Error('Order ID is required');
            }

            if (!data || typeof data.status === 'undefined') {
                throw new Error('Status is required');
            }

            const order = await orderModel.findById(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            const previousStatus = order.orderStatus;
            const updates = { 
                orderStatus: data.status,
                updatedAt: new Date()
            };
            
            if (data.trackingId) {
                updates.trackingId = data.trackingId;
            }

            if (data.status === 4) { // If status is changed to "Shipped"
                updates.shippedAt = new Date();
            }

            const updatedOrder = await orderModel.findByIdAndUpdate(
                orderId,
                updates,
                { new: true }
            ).populate(['orderDetails', 'shippingAddress', 'createdBy', 'updatedBy']);

            // Add to order history
            await this.addOrderHistory(
                orderId,
                'status_changed',
                `Order status updated from ${constants.orderStatusMap[previousStatus] || previousStatus} to ${constants.orderStatusMap[data.status] ||  data.status}`,
                data.userId,
                { trackingId: data.trackingId },
                previousStatus,
                data.status
            );
            await notificationService.notifyOrderStatusUpdate(updatedOrder, data.status, data.notes, {
                additionalUsers: [updatedOrder.clientOf,updatedOrder.createdBy],
                additionalRoles: [updatedOrder.createdBy.roles[0]._id],
                excludeUsers: []
            });

            return updatedOrder;
        } catch (error) {
            console.error('Failed to update order status:', error);
            throw error;
        }
    }

    async getOrderById(orderId) {
        const order = await orderModel.findById(orderId).populate([
            { path: 'orderDetails' },
            { path: 'shippingAddress' },
            { path: 'createdBy' },
            { path: 'updatedBy' }
        ]);

        return order;
    }

    /** Get Order Statistics */
    async getStats() {
        //console.log('getStats');
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

    // Helper method to add order history
    async addOrderHistory(orderId, action, description, userId, metadata = null, previousStatus = null, newStatus = null) {
        try {
            await orderHistoryModel.create({
                order: orderId,
                action,
                description,
                metadata,
                previousStatus,
                newStatus,
                performedBy: userId || null,
                createdAt: new Date()
            });
        } catch (error) {
            console.error('Failed to add order history:', error);
            // Don't throw the error to prevent blocking the main operation
        }
    }

    // Helper method to send order confirmation email
    async sendOrderConfirmation(order) {
        try {
            const emailContent = await this.generateOrderConfirmationEmail(order);
            
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: order.customerDetails.email,
                subject: `Order Confirmation - ${order.orderId}`,
                html: emailContent
            });

            await this.addOrderHistory(
                order._id,
                'email_sent',
                'Order confirmation email sent to customer',
                order.createdBy
            );
        } catch (error) {
            console.error('Failed to send order confirmation:', error);
        }
    }

    // Helper method to notify suppliers
    async notifySuppliers(order) {
        try {
            // //console.log(order,'order in notifySuppliers'); 

            const supplierGroups = await this.groupOrderItemsBySupplier(order);
            const notifications = [];
            // //console.log(supplierGroups,' supplierGroups ');
            
            for (const [supplierId, group] of Object.entries(supplierGroups)) {
                try {
                    // Skip if supplier has already confirmed
                    if (group.supplierStatus.status === 'confirmed') {
                        notifications.push({
                            supplierId,
                            status: 'skipped',
                            message: `Supplier ${group.supplier.companyName} has already confirmed the order`
                        });
                        continue;
                    }

                    // Verify supplier email exists
                    if (!group.supplier.email) {
                        throw new Error(`No email address found for supplier ${group.supplier.companyName}`);
                    }

                    

                    // Send email to supplier
                    await emailService.sendSupplierOrderConfirmationEmail(
                        order, 
                        group.supplier.email, 
                        group.supplier.companyName
                    );

                    // Add to order history
                    await this.addOrderHistory(
                        order._id,
                        'email_sent',
                        `Order notification sent to supplier: ${group.supplier.companyName}`,
                        order.createdBy,
                        { 
                            supplierId,
                            supplierName: group.supplier.companyName,
                            itemCount: group.items.length,
                            total: group.total,
                            supplierStatus: group.supplierStatus
                        }
                    );

                    notifications.push({
                        supplierId,
                        status: 'success',
                        message: `Notification sent to ${group.supplier.companyName}`,
                        supplierStatus: group.supplierStatus
                    });
                } catch (error) {
                    console.error(`Failed to notify supplier ${supplierId}:`, error);
                    notifications.push({
                        supplierId,
                        status: 'error',
                        message: `Failed to notify ${group.supplier.companyName}: ${error.message}`,
                        supplierStatus: group.supplierStatus
                    });
                }
            }

            return notifications;
        } catch (error) {
            console.error('Error in notifySuppliers:', error);
            throw error;
        }
    }

    // Helper method to generate order confirmation email
    async generateOrderConfirmationEmail(order) {
        const CLIENT_URL = getClientUrlByRole('Client');
        const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;

        // Generate product list HTML
        const productListHtml = order.orderDetails.map(detail => {
            const productDetail = JSON.parse(detail.productDetail);
            const imagePath = productDetail?.variationImages?.[0]?.filePath || 
                            productDetail?.productFeaturedImage?.filePath ||
                            '/images/placeholder.png';

            return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <img src="${process.env.APP_URL}${imagePath}" 
                             alt="${productDetail?.product?.name || 'Product'}" 
                             class="product-image">
                        <div class="product-details">
                            <div style="font-weight: bold;">${productDetail?.product?.name || 'Product'}</div>
                            <div style="color: #666; font-size: 12px;">SKU: ${productDetail?.product?.sku || 'N/A'}</div>
                            ${productDetail?.dimensions ? 
                                `<div style="color: #666; font-size: 12px;">
                                    Dimensions: ${productDetail.dimensions.length}x${productDetail.dimensions.width}x${productDetail.dimensions.height}
                                </div>` : ''}
                        </div>
                    </div>
                </td>
                <td>${detail.quantity} SQ.M</td>
                <td>€${detail.price.toFixed(2)}</td>
                <td>€${(detail.price * detail.quantity).toFixed(2)}</td>
            </tr>
            `;
        }).join('');

        // Read the HTML template
        const emailTemplate = require('fs').readFileSync('views/emails/order_confirmation_template.html', 'utf-8');

        return emailTemplate
            .replace(/\[USER_NAME\]/g, order.customerDetails?.name || 'Valued Customer')
            .replace(/\[LOGO\]/g, logo)
            .replace(/\[APP_NAME\]/g, process.env.APP_NAME)
            .replace(/\[ORDER_ID\]/g, order.orderId)
            .replace(/\[ORDER_DATE\]/g, new Date(order.createdAt).toLocaleDateString())
            .replace(/\[PRODUCT_LIST\]/g, productListHtml)
            .replace(/\[SUBTOTAL\]/g, order.subtotal.toFixed(2))
            .replace(/\[SHIPPING\]/g, order.shipping.toFixed(2))
            .replace(/\[TOTAL\]/g, order.total.toFixed(2))
            .replace(/\[SHIPPING_ADDRESS\]/g, this.formatShippingAddress(order.shippingAddress))
            .replace(/\[SHIPPING_METHOD\]/g, order.shippingMethod || 'Standard Shipping')
            .replace(/\[CURRENT_YEAR\]/g, new Date().getFullYear());
    }

    // Helper method to generate supplier order email
    async generateSupplierOrderEmail(order, group) {
        const CLIENT_URL = getClientUrlByRole('Client');
        const logo = `${CLIENT_URL}/images/euro-tile/logo/Eurotile_Logo.png`;

        // Calculate supplier-specific totals
        const supplierSubtotal = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const supplierShipping = order.shipping * (supplierSubtotal / order.subtotal); // Proportional shipping
        const supplierTotal = supplierSubtotal + supplierShipping;

        // Generate product list HTML for supplier's items only
        const productListHtml = group.items.map(detail => {
            const productDetail = JSON.parse(detail.productDetail);
            const imagePath = productDetail?.variationImages?.[0]?.filePath || 
                            productDetail?.productFeaturedImage?.filePath ||
                            '/images/placeholder.png';

            return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <img src="${process.env.APP_URL}${imagePath}" 
                             alt="${productDetail?.product?.name || 'Product'}" 
                             class="product-image">
                        <div class="product-details">
                            <div style="font-weight: bold;">${productDetail?.product?.name || 'Product'}</div>
                            <div style="color: #666; font-size: 12px;">SKU: ${productDetail?.product?.sku || 'N/A'}</div>
                            ${productDetail?.dimensions ? 
                                `<div style="color: #666; font-size: 12px;">
                                    Dimensions: ${productDetail.dimensions.length}x${productDetail.dimensions.width}x${productDetail.dimensions.height}
                                </div>` : ''}
                        </div>
                    </div>
                </td>
                <td>${detail.quantity} SQ.M</td>
                <td>€${detail.price.toFixed(2)}</td>
                <td>€${(detail.price * detail.quantity).toFixed(2)}</td>
            </tr>
            `;
        }).join('');

        // Read the HTML template
        const emailTemplate = require('fs').readFileSync('views/emails/supplier_order_notification_template.html', 'utf-8');

        return emailTemplate
            .replace(/\[SUPPLIER_NAME\]/g, group.supplier.companyName)
            .replace(/\[LOGO\]/g, logo)
            .replace(/\[APP_NAME\]/g, process.env.APP_NAME)
            .replace(/\[ORDER_ID\]/g, order.orderId)
            .replace(/\[ORDER_DATE\]/g, new Date(order.createdAt).toLocaleDateString())
            .replace(/\[PAYMENT_STATUS\]/g, order.paymentStatus === 'paid' ? 'Paid' : 'Pending')
            .replace(/\[PRODUCT_LIST\]/g, productListHtml)
            .replace(/\[SUBTOTAL\]/g, supplierSubtotal.toFixed(2))
            .replace(/\[SHIPPING\]/g, supplierShipping.toFixed(2))
            .replace(/\[TOTAL\]/g, supplierTotal.toFixed(2))
            .replace(/\[SHIPPING_ADDRESS\]/g, this.formatShippingAddress(order.shippingAddress))
            .replace(/\[SHIPPING_METHOD\]/g, order.shippingMethod || 'Standard Shipping')
            .replace(/\[CURRENT_YEAR\]/g, new Date().getFullYear());
    }

    // Helper method to format shipping address
    formatShippingAddress(address) {
        if (!address) return 'No shipping address provided';
        return `${address.street}
            ${address.city}
            ${address.state} ${address.postalCode}
            ${address.country}`;
                }

    // Add a method to get order history
    async getOrderHistory(orderId) {
        try {
            return await orderHistoryModel
                .find({ order: orderId })
                .populate('performedBy', 'name email')
                .sort({ createdAt: -1 });
        } catch (error) {
            console.error('Failed to get order history:', error);
            throw error;
        }
    }

    // Helper method to group order items by supplier
    async groupOrderItemsBySupplier(order) {
        try {
            const supplierGroups = {};
            
            // First, create a map of supplier statuses for quick lookup
            const supplierStatusMap = {};
            if (order.supplierStatuses && Array.isArray(order.supplierStatuses)) {
                order.supplierStatuses.forEach(status => {
                    supplierStatusMap[status.supplier.toString()] = status;
                });
            }
            //console.log(supplierStatusMap,'supplierStatusMap');

            for (const item of order.orderDetails) {
                const productDetail = typeof item.productDetail === 'string' 
                    ? JSON.parse(item.productDetail)
                    : item.productDetail;

                //console.log('productDetail',productDetail);
                //console.log('item',item);

                const supplierId = productDetail.supplier;
                if (!supplierId) continue;

                //console.log(supplierId,'supplierId');
                if (!supplierGroups[supplierId]) {
                    const supplier = await supplierModel.findById(supplierId);
                    if (!supplier) continue;

                    // Verify supplier has required email
                    if (!supplier.companyEmail) {
                        console.error(`Supplier ${supplier.companyName} has no email address`);
                        continue;
                    }

                    // Get supplier status from the map
                    const supplierStatus = supplierStatusMap[supplierId] || {
                        status: 'pending',
                        confirmedAt: null,
                        lastUpdated: new Date()
                    };

                    supplierGroups[supplierId] = {
                        supplier: {
                            _id: supplier._id,
                            companyName: supplier.companyName,
                            email: supplier.companyEmail,
                            phone: supplier.companyPhone,
                            address: supplier.addresses
                        },
                        supplierStatus: supplierStatus,
                        items: [],
                        subtotal: 0,
                        shipping: 0,
                        total: 0
                    };
                }

                supplierGroups[supplierId].items.push(item);
                supplierGroups[supplierId].subtotal += item.price * item.quantity;
            }

            //console.log(supplierGroups,'supplierGroups 1');
            // Calculate shipping proportionally for each supplier
            for (const supplierId in supplierGroups) {
                const group = supplierGroups[supplierId];
                // Calculate shipping based on proportion of order subtotal
                group.shipping = (group.subtotal / order.subtotal) * order.shipping;
                group.total = group.subtotal + group.shipping;
            }
            //console.log(supplierGroups,'supplierGroups 2');

            return supplierGroups;
        } catch (error) {
            console.error('Error grouping order items by supplier:', error);
            throw error;
        }
    }

    // Add a method to get supplier-specific order details
    async getSupplierOrderDetails(orderId, supplierId) {
        try {
            const order = await orderModel
                .findById(orderId)
                .populate('orderDetails')
                .populate('shippingAddress')
                .populate('createdBy', 'name email');

            if (!order) {
                throw new Error('Order not found');
            }

            const supplierGroups = await this.groupOrderItemsBySupplier(order);
            const supplierGroup = supplierGroups[supplierId];

            if (!supplierGroup) {
                throw new Error('No items found for this supplier in the order');
            }

            return {
                orderId: order.orderId,
                orderDate: order.createdAt,
                shippingAddress: order.shippingAddress,
                items: supplierGroup.items,
                subtotal: supplierGroup.subtotal,
                shipping: supplierGroup.shipping,
                total: supplierGroup.total,
                status: order.orderStatus,
                paymentStatus: order.paymentStatus,
                supplierStatus: supplierGroup.supplierStatus,
                supplier: supplierGroup.supplier
            };
        } catch (error) {
            console.error('Error getting supplier order details:', error);
            throw error;
        }
    }

    // Get orders for a specific supplier with pagination
    async getSupplierOrders(supplierId, query = {}, page = 1, limit = 10) {
        try {
            const orders = await orderModel.aggregate([
                {
                    $lookup: {
                        from: 'orderdetails',
                        localField: '_id',
                        foreignField: 'orderId',
                        as: 'orderDetails'
                    }
                },
                {
                    $match: {
                        'orderDetails.supplier': mongoose.Types.ObjectId(supplierId)
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'customer'
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
                    $project: {
                        orderId: 1,
                        orderDate: '$createdAt',
                        customer: { $arrayElemAt: ['$customer', 0] },
                        shippingAddress: { $arrayElemAt: ['$shippingAddressDetails', 0] },
                        orderDetails: {
                            $filter: {
                                input: '$orderDetails',
                                as: 'detail',
                                cond: { $eq: ['$$detail.supplier', mongoose.Types.ObjectId(supplierId)] }
                            }
                        },
                        status: 1,
                        paymentStatus: 1
                    }
                },
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ]);

            const total = await orderModel.countDocuments(query);

            return {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting supplier orders:', error);
            throw error;
        }
    }

    // Update status for supplier's portion of an order
    async updateSupplierOrderStatus(orderId, supplierId, status, notes) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update order details for this supplier
            const updatedDetails = await orderDetailModel.updateMany(
                {
                    orderId: mongoose.Types.ObjectId(orderId),
                    supplier: mongoose.Types.ObjectId(supplierId)
                },
                {
                    $set: {
                        status,
                        supplierNotes: notes,
                        supplierConfirmed: true
                    }
                },
                { session }
            );

            if (!updatedDetails.modifiedCount) {
                throw new Error('No order details found for this supplier');
            }

            // Add to order history
            await this.addOrderHistory(
                orderId,
                'supplier_status_update',
                `Supplier updated order status to ${status}`,
                supplierId,
                { status, notes },
                session
            );

            // Check if all suppliers have confirmed
            const allDetails = await orderDetailModel.find({ orderId: mongoose.Types.ObjectId(orderId) });
            const allConfirmed = allDetails.every(detail => detail.supplierConfirmed);

            // If all suppliers confirmed, update main order status
            if (allConfirmed) {
                await orderModel.findByIdAndUpdate(
                    orderId,
                    { $set: { status: 'processing' } },
                    { session }
                );

                await this.addOrderHistory(
                    orderId,
                    'status_update',
                    'All suppliers confirmed - order moved to processing',
                    null,
                    { status: 'processing' },
                    session
                );
            }

            await session.commitTransaction();
            session.endSession();

            return {
                success: true,
                message: 'Order status updated successfully',
                allConfirmed
            };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error updating supplier order status:', error);
            throw error;
        }
    }

    // Forward to suppliers
    async forwardToSuppliers(orderId, userId) { 
        try {
            const order = await orderModel.findById(orderId).populate('orderDetails')
                .populate('shippingAddress')
                .populate('paymentDetail')
                .populate('createdBy')
                .populate('updatedBy');
            if (!order) {
                throw new Error('Order not found');
            }
           
            // Send email to suppliers
            await this.notifySuppliers(order);
            // Update order status
            await orderModel.findByIdAndUpdate(orderId, { orderStatus: 2 });
            // Add to order history
            await this.addOrderHistory(orderId, 'forward_to_suppliers', 'Order forwarded to suppliers', userId, null, null, 2);    
            
            return {
                success: true,
                message: 'Order forwarded to suppliers successfully',
                order: order
            };
        } catch (error) {

            console.error('Error forwarding to suppliers:', error);
            throw error;    
        }
    }
}


module.exports = new Order();
