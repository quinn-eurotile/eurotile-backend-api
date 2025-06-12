const supplierOrderService = require('../services/supplierOrderService');
const { validateSupplierOrderStatus } = require('../validation-helper/order-validate');

class SupplierOrderController {
    async getOrders(req, res) {
        try {
            const supplierId = req.supplier._id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status;

            const orders = await supplierOrderService.getSupplierOrders(
                supplierId,
                { status },
                page,
                limit
            );

            res.json({
                success: true,
                data: orders
            });
        } catch (error) {
            console.error('Error in getOrders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders',
                error: error.message
            });
        }
    }

    async getOrderDetails(req, res) {
        try {
            const { orderId } = req.params;
            const supplierId = req.supplier._id;

            const orderDetails = await supplierOrderService.getSupplierOrderDetails(
                orderId,
                supplierId
            );

            res.json({
                success: true,
                data: orderDetails
            });
        } catch (error) {
            console.error('Error in getOrderDetails:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order details',
                error: error.message
            });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const { orderId } = req.params;
            const supplierId = req.supplier._id;
            const { status, notes } = req.body;

            // Validate input
            const validationError = validateSupplierOrderStatus(status, notes);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }

            const result = await supplierOrderService.updateSupplierOrderStatus(
                orderId,
                supplierId,
                status,
                notes
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in updateOrderStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error.message
            });
        }
    }

    async createOrder(req, res) {
        try {
            const orderData = req.body;
            const supplierId = req.supplier._id;

            const result = await supplierOrderService.createSupplierOrder(orderData, supplierId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in createOrder:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create order',
                error: error.message
            });
        }
    }
}

module.exports = new SupplierOrderController(); 