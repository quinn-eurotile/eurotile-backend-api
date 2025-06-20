const RoleModel = require("../models/Role");
const PermissionModel = require("../models/Permission");
const UserModel = require("../models/User");

class RolePermissionService {

    async roleList(query, options) {
        try {
            const result = await RoleModel.paginate(query, options);
            return result;
        } catch (error) {
            console.error(error, 'comming');
            throw error;
        }
    }

    async buildUserListQuery(req) {
        const query = req.query;
        const conditionArr = [{ is_deleted: false },];

        // Add search conditions if 'search_string' is provided
        if (query.search_string !== undefined && query.search_string !== "") {
            conditionArr.push({ $or: [{ name: new RegExp(query.search_string, "i") }] });
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

    async getRawData(req) {
        try {
            const roles = await RoleModel.find({ is_deleted: false }).select('_id name permissions is_deleted');
            const permissions = await PermissionModel.aggregate([
                { $match: { is_deleted: false } }, // Filter out deleted permissions
                { $sort: { module: 1, _id: 1 } },  // Ensure ordering before grouping
                {
                    $group: {
                        _id: "$module", // Group by module
                        permissions: {
                            $push: {
                                _id: "$_id",
                                name: "$name"
                            }
                        }
                    }
                },
                {
                    $project: {
                        module: "$_id",
                        permissions: 1,
                    }
                },
                { $sort: { module: 1 } } // Ensure modules are in original order
            ]);

            return { roles, permissions };
        } catch (error) {
            // //console.log(error, "error in getRawData");
            throw error;
        }
    }

    /*** Create or Update Role Function **/
    async saveRole(req) {
        try {
            const { id } = req.params; // Get role ID if updating
            const { name, permissions, created_by, updated_by } = req.body; 
         
            // Extract only permission IDs from payload
            const permissionIds = permissions.map(p => p.value);

            const roleData = {
                name,
                permissions: permissionIds,
                updated_by,
                updated_at: new Date()
            };

            if (id) {
                // Update existing role
                const updatedRole = await RoleModel.findByIdAndUpdate(id, roleData, { new: true });
                return updatedRole;
            } else {
                // Create new role
                roleData.created_by = created_by;
                roleData.created_at = new Date();
                const newRole = new RoleModel(roleData);
                await newRole.save();
                return newRole;
            }
        } catch (error) {
            // //console.log(error, "error in saveRole");
            throw error;
        }
    }




    async updateRolePermission(req) {

        const { id } = req.params; // Role ID
        const { permission_id } = req.body; // Permission ID

        if (!id || !permission_id) {
            throw { message: "Role ID and Permission ID are required." };
        }

        const role = await RoleModel.findById(id);
        if (!role) {
            throw { message: "Role not found." };
        }

        // Toggle permission (add if not exists, remove if exists)
        const updatedRole = await RoleModel.findByIdAndUpdate(
            id,
            role.permissions.includes(permission_id)
                ? { $pull: { permissions: permission_id } }
                : { $push: { permissions: permission_id } },
            { new: true }
        );

        return updatedRole;
    }



    async softDeleteRole(roleId) {
        try {
            const isRoleAssignToUser = await UserModel.findOne({ roles: { $in: [roleId] } })
            if (isRoleAssignToUser) throw new Error("Role is already assigned to some users")
            // Find the user and update the `deleted_at` field
            const role = await RoleModel.findById(roleId);
            if (!role) throw new Error('Role not found');

            role.is_deleted = true;
            await role.save();
            return true;
        } catch (error) {
            throw error;
        }
    }


}

module.exports = new RolePermissionService();
