const supportTicketService = require('../services/supportTicketService');
const commonService = require('../services/commonService');

module.exports = class SupportTicketController {

    /** Send Chat Msg  */
    sendChatMessage = async (req, res) => {
        try {
            const result = await supportTicketService.sendChatMessage(req);
            return res.status(201).json({ data: result, message: 'Chat message sent successfully.', });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message || 'Something went wrong.', });
        }
    }

    /** Load More Tickets */
    loadMoreTickets = async (req, res) => {
        try {
            console.log('loadMoreTickets req', req?.params);
            console.log('loadMoreTickets req', req?.query);
            const result = await supportTicketService.loadMoreTickets(req);
            return res.status(200).json({ data: result, message: 'Tickets loaded successfully.', });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message || 'Something went wrong.' });
        }
    }

    /** Load More Messages */
    loadMoreMessage = async (req, res) => {
        try {
            const result = await supportTicketService.loadMoreMessage(req);
            return res.status(200).json({ data: result, message: 'Messages loaded successfully.', });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message || 'Something went wrong.' });
        }
    }

    /** Get Chat According To Ticket  */
    getChatByTicket = async (req, res) => {
        try {
            console.log('getChatByTicket req', req?.params);
            const result = await supportTicketService.getChatByTicket(req);
            return res.status(200).json({ message: 'Chat fetched successfully.', data: result });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message || 'Something went wrong.' });
        }
    };


    /** Update Status For Ticket */
    async updateSupportTicketStatus(req, res) {
        try {
            const data = await commonService.updateStatusById(req, 'SupportTicket', 'status', [0, 1, 2, 3, 4, 5, 6, 7]);
            return res.status(200).send({ message: 'Support ticket status updated successfully', data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

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