const disputeService = require('../services/disputeService');
const commonService = require('../services/commonService');

module.exports = class DisputeController {
    /** Create New Dispute */
    async createDispute(req, res) {
        try {
            const result = await disputeService.saveDispute(req);
            return res.status(201).json({ 
                data: result, 
                message: 'Dispute created successfully.' 
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ 
                message: error.message || 'Something went wrong.' 
            });
        }
    }

    /** Get Dispute List */
    async disputeList(req, res) {
        try {
            const query = await disputeService.buildDisputeListQuery(req);
            const options = {
                sort: { _id: -1 },
                page: Number(req.query.page),
                limit: Number(req.query.limit)
            };
            const data = await disputeService.disputeList(query, options);
            return res.status(200).json({ 
                data: data, 
                message: 'Dispute list retrieved successfully.' 
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ 
                message: error.message 
            });
        }
    }

    /** Get Dispute By Id */
    async getDisputeById(req, res) {
        try {
            const dispute = await disputeService.getDisputeById(req.params.id);
            return res.status(200).json({ 
                data: dispute, 
                message: 'Dispute retrieved successfully.' 
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ 
                message: error.message 
            });
        }
    }

    /** Update Dispute Status */
    async updateDisputeStatus(req, res) {
        try {
            const dispute = await disputeService.updateDisputeStatus(req);
            return res.status(200).json({ 
                data: dispute, 
                message: 'Dispute status updated successfully.' 
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ 
                message: error.message 
            });
        }
    }

    /** Delete Dispute */
    async deleteDispute(req, res) {
        try {
            const data = await commonService.updateIsDeletedById(req, 'Dispute', true);
            return res.status(200).json({ 
                message: 'Dispute deleted successfully', 
                data: data 
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ 
                message: error.message 
            });
        }
    }
}; 