const userService = require("../services/userService");
const { sendWelcomeEmail, forgotPasswordEmail } = require("../services/emailService");
const jwt = require("jsonwebtoken");

module.exports = class UserController {

	/** Dashboard Data For User */
	async dashboardData(req, res) {
		try {
			const data = await userService.dashboardData(req);
			res.send({ type: "success", message: "", data: data });
		} catch (error) {
			res.send({ type: "failure", message: error.message });
		}
	}

	/*********************Logout User ANd Update Column ******/
	async logoutUser(req, res) {
		try {
			await userService.logoutUser(req);
			return res.json({ type: "success", message: "User logout successfully" });
		} catch (error) {
			return res.json({ type: "failure", message: error.message });
		}
	}

	/*** Save New User Data ************/
	async createUser(req, res) {
		try {
			const user = await userService.createUser(req);
			sendWelcomeEmail(req); //send email to the user
			return res.json({ type: "success", message: "User created successfully", data: user, });
		} catch (error) {
			return res.json({ type: "failure", message: error.message });
		}
	}

	async loginUser(req, res) {
		try {
			req.body.for_admin = false;
			const data = await userService.authenticateUser(req);
			return res.status(200).json({ type: "success", message: "You are successfully logged in", data: data.user, access_token: data.access_token, });
		} catch (error) {
			return res.json({ type: "failure", message: error.message });
		}
	}

	/*** Update User From Here ***/
	async updateUser(req, res) {
		try {
			const userId = req.params.id;

			const updatedData = req.body; // Assuming the updated data is sent in the request body

			const updatedUser = await userService.updateUserById(userId, updatedData);

			return res.json({ type: "success", message: "User updated successfully", data: updatedUser });
		} catch (error) {
			return res.json({ type: "failure", message: error.message });
		}
	}

	async checkUserPermission(req, res) {
		try {
            const permission = await userService.checkUserPermission(req);
            return res.status(200).json({ type: "success", message: "", data: permission });
        } catch (error) {
            return res.json({ type: "failure", message: error.message });
        }
	}


	/**** Get User Deatil *************/
	async getUserById(req, res) {
		try {
			const userId = req.params.id;
			const user = await userService.getUserById(userId,"","");
			return res.status(200).json({ type: "success", message: "", data: user });
		} catch (error) {
			return res.json({ type: "failure", message: error.message });
		}
	}

	/*** Get User By Token ***/
	async getUserByToken(req, res) {
		const token = req.body.api_token;
		if (!token) {
			return res.status(200).send({ type: "error", message: "A authorization token is required for user authentication", });
		}
		try {
			const decoded = jwt.verify(token, process.env.TOKEN_KEY);
			return res.status(200).json({ type: "success", message: "", data: decoded });
		} catch (error) {
			return res.json({ type: "failure", message: error.message });
		}
	}

	async forgotPassword(req, res) {
		try {
			req.body.for_admin = false;
			const token = await userService.forgotPassword(req);
			forgotPasswordEmail(req, token);
			return res.status(200).json({ type: "success", message: "Password reset email sent successfully", });
		} catch (error) {
			return res.json({ type: "failure", message: error.message });
		}
	}

	async resetPassword(req, res) {
		try {
			req.body.for_admin = false;
			req.body.role = 2; // this for to check who trying to doing action
			await userService.resetPassword(req);
			return res.json({ type: "success", message: "Password reset successfully", });
		} catch (error) {
			return res.json({ type: "failure", message: error.message });
		}
	}

	/** Get User List **/
	async userList(req, res) {
		try {
			const query = await userService.buildUserListQuery(req);
			const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit) };
			const users = await userService.userList(query, options);
			return res.json({ type: "success", data: users, message: '' });
		} catch (error) {
			return res.json({ type: 'failure', message: error.message });
		}
	}

};
