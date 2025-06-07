
const { sendVerificationEmail } = require('../services/emailService');
const tradeProfessionalService = require('../services/tradeProfessionalService');
const { getClientUrlByRole } = require('../_helpers/common');
const { User } = require('../models');
const commonService = require('../services/commonService');

module.exports = class TradeProfessionalController {

    /** Create Connect Account */
    async createConnectAccount(req, res) {
        try {
            const data = await tradeProfessionalService.createConnectAccount(req);
            return res.status(200).json({ type: "success", message: "Account connected successfully", data: data });
        } catch (error) {
            // console.log('error comming here',error);
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get All Client For Specific Trade Professional */
    async allClient(req, res) {
        try {
            const data = await tradeProfessionalService.allClient(req);
            return res.json({ type: "success", message: "Client list get successfully", data: data, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /*** Save New Client Data ****/
    async saveClient(req, res) {
        try {
            // console.log('req.body', req.body);
            const { client, isNew } = await tradeProfessionalService.saveClient(req);
            return res.json({ type: "success", message: isNew ? "Client created successfully" : "Client updated successfully", data: client, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Client List **/
    async clientList(req, res) {
        try {
            const query = await tradeProfessionalService.buildClientListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const clients = await tradeProfessionalService.clientList(query, options);
            return res.status(200).json({ data: clients, message: 'Client list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

     /** Delete Client Request */
     async deleteClient(req, res) {
        try {
            const data = await commonService.updateIsDeletedById(req, 'User', true);
            return res.status(200).send({ message: 'Client deleted successfully'});
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }


    /*** Save New Trade Professional Data ****/
    async createTradeProfessional(req, res) {
        try {
            const user = await tradeProfessionalService.createTradeProfessional(req);
            const CLIENT_URL = getClientUrlByRole('Trade Professional'); // or user.role if it's a string
            const verificationLink = `${CLIENT_URL}/verify-email/${user.token}`;
            sendVerificationEmail(req, verificationLink);
            return res.json({ type: "success", message: "Trade professional created successfully", data: user, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    async updateTradeProfessional(req, res) {
        try {
            const user = await tradeProfessionalService.updateTradeProfessional(req);
            return res.json({ type: "success", message: "Trade professional updated successfully", data: user });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    async updateTradeProfessionalStatus(req, res) {
        try {
            // Find the user by token — do not use `.lean()` here
            const user = await User.findOne({ token: req?.params?.token });

            // If user not found, throw error
            if (!user) return res.status(404).json({ message: 'Token mismatch' });

            // Update the fields
            user.status = req?.body.status;
            user.token = null;

            // Save the document
            await user.save();

            // Return success response
            return res.json({
                type: "success",
                message: "Trade professional verified successfully",
                data: user
            });

        } catch (error) {
            // console.log('asxsax');
            return res.status(error.statusCode || 500).json({
                message: error.message || 'Something went wrong'
            });
        }
    }

    async getDashboardData(req, res) {
         try {
            const data = await tradeProfessionalService.getDashboardData(req)
            return res.json({ type: "success", message: "", data: data, });
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
    async getClientById(req, res) {
        try {
            
            const data = await tradeProfessionalService.getClientById(req);
            res.send({ message: "", data: data });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
        }
    }
    

};
