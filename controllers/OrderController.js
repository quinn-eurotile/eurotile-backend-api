const orderService = require('../services/orderService');
const commonService = require('../services/commonService');

module.exports = class OrderController {

    /** Get Order List **/
    async orderList(req, res) {
        try {
            const query = await orderService.buildOrderListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit), populate: { path: 'createdBy' } };
            const data = await orderService.orderList(query, options);
            return res.status(200).json({ data: data, message: 'Order list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Order Details **/
    async orderDetails(req, res) {
        try {
            const data = await orderService.orderDetails(req);
            return res.status(200).json({ data: data, message: 'Order details get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Order Stats **/
    async getStats(req, res) {
        try {
            const data = await orderService.getStats();
            return res.status(200).json({ data: data, message: 'Order stats retrieved successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Order Status **/
    async updateOrderStatus(req, res) {
        try {
            const { status, trackingId } = req.body;
            const orderId = req.params.id;
            //console.log(status, 'status');
            //console.log(trackingId, 'trackingId');
            //console.log(orderId, 'orderId');
            const data = await orderService.updateOrderStatus(orderId, status, trackingId);
            return res.status(200).json({ data: data, message: 'Order status updated successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Customer Orders **/
    async getCustomerOrders(req, res) {
        try {
            req.query.customerId = req.params.customerId;
            const query = await orderService.buildOrderListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const data = await orderService.orderList(query, options);
            return res.status(200).json({ data: data, message: 'Customer orders get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** * Get order list for support ticket (last 1 month) for admin */
    async getOrderListForSupportTicket(req, res) {
        try {
            const data = await orderService.getOrderListForSupportTicket(req)
            return res.status(200).json({ data: data, message: '' });
        } catch (error) {
            //console.log(error, 'error')
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get order history **/
    async getOrderHistory(req, res) {
        try {
            const data = await orderService.getOrderHistory(req.params.id);
            return res.status(200).json({ data: data, message: 'Order history get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Forward to suppliers **/
    async forwardToSuppliers(req, res) {
        try {
            const userId = req?.user?.id
            const data = await orderService.forwardToSuppliers(req.params.id, userId);
            return res.status(200).json({ data: data, message: 'Order forwarded to suppliers successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }       

};