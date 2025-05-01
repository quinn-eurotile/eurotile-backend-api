const userModel = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helpers = require("../_helpers/common");
const mongoose = require('mongoose');
const constants = require('../configs/constant');

class UserService {


	/*** Update User By Id ***/
	async updateUserById(req) {
		const { first_name, last_name, email, roles } = req.body;
		const updatedUser = await userModel.findOneAndUpdate({ _id: req.params.id }, { email, first_name, last_name, roles: Array.isArray(roles) ? roles : [roles], }, { new: true });
		if (!updatedUser) throw new Error("User does not found");
		return updatedUser;
	}

	/*** Create User ***/
	async createUser(req) {

		const { first_name, last_name, email, role } = req.body;
		const genSalt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash('123456789', genSalt); // Hash the password

		// Create a new user in the database
		const newUser = new userModel({ first_name, last_name, email, role, password: hashedPassword, status: 1 });

		await newUser.save();

		if (!newUser) throw new Error("User not found");

		return newUser;
	}

	async checkUserPermission(req) {
		const userId = req.user?.id;
		const user = await userModel.findOne({ _id: userId }).populate({ path: 'roles', select: '_id name module permissions', populate: { path: 'permissions', select: "_id name slug" } }).select("+password");
		if (!user) throw new Error("User not found");
		return user;
	}

	async authenticateUser(req) {
		const { email, password, for_which_role } = req.body;
		let lowerCaseEmail = email.toLowerCase();
		let conditions = {};
		if (for_which_role == "admin") {
			conditions = { email: lowerCaseEmail, roles: { $in: [new mongoose.Types.ObjectId(String(constants?.adminRole?.id))] } };
		} else {
			conditions = { email: lowerCaseEmail, roles: { $nin: [new mongoose.Types.ObjectId(String(constants?.adminRole?.id))] } };
		}

		const user = await userModel.findOne(conditions).populate({ path: 'roles', select: '_id name module permissions', populate: { path: 'permissions', select: "_id name slug" } }).select("+password");


		if (!user) throw new Error("User not found");
		if (user.status === 0) throw new Error("Your account is inactive");

		const match = await bcrypt.compare(password.trim(), user.password.trim());
		if (!match) throw new Error("Passwords do not match");
		if (user.status === 2) {
			throw new Error("Your account is inactive");
		}
		// Generate JWT token
		const token = jwt.sign(
			{
				id: user._id,
				user_id: user._id,
				email: lowerCaseEmail,
				role_name: user.rolename,
				roles: user.roles,
				status: user.status,
				full_name: user.fullname,
				user_image: user.user_image,
				first_name: user.first_name,
				phonenumber: user.phonenumber,
				last_name: user.last_name,
				notification_settings: user.notification_settings,
			},
			process.env.TOKEN_KEY,
			{ expiresIn: "30d" }
		);
		return { user: user, access_token: token };
	}



	/****Conditions Based Update ***/
	async conditionBasedUpdateUser(filter, update, options) {
		try {
			return await userModel.findOneAndUpdate(filter, update, options);
		} catch (err) {
			throw new Error(err.message);
		}
	}


	/** Dashboad Data Get For User */
	async dashboardData(req) {
		try {
			const userData = await this.getUserById(req.user.id, "");
			const totalAmount = await paymentService.getTotalAmount(req);
			return { userData, totalAmount };
		} catch (err) {
			throw new Error(err.message);
		}
	}


	/** Logout User */
	async logoutUser(req) {
		const user = await userModel.findById(req.user.id);
		if (!user) throw new Error("User not found");
		return true;
	}



	/*** Get User By Id ***/
	async getUserById(userId, selectFields = "", populateFields = "") {
		try {
			let query = userModel.findById(userId);

			// Select specific fields if provided
			if (selectFields) {
				query = query.select(selectFields);
			}

			// Populate specific fields if provided
			if (populateFields) {
				for (const path in populateFields) {
					if (populateFields.hasOwnProperty(path)) {
						const selectOption = populateFields[path];
						query = query.populate({
							path: path,
							select: selectOption,
						});
					}
				}
			}

			return await query.exec();
		} catch (err) {
			throw new Error("User not found");
		}
	}

