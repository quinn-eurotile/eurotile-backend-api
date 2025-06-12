const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Supplier = require('../models/Supplier');
const emailService = require('./emailService');
const mongoose = require('mongoose');

class SupplierOrderService {
    async getSupplierOrders(supplierId, filters = {}, page = 1, limit = 10) {
        try {
            const query = {
                'orderDetails.supplier': mongoose.Types.ObjectId(supplierId)
            };

            if (filters.status) {
                query['orderDetails.status'] = filters.status;
            }

            const orders = await Order.aggregate([
                {
                    $lookup: {
                        from: 'orderdetails',
                        localField: '_id',
                        foreignField: 'orderId',
                        as: 'orderDetails'
                    }
                },
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'customer',
                        foreignField: '_id',
                        as: 'customerDetails'
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
                        customer: { $arrayElemAt: ['$customerDetails', 0] },
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

            const total = await Order.countDocuments(query);

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

    async getSupplierOrderDetails(orderId, supplierId) {
        try {
            const order = await Order.findById(orderId)
                .populate({
                    path: 'orderDetails',
                    match: { supplier: supplierId }
                })
                .populate('customer', 'name email phone')
                .populate('shippingAddress');

            if (!order) {
                throw new Error('Order not found');
            }

            if (!order.orderDetails.length) {
                throw new Error('No items found for this supplier in the order');
            }

            // Calculate supplier-specific totals
            const supplierSubtotal = order.orderDetails.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
            );
            const supplierShipping = order.shipping * (supplierSubtotal / order.subtotal);

            return {
                orderId: order.orderId,
                orderDate: order.createdAt,
                customer: order.customer,
                shippingAddress: order.shippingAddress,
                items: order.orderDetails,
                subtotal: supplierSubtotal,
                shipping: supplierShipping,
                total: supplierSubtotal + supplierShipping,
                status: order.status,
                paymentStatus: order.paymentStatus
            };
        } catch (error) {
            console.error('Error getting supplier order details:', error);
            throw error;
        }
    }

    async updateSupplierOrderStatus(orderId, supplierId, status, notes) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update order details for this supplier
            const updatedDetails = await OrderDetail.updateMany(
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

            const order = await Order.findById(orderId)
                .populate('customer')
                .populate('orderDetails')
                .session(session);

            const supplier = await Supplier.findById(supplierId).session(session);

            // Send email notifications
            await emailService.sendSupplierStatusUpdate({
                order,
                supplier,
                status,
                notes,
                items: order.orderDetails.filter(item => 
                    item.supplier.toString() === supplierId.toString()
                )
            });

            // Check if all suppliers have confirmed
            const allDetails = await OrderDetail.find({ orderId: mongoose.Types.ObjectId(orderId) });
            const allConfirmed = allDetails.every(detail => detail.supplierConfirmed);

            // If all suppliers confirmed, update main order status
            if (allConfirmed) {
                await Order.findByIdAndUpdate(
                    orderId,
                    { 
                        $set: { 
                            status: 'processing',
                            allSuppliersConfirmed: true
                        }
                    },
                    { session }
                );

                // Send notification to customer about all suppliers confirming
                await emailService.sendOrderStatusUpdate({
                    order,
                    status: 'processing',
                    message: 'All suppliers have confirmed your order and it is now being processed.'
                });
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
}

module.exports = new SupplierOrderService(); 