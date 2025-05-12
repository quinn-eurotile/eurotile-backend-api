
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

    /*** Update Team Member From Here ***/
    async updateTeamMember(req, res) {
        try {
            const updatedUser = await adminService.updateTeamMemberById(req);
            return res.status(200).send({ message: 'Team member updated successfully', data: updatedUser });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Delete Team Member By Api Request */
    async deleteTeamMember(req, res) {
        try {
            const userId = req?.params?.id;
            await adminService.softDeleteTeamMember(userId);
            return res.status(200).json({ message: "Team member deleted successfully." });
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