	/*** Get User By Object ***/
	async getUserByObject(object) {
		const user = await userModel.findOne(object);
		if (!user) {
			return null;
		}
		return user;
	}



	async updateUserImageData(req, imageData) {
		try {
			const { first_name, last_name, phonenumber } = req.body;
			return await userModel.findOneAndUpdate(
				{ _id: req.user.id },
				{ first_name, last_name, phonenumber, user_image: imageData, },
				{ new: true }
			);
		} catch (error) {
			throw new Error(error.message);
		}
	}

	/*** Forgot Password Method By Email ***/
	async forgotPassword(req, res) {
		try {
			const { email, for_which_role } = req.body;

			if (!email) {
				return res.status(400).json({ message: 'Email is required.' });
			}

			const lowerCaseEmail = email.toLowerCase();
			let conditions = {};

			if (for_which_role == "admin") {
				conditions = {
					email: lowerCaseEmail,
					roles: { $in: [new mongoose.Types.ObjectId(String(constants?.adminRole?.id))] },
				};
			} else {
				conditions = {
					email: lowerCaseEmail,
					roles: { $nin: [new mongoose.Types.ObjectId(String(constants?.adminRole?.id))] },
				};
			}

			const user = await userModel.findOne(conditions);

			if (!user) {
				return res.status(404).json({ message: 'User not found.' });
			}

			const token = helpers.randomString(20);
			user.token = token;
			await user.save();

			// You may also send email here using your mail service

			return res.status(200).json({ message: 'Reset token generated successfully.', token });
		} catch (error) {
			console.error('Forgot Password Error:', error);
			return res.status(500).json({
				message: error.message || 'Something went wrong while generating the reset token.',
			});
		}
	}


	/*** Reset Password Method By Email ***/
	async resetPassword(req, res) {
		try {
			const { token, password, for_admin } = req.body;

			if (!token || !password) {
				return res.status(400).json({ message: 'Token and password are required.' });
			}

			const user = await userModel.findOne({ token });

			if (!user) {
				return res.status(401).json({ message: 'Invalid or expired token.' });
			}

			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);

			user.password = hashedPassword;
			user.token = null;

			await user.save();

			return res.status(200).json({ message: 'Password reset successful.' });
		} catch (error) {
			console.error('Reset Password Error:', error);
			return res.status(error.statusCode || 500).json({
				message: error.message || 'Something went wrong while resetting the password.'
			});
		}
	}


	async updateUserPassword(req) {
		const { currentpassword, newpassword, confirmpassword } = req.body;

		const user = await userModel
			.findOne({ _id: req.user.id })
			.select("+password");

		if (!user) throw new Error("User does not found");
		const passwordMatch = await bcrypt.compare(currentpassword, user.password);
		if (!passwordMatch) {
			throw new Error("Current password is incorrect");
		}
		// Check if new password matches the confirm password
		if (newpassword !== confirmpassword) {
			throw new Error("New password and confirm password do not match");
		}
		const genSalt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newpassword, genSalt); // Hash the password
		user.password = hashedPassword;
		return await user.save();
	}

	/** Get User List  */
	async userList(query, options) {
		try {
			const result = await userModel.paginate(query, options);
			return result;
		} catch (error) {
			throw error;
		}
	}

	async buildUserListQuery(req) {
		let query = req.query;
		const conditionArr = [{ _id: { $ne: req.user.id } }];

		if (query.search_string !== undefined && query.search_string !== "") {
			conditionArr.push({
				$or: [
					{ first_name: new RegExp(query.search_string, "i") },
					{ last_name: new RegExp(query.search_string, "i") },
					{ email: new RegExp(query.search_string, "i") },
					{ phone: new RegExp(query.search_string, "i") },
				],
			});
		}

		let builtQuery = {};
		if (conditionArr.length === 1) {
			builtQuery = conditionArr[0];
		} else if (conditionArr.length > 1) {
			builtQuery = { $and: conditionArr };
		}

		return builtQuery;
	};



}

module.exports = new UserService();
