const router = require('express').Router();
const auth = require("../middleware/authMiddleware");
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
router.get('/team-member', multer().any(), auth, adminController.teamMemberList);
router.get('/team-member', multer().any(), auth, adminController.teamMemberList);
router.post('/team-member', multer().any(), auth,  user_validation.saveTeamMember,  adminController.createTeamMember);
router.put('/team-member/:id', multer().any(), auth, user_validation.saveTeamMember, adminController.updateTeamMember);
router.delete('/team-member/:id', multer().any(), auth, adminController.deleteTeamMember);
router.patch('/team-member/:id/status', multer().any(), auth, adminController.updateTeamMemberStatus);

/* Supplier Management */
router.post('/supplier', multer().any(), auth, user_validation.saveSupplier, adminController.createSupplier);
router.put('/supplier/:id', multer().any(), auth, user_validation.saveSupplier, adminController.updateSupplier);
router.get('/supplier', multer().any(), auth, adminController.supplierList);
router.get('/supplier/:id', multer().any(), auth, adminController.getSupplierById);
router.delete('/supplier/:id', multer().any(), auth, adminController.deleteSupplier);

// router.post('/update-profile', multer().any(), auth, adminController.updateProfile);
// router.post('/update-password', multer().any(), auth, adminController.updatePassword);
// router.post('/update-user-profile/:id', multer().any(), auth, user_validation.updateUserProfile, adminController.updateUserProfile);
// router.get('/verify-email/:token', adminController.verifyEmail);
// router.post('/resend-email', adminController.resendEmail);

module.exports = router;
