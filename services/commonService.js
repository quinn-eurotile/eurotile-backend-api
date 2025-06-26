const modelInstance = require("../models");
const mongoose = require('mongoose');
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

class CommonService {


    /*** Fetch current user's profile * @param {Object} req   */
    async getUserProfile(req) {
        try {
            const user = await User.findOne({ _id: req.user.id, isDeleted: false }).populate("roles").lean();

            if (!user) {
                throw { message: "User not found", statusCode: 404 };
            }

            return user;
        } catch (error) {
            throw {
                message: error?.message || "Failed to get profile",
                statusCode: error?.statusCode || 500,
            };
        }
    }

    /**   * Update current user's profile   * @param {Object} req   */
    async updateUserProfile(req) {
        try {
            // //console.log("Uploaded file:", req.file); // debug
            const userId = req?.params?.id;
            const updateData = req.body;

            // Get user first
            const user = await User.findOne({ _id: userId, isDeleted: false });

            if (!user) {
                throw { message: "User not found", statusCode: 404 };
            }

            // Handle image upload if provided
            if (req.file && req.file.fieldname === "userImage") {


                const uploadDir = path.join(__dirname, '..', 'uploads/profiles', userId);
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Remove old image if exists
                if (user.userImage) {
                    const oldImagePath = path.join(__dirname, "../../", user.userImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                // Save new image
                const fileName = Date.now() + "-" + req.file.originalname;
                const filePath = path.join(uploadDir, fileName);
                fs.writeFileSync(filePath, req.file.buffer);

                // Update path in user document
                updateData.userImage = `uploads/profiles/${userId}/${fileName}`;
            }

            // Update user profile
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId, isDeleted: false },
                { ...updateData, updatedAt: new Date() },
                { new: true }
            );

            if (!updatedUser) {
                throw { message: "User not found or update failed", statusCode: 404 };
            }

            return updatedUser;
        } catch (error) {
            throw {
                message: error?.message || "Failed to update profile",
                statusCode: error?.statusCode || 500,
            };
        }
    }

    /**   * Update current user's password   * @param {Object} req   */
    async updateUserPassword(req) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;

            const user = await User.findOne({ _id: req?.user?.id }).select("+password");
            if (!user) {
                throw { message: "User not found", statusCode: 404 };
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                throw { message: "Current password is incorrect", statusCode: 400 };
            }

            if (newPassword !== confirmPassword) {
                throw { message: "New password and confirm password do not match", statusCode: 400 };
            }

            const hashedPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
            user.password = hashedPassword;
            return await user.save();
        } catch (error) {
            throw {
                message: error?.message || "Failed to update password",
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async updateStatusById(req, modelName, column = 'status', allowedStatuses = [0, 1], extraFields = null) {
        try {
            // Validate model existence
            const model = modelInstance[modelName];
            if (!model) throw { message: `Model "${modelName}" not found`, statusCode: 404 };

            const { id } = req.params;
            const newStatus = req.body[column];

            // Validate ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw { message: 'Invalid ID', statusCode: 400 };
            }

            // Validate new status value
            if (!allowedStatuses.includes(newStatus)) {
                throw {
                    message: `Invalid ${column} value. Allowed values: ${allowedStatuses.join(', ')}`,
                    statusCode: 400
                };
            }

            // Build update object with status column
            const updateData = { [column]: newStatus };

            // Merge extra fields if provided and is an object
            if (extraFields && typeof extraFields === 'object') {
                Object.assign(updateData, extraFields);
            }

            const updatedDoc = await model.findByIdAndUpdate(id, updateData, { new: true });
            if (!updatedDoc) {
                throw { message: 'Document not found', statusCode: 404 };
            }

            return updatedDoc;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update status',
                statusCode: error?.statusCode || 500
            };
        }
    }




    /** Soft Delete Any Model Using Proper Arguments Passed */
    /** Toggle isDeleted flag of any model using proper arguments passed */
    async updateIsDeletedById(req, model, isDeleted = true, allowedValues = [true, false]) {
        try {
            if (!modelInstance[model]) {
                throw { message: `Model "${model}" not found`, statusCode: 404 };
            }
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw { message: 'Invalid ID', statusCode: 400 };
            }
            if (!allowedValues.includes(isDeleted)) {
                throw { message: `Invalid value for isDeleted. Allowed values: ${allowedValues.join(', ')}`, statusCode: 400 };
            }
            const updatedDoc = await modelInstance[model].findByIdAndUpdate(
                id,
                { isDeleted },
                { new: true }
            );
            if (!updatedDoc) {
                throw { message: 'Document not found', statusCode: 404 };
            }
            return updatedDoc;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to update isDeleted flag',
                statusCode: error?.statusCode || 500
            };
        }
    }

    /** Get all documents of any model with optional filters, pagination, sorting */
    async getAllData(model, {
        filters = {},
        projection = null,
        sort = {},
        page = 1,
        limit = 10,
    } = {}) {
        try {
            if (!modelInstance[model]) {
                throw { message: `Model "${model}" not found`, statusCode: 404 };
            }

            const skip = (page - 1) * limit;

            const data = await modelInstance[model]
                .find(filters, projection)
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await modelInstance[model].countDocuments(filters);

            return data;
        } catch (error) {
            throw {
                message: error?.message || 'Failed to fetch data',
                statusCode: error?.statusCode || 500
            };
        }
    }


}

module.exports = new CommonService();