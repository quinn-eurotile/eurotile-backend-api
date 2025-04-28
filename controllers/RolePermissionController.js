const rolePermissionService = require('../services/rolePermissionService');

module.exports = class RolePermissionController {

    /** Get roleList along with pagination */
    async roleList(req, res) {
        try {
            const query = await rolePermissionService.buildUserListQuery(req);
            const options = { sort: { _id: -1 }, page: Number(req.query.page), limit: Number(req.query.limit), populate: { path: "permissions", select: '_id name module' } };
            const data = await rolePermissionService.roleList(query, options);
            return res.send({ type: "success", data: data, message: '' });
        } catch (error) {
            res.send({ type: 'failure', message: error.message });
        }
    }

    /** Get Raw Data For Role Permission Page */
    async getRawData(req, res) {
        try {
            const data = await rolePermissionService.getRawData(req);
            return res.json({ type: "success", message: "", data: data });
        } catch (error) {
            return res.json({ type: "failure", message: error.message });
        }
    }

    /*** Save role Data ************/
    async saveRole(req, res) {
        try {
            const role = await rolePermissionService.saveRole(req);
            const msg = req.params.id ? "Role has been updated successfully" : "Role has been created successfully"
            return res.json({ type: "success", message: msg, data: role, });
        } catch (error) {
            return res.status(500).json({ type: "failure", message: error.message });
        }
    }


    /** Update role  permission**/
    async updateRolePermission(req, res) {
        try {
            await rolePermissionService.updateRolePermission(req);
            const data = await rolePermissionService.getRawData(req);
            return res.json({ type: "success", message: "", data: data, });
        } catch (error) {
            return res.json({ type: "failure", message: error.message });
        }
    }

    /** Delete role By Api Request */
    async deleteRole(req, res) {
        try {
            const roleId = req.body.role_id;
            const result = await rolePermissionService.softDeleteRole(roleId);
            if (result) {
                return res.json({ type: 'success', message: "Role deleted successfully." });
            }
        } catch (error) {
            return res.json({ type: 'failure', message: error.message });
        } 
    }

};