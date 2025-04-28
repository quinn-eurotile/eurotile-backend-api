const router = require('express').Router();
const auth = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const user_validation = require('../validation-helper/user-validate');
const AdminController = require('../controllers').AdminController;
const adminController = new AdminController();
const multer = require("multer");

// Admin routes (now relative, no need for API_V or /api)
router.post('/register', multer().any(), user_validation.register, adminController.registerAdmin);

 router.post('/login', multer().any(), /*user_validation.login, */ adminController.loginUser);
// router.post('/update-user/:id', multer().any(), auth, user_validation.update, adminController.updateUser);
// router.post('/delete-user', multer().any(), adminController.deleteUser);
router.post('/forgot-password', multer().any(), user_validation.forgotPassword, adminController.forgotPassword);
router.post('/reset-password', multer().any(), adminController.resetPassword);
router.post('/logout', auth, adminController.logoutUser);
// router.get('/dashboard', multer().any(), auth, adminController.dashboardData);
router.get('/team-member-list', multer().any(), auth, /* checkPermission('view-user'), */ adminController.teamMemberList);
router.post('/create-team-member', multer().any(), auth, /* checkPermission('create-user'), */ /* user_validation.createTeamMember, */ adminController.createTeamMember);
// router.post('/update-profile', multer().any(), auth, adminController.updateProfile);
// router.post('/update-password', multer().any(), auth, adminController.updatePassword);
// router.post('/update-user-profile/:id', multer().any(), auth, user_validation.updateUserProfile, adminController.updateUserProfile);
// router.get('/verify-email/:token', adminController.verifyEmail);
// router.post('/resend-email', adminController.resendEmail);

module.exports = router;
