
const { sendVerificationEmail, forgotPasswordEmail } = require('../services/emailService');
const tradeProfessionalService = require('../services/tradeProfessionalService');
const { getClientUrlByRole } = require('../_helpers/common');
const util = require('util');
const Fs = require('fs');
const { log } = require('console');

module.exports = class TradeProfessionalController {


    /*** Save New Trade Professional Data ****/
    async createTradeProfessional(req, res) {
        try {
            const user = await tradeProfessionalService.createTradeProfessional(req);
            /* const CLIENT_URL = getClientUrlByRole('Admin'); // or user.role if it's a string
            const verificationLink = `${CLIENT_URL}/reset-password/${user.token}`;
            sendVerificationEmail(req, verificationLink); */
            return res.json({ type: "success", message: "Trade professional created successfully", data: user, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    async updateTradeProfessional(req, res) {
        try {
            /* console.log(req.body, 'test');
            console.log(req.files, 'test');
            return res.json({ type: "success", message: "Trade professional updated successfully", data: req.body }); */
            const user = await tradeProfessionalService.updateTradeProfessional(req);
            return res.json({ type: "success", message: "Trade professional updated successfully", data: user });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Admin Dashboard  **/
    async dashboardData(req, res) {
        try {
            const data = await adminService.dashboardData(req);
            res.send({ message: "", data: data });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
        }
    }

};
