const router = require('express').Router();
const auth = require("../middleware/authMiddleware");
const RolePermissionController = require('../controllers').RolePermissionController;
const rolePermissionController = new RolePermissionController();
const user_validation = require('../validation-helper/user-validate');

// Role permission routes (no need to prefix with API_V or /api)
router.get('/role-list', /* auth, */ rolePermissionController.roleList);
router.get('/get-raw-data', /* auth, */ rolePermissionController.getRawData);
router.post('/save-role', /* auth, */ user_validation.userRoleValidate, rolePermissionController.saveRole);
router.post('/delete-role', /* auth, */ rolePermissionController.deleteRole);
router.post('/update-role-permission/:id', /* auth, */ rolePermissionController.updateRolePermission);

module.exports = router;
