const supportTicketService = require('../services/supportTicketService');
const commonService = require('../services/commonService');

module.exports = class SupportTicketController {

    /** Create and Update Ticket */
    async saveSupportTicket(req, res) {
        try {
            const result = await supportTicketService.saveTicket(req);
            return res.status(201).json({ data: result, message: 'Support ticket created successfully.', });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message || 'Something went wrong.', });
        }
    }

    /** Delete Support ticket By Api Request */
    async deleteSupportTicket(req, res) {
        try {
            const data = await commonService.updateIsDeletedById(req, 'SupportTicket', true);
            return res.status(200).send({ message: 'Support ticket deleted successfully', data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get List Of Tax **/
    async supportTicketList(req, res) {
        try {
            const query = await supportTicketService.buildSupportTicketListQuery(req);
            const options = {
                sort: { _id: -1 },
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                populate: [{ path: 'sender', select: '_id name' }, { path: 'assignedTo', select: '_id name' }]
            };
            const data = await supportTicketService.supportList(query, options);
            return res.status(200).json({ data: data, message: 'Support ticket list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

};