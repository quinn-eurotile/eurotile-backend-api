const userService = require('../services/userService');
const { sendWelcomeEmail,sendVerificationEmail, forgotPasswordEmail } = require('../services/emailService');
const adminService = require('../services/adminService');
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
            const verificationLink = `${process.env.CLIENT_URL}/admin/verify/${user.token}`
            sendVerificationEmail(req, verificationLink); //send email to the user
            return res.json({ type: "success", message: "User registered. Please check your email for verification.", data: user, });
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
            return res.json({ type: 'success', message: 'User updated successfully', data: userData });
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
            return res.json({ type: 'success', message: 'Profile updated successfully', data: updatedUser });
        } catch (error) {
            return res.json({ type: 'failure', message: 'Failed to update profile' });
        }
    }

    /** Delete User By Api Request */
    async deleteUser(req, res) {
        try {
            const userId = req.body.user_id;
            const result = await adminService.softDeleteUser(userId);
            if (result) {
                return res.status(200).json({ type: 'success', message: "User deleted successfully." });
            }
        } catch (error) {
            return res.status(500).json({ type: 'failure', message: error.message });
        }
    }

    /** Update Password For Admin */
    async updatePassword(req, res) {
        try {
            await userService.updateUserPassword(req, res);
            res.send({ type: 'success', message: 'Password updated successfully' });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
        }
    }

    /** Get User List **/
    async userList(req, res) {
        try {
            const query = await adminService.buildUserListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
            const users = await adminService.userList(query, options);

            // Fetch roles and transform them
            const roles = await RoleModel.find({ is_deleted: false, _id: { $ne: new mongoose.Types.ObjectId(String(constants?.adminRole?.id)) } }).select('_id name');
            const formattedRoles = roles.map(role => ({
                value: role._id,
                label: role.name
            }));

            return res.send({ type: "success", data: users, roles: formattedRoles, message: '' });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
        }
    }



    /** Admin Dashboard  **/
    async dashboardData(req, res) {
        try {
            const data = await adminService.dashboardData(req);
            res.send({ type: 'success', message: "", data: data });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
        }
    }

    /*********************Logou User ANd Update Column ******/
    async logoutUser(req, res) {
        try {
            await userService.logoutUser(req);
            res.status(200).send({ type: 'success', message: "Admin logout successfully" });
        } catch (error) {
            res.status(200).send({ type: 'failure', message: error.message });
        }
    }

    /*** Save New User Data ************/
    async createUser(req, res) {
        try {
            const user = await adminService.createUser(req);
            sendWelcomeEmail(req); //send email to the user
            return res.json({ type: "success", message: "User created successfully", data: user, });
        } catch (error) {
            return res.json({ type: "failure", message: error.message });
        }
    }

    async loginUser(req, res) {
        try {
            req.body.for_admin = true;
            const data = await userService.authenticateUser(req);
            res.status(200).send({ type: 'success', message: 'You are successfully logged in', data: data.user, access_token: data.access_token });
        } catch (error) {
            res.status(401).send({ type: 'failure', message: error.message });
        }
    }

    /*** Update User From Here ***/
    async updateUser(req, res) {
        try {
            const updatedUser = await userService.updateUserById(req);
            res.status(200).send({ type: 'success', message: 'User updated successfully', data: updatedUser });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
        }
    }

    async forgotPassword(req, res) {
        try {
            req.body.for_admin = true;
            const token = await userService.forgotPassword(req);
            forgotPasswordEmail(req, token);
            res.status(200).send({ status: 200, type: 'success', message: 'Password reset email sent successfully' });
        } catch (error) {
            res.status(404).send({ status: 404, type: 'failure', message: error.message });
        }
    }


    async resetPassword(req, res) {
        try {
            req.body.for_admin = false;
            await userService.resetPassword(req);
            res.send({ type: 'success', message: 'Password reset successfully' });
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
