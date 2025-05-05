const taxService = require('../services/taxService');
const commonService = require('../services/commonService');

module.exports = class AdminController {

    /** Save Tax **/
    async saveTax(req, res) {
        try {
            const data = { ...req.body, updatedBy: req.user?._id };
            if (req.method === 'POST') {
                data.createdBy = req?.user?.id;
                const taxData = await taxService.saveTax(null, data);
                return res.status(201).json({ data: taxData, message: 'Record saved successfully' });
            }
            if (req.method === 'PUT' && req?.params?.id) {
                console.log('ttttt',req?.params?.id);
                data.updatedBy = req?.user?.id;
                const updated = await taxService.saveTax(req.params.id, data);
                if (!updated) {
                    return res.status(404).json({ success: false, message: 'Tax not found' });
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
            const deleted = await taxService.deleteTax(id);
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
            const data = await taxService.getTaxById(id);
            if (!data) return res.status(404).json({ message: 'Tax record not found' });
            return res.status(200).json({ data : data, message: 'Tax record fetch successfully' });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Get List Of Tax **/
    async taxList(req, res) {
        try {
            const query = await taxService.buildTaxListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const data = await taxService.taxList(query, options);
            return res.status(200).json({ data: data, message: 'Tax list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Tax Record Status **/
    async updateTaxStatus(req, res) {
        try {
            const data = await commonService.updateStatusById(req,'Tax', [0, 1]);
            return res.status(200).send({ message: 'Tax status updated successfully', data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }
};