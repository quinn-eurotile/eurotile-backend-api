const router = require('express').Router();
const auth = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/checkPermission");
const user_validation = require('../validation-helper/user-validate');
const AdminController = require('../controllers').AdminController;
const adminController = new AdminController();
const multer = require("multer");

// Admin routes (now relative, no need for API_V or /api)
router.post('/register', multer().any(), adminController.registerAdmin);
router.post('/login', multer().any(), user_validation.login, adminController.loginUser);
router.post('/forgot-password', multer().any(), user_validation.forgotPassword, adminController.forgotPassword);
router.post('/reset-password', multer().any(), adminController.resetPassword);
router.post('/logout', auth, adminController.logoutUser);
router.get('/dashboard', multer().any(), auth, adminController.dashboardData);

/* Team Member Management */
router.get('/team-member-list', multer().any(), auth, adminController.teamMemberList);
router.post('/create-team-member', multer().any(), auth,  user_validation.saveTeamMember,  adminController.createTeamMember);
router.post('/update-team-member/:id', multer().any(), auth, user_validation.saveTeamMember, adminController.updateTeamMember);
router.delete('/delete-team-member/:id', multer().any(), auth, adminController.deleteTeamMember);


router.get('/team-member', multer().any(), auth, adminController.teamMemberList);
router.post('/team-member', multer().any(), auth,  user_validation.saveTeamMember,  adminController.createTeamMember);
router.put('/team-member/:id', multer().any(), auth, user_validation.saveTeamMember, adminController.updateTeamMember);
router.delete('/team-member/:id', multer().any(), auth, adminController.deleteTeamMember);


/* Supplier Management */
router.post('/create-supplier', multer().any(), auth,   adminController.createSupplier);


// router.post('/update-profile', multer().any(), auth, adminController.updateProfile);
// router.post('/update-password', multer().any(), auth, adminController.updatePassword);
// router.post('/update-user-profile/:id', multer().any(), auth, user_validation.updateUserProfile, adminController.updateUserProfile);
// router.get('/verify-email/:token', adminController.verifyEmail);
// router.post('/resend-email', adminController.resendEmail);

module.exports = router;
