
const { sendVerificationEmail } = require('../services/emailService');
const retailCustomerService = require('../services/retailCustomerService');
const { getClientUrlByRole } = require('../_helpers/common');

module.exports = class RetailCustomerController {


    /*** Save New Retail Customer Data ****/
    async createRetailCustomer(req, res) {
        try {
            const user = await retailCustomerService.createRetailCustomer(req);
            const CLIENT_URL = getClientUrlByRole('Retail Customer'); // or user.role if it's a string
            const verificationLink = `${CLIENT_URL}/verify-email/${user.token}`;
            sendVerificationEmail(req, verificationLink);
            return res.json({ type: "success", message: "Retail customer created successfully", data: user, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /*** Update Retail Customer Data ****/
    async updateRetailCustomer(req, res) {
        try {
            const user = await retailCustomerService.updateRetailCustomer(req);
            return res.json({ type: "success", message: "Retail customer updated successfully", data: user });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /*** Get Retail Customer Dashboard Data ****/
    async getDashboardData(req, res) {
        try {
           const data = await retailCustomerService.getDashboardData(req)
           return res.json({ type: "success", message: "", data: data, });
       } catch (error) {
           return res.status(error.statusCode || 500).json({ message: error.message });
       }
      
   }

   /*** Get Retail Customer By Their Id ****/
   async getRetailCustomerById(req, res) {
    try {
        const userId = req?.params?.id;
        const user = await retailCustomerService.getUserById(userId, '', { roles : '_id name'});
        return res.json({ type: "success", message: "Retail customer get successfully", data: user, });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message });
    }
}
};
