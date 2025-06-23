const { Category } = require('../models');
const cmsService = require('../services/cmsService');

class CmsController {
    async getHomePageData(req, res) {
        try {
            const data = await cmsService.getHomePageData();
            return res.status(200).json({
                message: 'Homepage data fetched successfully',
                data
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                message: error.message || 'Failed to fetch homepage data',
            });
        }
    }
}

module.exports = new CmsController(); 