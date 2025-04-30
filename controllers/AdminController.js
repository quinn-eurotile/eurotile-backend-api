const userService = require('../services/userService');
const { sendVerificationEmail, forgotPasswordEmail } = require('../services/emailService');
const adminService = require('../services/adminService');
const supplierService = require('../services/supplierService');
const util = require('util');
const Fs = require('fs');
const writeFileAsync = util.promisify(Fs.writeFile);
const RoleModel = require("../models/Role");
const mongoose = require('mongoose');
const constants = require('../configs/constant');

module.exports = class AdminController {

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
            sendVerificationEmail(req, user?.token); //send email to the user
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
    async getSupplierById(req, res) {
        try {
            const userId = req?.params?.id;
            const supplierData =    await supplierService.getSupplierById(userId);
            return res.status(200).send({ message: 'Supplier get successfully', data: supplierData }); 
        } catch (error) {
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    }

    

    /** Save Category */
    // async saveCategory(req, res) {
    //     try {
    //         const data = { ...req.body, updatedBy: req.user?._id, };

    //         // Detect Create vs Update
    //         if (req.method === 'POST') {
    //             data.createdBy = req.user?._id;
    //             const created = await categoryService.saveCategory(null, data);
    //             return res.status(201).json({ success: true, data: created });
    //         }

    //         if (req.method === 'PUT') {
    //             const categoryId = req.params.id;
    //             const updated = await categoryService.saveCategory(categoryId, data);
    //             if (!updated) return res.status(404).json({ success: false, message: 'Category not found' });
    //             return res.json({ success: true, data: updated });
    //         }

    //         res.status(405).json({ success: false, message: 'Method not allowed' });
    //     } catch (err) {
    //         res.status(500).json({ success: false, message: err.message });
    //     }
    // }


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


    /** Admin Dashboard  **/
    async dashboardData(req, res) {
        try {
            const data = await adminService.dashboardData(req);
            res.send({ message: "", data: data });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
        }
    }

    /*********************Logou User ANd Update Column ******/
    async logoutUser(req, res) {
        try {
            await userService.logoutUser(req);
            res.status(200).send({ message: "Admin logout successfully" });
        } catch (error) {
            res.status(200).send({ type: 'failure', message: error.message });
        }
    }



    async loginUser(req, res) {
        try {
            req.body.for_admin = true;
            const data = await userService.authenticateUser(req);
            res.status(200).send({ message: 'You are successfully logged in', data: data.user, access_token: data.access_token });
        } catch (error) {
            res.status(401).send({ type: 'failure', message: error.message });
        }
    }



    async forgotPassword(req, res) {
        try {
            req.body.for_admin = true;
            const token = await userService.forgotPassword(req);
            forgotPasswordEmail(req, token);
            res.status(200).send({ status: 200, message: 'Password reset email sent successfully' });
        } catch (error) {
            res.status(404).send({ status: 404, type: 'failure', message: error.message });
        }
    }


    async resetPassword(req, res) {
        try {
            req.body.for_admin = false;
            await userService.resetPassword(req);
            res.send({ message: 'Password reset successfully' });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
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

};
