const supportTicketService = require('../services/supportTicketService');
const commonService = require('../services/commonService');

module.exports = class SupportTicketController {

    /** Save Tax **/
    async saveSupportTicket(req, res) {
        try {
            const data = { ...req.body, updatedBy: req.user?._id };
            if (req.method === 'POST') {
                data.createdBy = req?.user?.id;
                const supportTicketData = await supportTicketService.saveTax(null, data);
                return res.status(201).json({ data: supportTicketData, message: 'Support ticket created successfully.' });
            }
            if (req.method === 'PUT' && req?.params?.id) {
                data.updatedBy = req?.user?.id;
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

    /** Delete Tax  **/
    async deleteTax(req, res) {
        try {
            const id = req.params.id;
            const deleted = await supportTicketService.deleteTax(id);
            if (!deleted) return res.status(404).json({ message: 'Tax record not found' });
            return res.status(200).json({ message: 'Tax record deleted successfully' });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Get Tax By Id **/
    async getTax(req, res) {
        try {
            const id = req.params.id;
            const data = await supportTicketService.getTaxById(id);
            if (!data) return res.status(404).json({ message: 'Tax record not found' });
            return res.status(200).json({ data : data, message: 'Tax record fetch successfully' });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Get List Of Tax **/
    async supportTicketList(req, res) {
        try {
            const query = await supportTicketService.buildTaxListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const data = await supportTicketService.taxList(query, options);
            return res.status(200).json({ data: data, message: 'Support ticket list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Tax Record Status **/
    async updateTaxStatus(req, res) {
        try {
            const data = await commonService.updateStatusById(req,'Tax','status', [0, 1]);
            return res.status(200).send({ message: 'Tax status updated successfully', data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }
};