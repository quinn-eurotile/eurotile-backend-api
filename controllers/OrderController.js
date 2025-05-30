
const orderService = require('../services/orderService');
const commonService = require('../services/commonService');

module.exports = class OrderController {


    /** Get Order List **/
    async orderList(req, res) {
        try {
            const query = await orderService.buildOrderListQuery(req);
            console.log('req.query.page', req.query.page);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit), populate : { path : 'createdBy'} };
            const data = await orderService.orderList(query, options);
            return res.status(200).json({ data: data, message: 'Order list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

};