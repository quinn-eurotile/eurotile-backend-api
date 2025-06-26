const promotionService = require('../services/promotionService');
const commonService = require('../services/commonService');

module.exports = class PromotionController {
    /** Create or update Promotion */
    async savePromotion(req, res) {
        try {
            const result = await promotionService.savePromotion(req);
            console.log('result', result)
            return res.status(201).json({ data: result, message: 'Promotion saved successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message || 'Something went wrong.' });
        }
    }

    /** Delete Promotion (soft delete) */
    async deletePromotion(req, res) {
        try {
            const data = await commonService.updateIsDeletedById(req, 'Promotion', true);
            return res.status(200).send({ message: 'Promotion deleted successfully', data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Promotion Status */
    async updatePromotionStatus(req, res) {
        try {
            const data = await commonService.updateStatusById(req, 'Promotion', 'status', ['active', 'scheduled', 'expired']);
            return res.status(200).send({ message: 'Promotion status updated successfully', data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Promotion List */
    async promotionList(req, res) {
        try {
            const query = await promotionService.buildPromotionListQuery(req);
            const options = {
                sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit), populate: [
                    { path: 'applicableCategories' },
                    { path: 'applicableProducts' }
                ]
            };
            const data = await promotionService.promotionList(query, options);
            return res.status(200).json({ data, message: 'Promotion list fetched successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }
};
