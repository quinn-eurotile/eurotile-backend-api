const commonService = require('../services/commonService');

module.exports = class OrderController {


    /** * Get current user's profile */
    async getProfile(req, res) {
        try {
            const userProfile = await commonService.getUserProfile(req);
            return res.status(200).send({ message: '', data: userProfile });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }

    };

    /** * Update current user's profile */
    async updateProfile(req, res) {
        try {
            const updatedUser = await commonService.updateUserProfile(req);
            return res.status(200).send({ message: '', data: updatedUser });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    };

    /** * Controller: Update current user's password */
    async updateUserPassword(req, res) {
        try {
            await commonService.updateUserPassword(req);
            return res.status(200).json({ message: "Password updated successfully"});
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message || "Failed to update password", });
        }
    };

};