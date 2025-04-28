const mongoose = require("mongoose");
const Role = require("../models/Role");
const User = require("../models/User");

/**
 * Middleware to check if the user has a required permission
 * @param {String} requiredPermission - The permission to check (e.g., "manage_users")
 */
const checkPermission = (requiredPermission) => {
  
    return async (req, res, next) => {
        try {
            // Get user roles from the request (assuming it's already attached)
            const user = await User.findOne({_id : req.user.id}).populate({path : 'roles', select : '_id name module permissions', populate : {path : 'permissions', select : "_id name slug"}}).select("+password");
            // console.log('user',user)
            
            if (!user || !Array.isArray(user.roles) || user.roles.length === 0) {
                return res.json({ type : "failure", message: "Access Denied: No roles assigned." });
            }

            // Fetch all roles and their associated permissions
            const roles = await Role.find({ _id: { $in: user.roles } }).populate("permissions");
           
            if (!roles || roles.length === 0) {
                return res.json({ type : "failure", message: "Access Denied: Invalid roles." });
            }

            // Check if any role grants the required permission
            const hasPermission = roles.some((role) =>
                role.permissions.some((perm) => perm?.slug.trim() === requiredPermission.trim())
            );
            

            if (!hasPermission) {
                return res.json({ type : "failure", message: "Access Denied: Insufficient permissions." });
            }

            // Proceed if authorized
            next();
        } catch (error) {
            console.error("Permission Check Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };
};

module.exports = checkPermission;
