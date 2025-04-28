const userModel = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const constants = require('../configs/constant');
const helpers = require("../_helpers/common");
const { sendVerificationEmail } = require("../services/emailService");

class AdminService {

    async registerAdmin(req) {
        req.body.email = req.body.email.toLowerCase();
        // Extract the password from the request body
        const password = req.body.password;
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        // Hash the password with the generated salt
        const hashedPassword = await bcrypt.hash(password, salt);
        const token = helpers.randomString(20);

        // Create a new user in the database
        const newUser = new userModel({
            name: req.body.name, 
            email: req.body.email,
            token: token,
            roles: [String(constants?.adminRole?.id)],
            password: hashedPassword,
            status: 0,
            phone: req.body.phone,
        });

        await newUser.save();

        if (!newUser) throw new Error("Something went wrong");
        return newUser;
    }

    /** Get Total User **/
    async dashboardData(req) {
        try {
            const userCount = await userModel.countDocuments({ role: 2 });
            return { userCount };
        } catch (err) {
            throw new Error(err.message);
        }
    }

    /** Get User List  */
    async userList(query, options) {
        try {
            const result = await userModel.paginate(query, options);
            return result;
        } catch (error) {
            console.error(error, 'comming');
            throw error;
        }
    }

    async buildUserListQuery(req) {
        const query = req.query;
        const conditionArr = [
            {
                role: { $ne: 1 },
                created_by: new mongoose.Types.ObjectId(String(req.user.id)),
                is_deleted: false,
            },
        ];
        if (query.status !== undefined) {
            if (query.status === "0") {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1") {
                conditionArr.push({ status: 1 });
            }
        }


        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { first_name: new RegExp(query.search_string, "i") },
                    { last_name: new RegExp(query.search_string, "i") },
                    {
                        $expr: {
                            $regexMatch: {
                                input: {
                                    $concat: [
                                        '$first_name',
                                        ' ',
                                        '$last_name'
                                    ]
                                },
                                regex: new RegExp(query.search_string, 'i')
                            }
                        }
                    },
                    { email: new RegExp(query.search_string, "i") },
                    { phone: new RegExp(query.search_string, "i") },
                ],
            });
        }

        // Construct the final query
        let builtQuery = {};
        if (conditionArr.length === 1) {
            builtQuery = conditionArr[0];
        } else if (conditionArr.length > 1) {
            builtQuery = { $and: conditionArr };
        }

        return builtQuery;
    }

    async softDeleteUser(userId) {
        try {
            // const isUserAssignToCase = await caseModal.findOne({ case_team: { $in: [userId] } });
            // if (isUserAssignToCase) throw new Error("User is already assigned to another case");
            // Find the user and update the `deleted_at` field
            const user = await userModel.findById({ _id: userId });
            if (!user) throw new Error('User not found');

            user.isDeleted = true;
            await user.save();
            return true;
        } catch (error) {
            throw error;
        }
    }


    async createUser(req) {

        const { first_name, last_name, email, roles } = req.body;
        let lowerCaseEmail = email.toLowerCase();

        const password = Math.random().toString(36).substring(-10); // Generate a random password
        req.body.password = password;
        const genSalt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, genSalt); // Hash the password

        // Create a new user in the database
        const newUser = new userModel({
            first_name, last_name, email: lowerCaseEmail,
            roles: Array.isArray(roles) ? roles : [roles],
            password: hashedPassword, status: 1, created_by: req.user.id || null, updated_by: req.user.id || null
        });

        await newUser.save();

        if (!newUser) throw new Error("User not found");

        return newUser;
    }


    // Verify Email
    async verifyEmail(req) {
        try {
            const user = await userModel.findOne({ token: req.params.token });
            if (!user) throw new Error("Invalid verification token");
            user.status = 1;
            user.token = null;
            await user.save();
            return true
        } catch (error) {
            throw error;

        }
    }


    // Resend Verification Email
    async resendEmail(req) {
        const { email } = req.body;
        try {
            const user = await userModel.findOne({ email });
            req.body.first_name = user.first_name;
            req.body.last_name = user.last_name;
            if (!user) throw new Error("User not found");
            if (user.status === 1) {
                throw new Error("Please verify your email first.");
            }
            // Generate a new verification token
            const token = helpers.randomString(20);
            user.token = token;
            const verificationLink = `${process.env.CLIENT_URL}/admin/verify/${token}`;
            console.log(verificationLink, "verificationLinkverificationLink")

            await user.save();
            // Send a new verification email
            sendVerificationEmail(req, verificationLink); //send email to the user
            return true
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AdminService();
