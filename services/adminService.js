const userModel = require('../models/User');
const supplierModel = require('../models/Supplier');
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
            const userCount = await userModel.countDocuments();
            return { userCount };
        } catch (err) {
            throw new Error(err.message);
        }
    }

    /** Get Team Member List */
    async teamMemberList(query, options) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            const pipeline = [
                { $match: query },

                /* {
                    $lookup: {
                        from: 'teams',
                        localField: 'teamId',
                        foreignField: '_id',
                        as: 'team'
                    }
                },
                { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } }, */

                {
                    $facet: {
                        metadata: [
                            { $count: "totalDocs" }
                        ],
                        statusCounts: [
                            {
                                $group: {
                                    _id: "$status",
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        data: [
                            { $sort: sort },
                            { $skip: skip },
                            { $limit: limit }
                        ]
                    }
                },
                {
                    $project: {
                        data: 1,
                        totalDocs: { $arrayElemAt: ["$metadata.totalDocs", 0] },
                        statusCounts: 1
                    }
                }
            ];

            const [result] = await userModel.aggregate(pipeline);

            const totalDocs = result.totalDocs || 0;
            const statusCounts = result.statusCounts.reduce((acc, item) => {
                const statusMap = { 1: 'active', 0: 'inactive', 2: 'pending' };
                const key = statusMap[item._id];
                if (key) {
                    acc[key] = item.count;
                }
                return acc;
            }, { active: 0, inactive: 0, pending: 0 });

            return {
                docs: result.data,
                totalDocs,
                limit,
                page,
                totalPages: Math.ceil(totalDocs / limit),
                hasNextPage: page * limit < totalDocs,
                hasPrevPage: page > 1,
                nextPage: page * limit < totalDocs ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
                statusSummary: {
                    active: statusCounts.active || 0,
                    inactive: statusCounts.inactive || 0,
                    pending: statusCounts.pending || 0
                }
            };
        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching users',
                statusCode: error?.statusCode || 500
            };
        }
    }



    /** Create A Team Member */
    async createTeamMember(req) {
        try {
            const { name, email, phone, status } = req.body;
            const lowerCaseEmail = email.trim().toLowerCase();
            const token = helpers.randomString(20);

            const newTeamMember = new userModel({
                name,
                phone,
                token,
                email: lowerCaseEmail,
                roles: [new mongoose.Types.ObjectId(String(constants?.teamMemberRole?.id))],
                status: status ?? 0,
                createdBy: req?.user?.id || null,
                updatedBy: req?.user?.id || null,
            });

            await newTeamMember.save();

            if (!newTeamMember) {
                throw { message: 'Failed to create team member', statusCode: 500 };
            }

            return newTeamMember;

        } catch (error) {
            throw {
                message: error?.message || 'Error creating team member',
                statusCode: error?.statusCode || 500
            };
        }
    }

    async buildTeamMemberListQuery(req) {
        const query = req.query;
        const conditionArr = [
            {
                roles: { $in: [new mongoose.Types.ObjectId(String(constants?.teamMemberRole?.id))] },
                createdBy: new mongoose.Types.ObjectId(String(req.user.id)),
                isDeleted: false,
            },
        ];
        if (query.status !== undefined) {
            if (query.status === "0" || query.status === 0) {
                conditionArr.push({ status: 0 });
            } else if (query.status === "1" || query.status === 1) {
                conditionArr.push({ status: 1 });
            } else if (query.status === "2" || query.status === 2) {
                conditionArr.push({ status: 2 });
            }
        }


        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({
                $or: [
                    { name: new RegExp(query.search_string, "i") },
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

    /*** Update User By Id ***/
    async updateTeamMemberById(req) {
        try {
            const { name, email, phone, status } = req.body;

            console.log({ name, email, phone }, 'lllllllllll');

            const { id } = req.params;

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw {
                    message: 'Invalid team member ID',
                    statusCode: 400
                };
            }

            const lowerCaseEmail = email.trim().toLowerCase();

            const updatedUser = await userModel.findByIdAndUpdate(
                id,
                { name, phone, email: lowerCaseEmail, status },
                { new: true }
            );

            if (!updatedUser) {
                throw {
                    message: 'User not found',
                    statusCode: 404
                };
            }

            return updatedUser;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update team member',
                statusCode: error?.statusCode || 500
            };
        }
    }


    async softDeleteTeamMember(userId) {
        try {
            // const isUserAssignToCase = await caseModal.findOne({ case_team: { $in: [userId] } });
            // if (isUserAssignToCase) throw new Error("User is already assigned to another case");
            // Find the user and update the `deleted_at` field
            const user = await userModel.findById({ _id: userId });
            if (!user) throw new Error({ message: 'User not found', statusCode: 404 });
            user.isDeleted = true;
            await user.save();
            return true;
        } catch (error) {
            throw {
                message: error?.message || 'Something went wrong while fetching users',
                statusCode: error?.statusCode || 500
            };
        }
    }

    // Verify Email
    async verifyEmail(req) {
        try {
            const user = await userModel.findOne({ token: req.params.token });
            if (!user) throw new Error("Invalid verification token");
            user.status = 1;
            user.token = null;
            await user.save();
            return true;
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
            console.log(verificationLink, "verificationLinkverificationLink");

            await user.save();
            // Send a new verification email
            sendVerificationEmail(req, verificationLink); //send email to the user
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AdminService();
