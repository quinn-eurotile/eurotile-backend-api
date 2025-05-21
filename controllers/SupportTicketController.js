const supportTicketService = require('../services/supportTicketService');
const commonService = require('../services/commonService');

module.exports = class SupportTicketController {

    /** Create Support Ticket **/
    async saveSupportTicket(req, res) {
        try {
            const data = { ...req.body, updatedBy: req.user?._id };
            if (req.method === 'POST') {
                data.createdBy = req?.user?.id;
                const supportTicketData = await supportTicketService.saveSupportTicket(null, data);
                return res.status(201).json({ data: supportTicketData, message: 'Support ticket created successfully.' });
            }
            if (req.method === 'PUT' && req?.params?.id) {
                const updated = await supportTicketService.saveTax(req.params.id, data);
                if (!updated) {
                    return res.status(404).json({ success: false, message: 'Support ticket not found' });
                }
                return res.status(201).json({ data: updated, message: 'Record updated successfully' });
            }
            throw { message: 'Method not allowed', statusCode: 405 };

        } catch (error) {
           
            
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }





    /** Get List Of Tax **/
    async supportTicketList(req, res) {
        try {
            const query = await supportTicketService.buildSupportTicketListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const data = await supportTicketService.supportList(query, options);
            return res.status(200).json({ data: data, message: 'Support ticket list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }


};