const userService = require('../services/userService');
const { sendVerificationEmail, forgotPasswordEmail, sendAccountStatusEmail } = require('../services/emailService');
const adminService = require('../services/adminService');
const supplierService = require('../services/supplierService');
const tradeProfessionalService = require('../services/tradeProfessionalService');
const { getClientUrlByRole } = require('../_helpers/common');
const util = require('util');
const Fs = require('fs');
const writeFileAsync = util.promisify(Fs.writeFile);
const AdminSetting = require("../models/AdminSetting");
const commonService = require('../services/commonService');
const constants = require('../configs/constant');

module.exports = class AdminController {


    /** Get Current Settings */
    async settingsList(req, res) {
        try {
            console.log('I am here')
            const settings = await AdminSetting.findOne();
            if (!settings) {
                return res.status(404).json({ message: 'No settings found' });
            }
            return res.status(200).json({ message: 'Admin settings get successfully', data: settings });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Setting By Admin */
    async updateSettings(req, res) {
        try {
            const updateFields = req.body;

            // Ensure at least one field is being updated
            if (!updateFields || Object.keys(updateFields).length === 0) {
                return res.status(400).json({ message: 'At least one setting field is required.' });
            }

            let settings = await AdminSetting.findOne();

            if (settings) {
                // Update only the fields provided in the body
                Object.keys(updateFields).forEach(key => {
                    settings[key] = updateFields[key];
                });
                await settings.save();
            } else {
                // Create new settings with provided fields
                settings = await AdminSetting.create(updateFields);
            }

            return res.status(200).json({ message: 'Settings updated successfully', data: settings });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    }


    /** Update Tax Record Status **/
    async updateTradeBusinessProfileStatus(req, res) {
        try {
            const data = await commonService.updateStatusById(req, 'UserBusinessDocument', 'status', [0, 1, 2, 3]);
            return res.status(200).send({ message: 'Document status updated successfully', data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Tax Record Status **/
    async updateTradeProfessionalBusinessStatus(req, res) {
        try {
            console.log(req.params.id);
            let message = "Business Account Rejected";
            if (req.body.status === 1) {
                message = "Business Account Approved";
            }
            const data = await commonService.updateStatusById(req, 'UserBusiness', 'status', [0, 1, 2], { reason: req.body.reason, updated_by: req.user?._id });
            const CLIENT_URL = getClientUrlByRole('Trade Professional'); // or user.role if it's a string
            const link = `${CLIENT_URL}`;
            sendAccountStatusEmail(req, link, message);

            return res.status(200).send({ message: 'Trade professional status updated successfully', data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Trade Professional List **/
    async tradeProfessionalList(req, res) {
        try {
            const query = await tradeProfessionalService.buildTradeProfessionalListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const data = await tradeProfessionalService.tradeProfessionalList(query, options);
            return res.status(200).json({ data: data, message: 'Trade professional list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Trade Professional By Their Id */
    async getTradeProfessionalById(req, res) {
        try {
            const userId = req?.params?.id;
            const user = await userService.getUserById(userId, '', { roles : '_id name'});
            let data;
            let message;

             const roles = user?.roles?.map((el) => el?.id);
                        
            if(roles?.includes(constants?.adminRole?.id)){
                    data = user
                    message = 'Admin get successfully';
            }else{
                    data = await tradeProfessionalService.getTradeProfessionalById(userId);
                    message = 'Trade professional get successfully';
            }
            
            return res.status(200).json({ message: message, data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Update Status For Trade Professional */
    async updateTradeProfessionalStatus(req, res) {
        try {
            let message = "Account Inactive";
            if (req.body.status === 1) {
                message = "Account Active";
            }
            const data = await commonService.updateStatusById(req, 'User', 'status', [0, 1, 2], { reason: req.body.reason, updated_by: req.user?._id });
            const CLIENT_URL = getClientUrlByRole('Trade Professional'); // or user.role if it's a string
            const link = `${CLIENT_URL}`;
            sendAccountStatusEmail(req, link, message);
            return res.status(200).send({ message: 'Trade professional status updated successfully', data: data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Delete Trade Professional By Api Request */
    async deleteTradeProfessional(req, res) {
        try {
            const userId = req?.params?.id;
            await tradeProfessionalService.softDeleteTradeProfessional(userId);
            return res.status(200).json({ message: "Trade professional deleted successfully." });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /*** Register New Admin **/
    async registerAdmin(req, res) {
        try {
            const user = await adminService.registerAdmin(req);
            /* const verificationLink = `${process.env.CLIENT_URL}/admin/verify/${user.token}`;
            sendVerificationEmail(req, verificationLink); */
            return res.status(201).json({ message: "Admin registered. Please check your email for verification.", data: user, });
        } catch (error) {
            return res.status(error?.statusCode || 500).json({ message: error?.message });
        }
    }

    /** Get Team Member List **/
    async teamMemberList(req, res) {
        try {
            const query = await adminService.buildTeamMemberListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const teamMembers = await adminService.teamMemberList(query, options);
            return res.status(200).json({ data: teamMembers, message: 'Team member list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /*** Save New Team member Data ****/
    async createTeamMember(req, res) {
        try {
            const user = await adminService.createTeamMember(req);
            const CLIENT_URL = getClientUrlByRole('Admin'); // or user.role if it's a string
            const verificationLink = `${CLIENT_URL}/reset-password/${user.token}`;
            sendVerificationEmail(req, verificationLink);
            return res.json({ type: "success", message: "Team member created successfully", data: user, });
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

    async updateTeamMemberStatus(req, res) {
        try {
            const updatedUser = await adminService.updateTeamMemberStatusById(req);
            return res.status(200).send({ message: 'Team member status updated successfully', data: updatedUser });
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

    /** Get Supplier List **/
    async supplierList(req, res) {
        try {
            const query = await supplierService.buildSupplierListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const supplierData = await supplierService.supplierList(query, options);
            return res.status(200).json({ data: supplierData, message: 'Supplier list get successfully.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /*** Save New Supplier Data ****/
    async createSupplier(req, res) {
        try {
            const result = await supplierService.saveSupplier(req);
            return res.status(201).json({ message: 'Supplier created successfully.', user: result, });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /*** Update Supplier From Here ***/
    async updateSupplier(req, res) {
        try {
            const updateSupplierData = await supplierService.saveSupplier(req);
            return res.status(200).send({ message: 'Supplier updated successfully', data: updateSupplierData });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Delete Supplier By Api Request */
    async deleteSupplier(req, res) {
        try {
            const userId = req?.params?.id;
            await supplierService.softDeleteSupplier(userId);
            return res.status(200).json({ message: "Supplier deleted successfully." });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Get Supplier By Their Id */
    async getSupplierById(req, res) {
        try {
            const userId = req?.params?.id;
            const supplierData = await supplierService.getSupplierById(userId);
            return res.status(200).json({ message: 'Supplier get successfully', data: supplierData });
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

    /** Logout Method **/
    async logoutUser(req, res) {
        try {
            await userService.logoutUser(req);
            return res.status(200).json({ message: 'Logout successfully', data: updatedUser });
        } catch (error) {
            return res.status(200).json({ type: 'failure', message: error.message });
        }
    }

    /** Login User Method **/
    async loginUser(req, res) {
        try {
            console.log('req.body', req.body);
            req.body.for_which_role = 'admin';
            const data = await userService.authenticateUser(req);
            return res.status(200).json({ message: 'You are successfully logged in', data: data.user, access_token: data.access_token });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Forgot Password Method **/
    async forgotPassword(req, res) {
        try {
            req.body.for_which_role = 'admin';
            const token = await userService.forgotPassword(req);
            
            forgotPasswordEmail(req, token);
            return res.status(200).json({ statusCode: 200, message: 'Password reset email sent successfully' });
        } catch (error) {
            console.log('message: error.message',  error.message);
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /** Reset Password Method **/
    async resetPassword(req, res) {
        try {
            req.body.for_which_role = 'admin';
            
            await userService.resetPassword(req);
            return res.status(200).json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    /*********************verified email******/
    async verifyEmail(req, res) {
        try {
            await adminService.verifyEmail(req);
            return res.json({ type: "success", message: "Email verified successfully" });
        } catch (error) {
            return res.json({ type: "failure", message: error.message });
        }
    }


    /*********************Resend email******/
    async resendEmail(req, res) {
        try {
            await adminService.resendEmail(req);
            return res.json({ type: "success", message: "Email resend successfully" });
        } catch (error) {
            return res.json({ type: "failure", message: error.message });
        }
    }




    /** Update User Profile */
    async updateUserProfile(req, res) {
        try {
            req.body.updated_by = req.user.id;
            const { first_name, role, last_name, email, updated_by } = req.body;
            let userData = await userService.conditionBasedUpdateUser(
                { _id: req.params.id },
                { first_name, last_name, email, updated_by, phonenumber, role },
                { new: true }
            );
            return res.json({ message: 'User updated successfully', data: userData });
        } catch (error) {
            return res.json({ type: 'failure', message: error.message });
        }
    }


    async updateProfile(req, res) {
        try {
            let updatedUser = {};
            if (req.files && req.files.length > 0) {
                const file = req.files[0];
                const FOLDER_PATH = process.env.UPLOAD_BASE + 'images/user';

                if (!Fs.existsSync(FOLDER_PATH)) {
                    Fs.mkdirSync(FOLDER_PATH, { recursive: true });
                }

                const ext = file.originalname.split('.').pop().toLowerCase();
                const file_name = Date.now() + '.' + ext;
                const UPLOAD_PATH = FOLDER_PATH + '/' + file_name.replace(/\s/g, "");

                await writeFileAsync(UPLOAD_PATH, file.buffer, 'binary');

                const FILE_URL = 'images/user/' + file_name.replace(/\s/g, "");
                updatedUser = await userService.updateUserImageData(req, FILE_URL);
            } else {
                updatedUser = await userService.updateUserById(req);
            }
            return res.json({ message: 'Profile updated successfully', data: updatedUser });
        } catch (error) {
            return res.json({ type: 'failure', message: 'Failed to update profile' });
        }
    }



    /** Update Password For Admin */
    async updatePassword(req, res) {
        try {
            await userService.updateUserPassword(req, res);
            res.send({ message: 'Password updated successfully' });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
        }
    }



};
