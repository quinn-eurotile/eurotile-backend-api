const router = require('express').Router();
const { API_V } = process.env;
const auth = require("../middleware/authMiddleware");
const user_validation = require('../validation-helper/user-validate');
const UserController = require('../controllers').UserController;
const userController = new UserController(); 
const multer = require("multer");

// router.post('/api/' + API_V + '/user/register', multer().any(), user_validation.register, userController.createUser);
// router.post('/api/' + API_V + '/user/login', multer().any(), user_validation.login, userController.loginUser);
// router.post('/api/' + API_V + '/user/update/:id', multer().any(), auth, user_validation.update, userController.updateUser);
// router.get('/api/' + API_V + '/user/list', multer().any(), auth, userController.userList);
// router.get('/api/' + API_V + '/user/detail/:id', auth, userController.getUserById);
// router.post('/api/' + API_V + '/user/verify_token', userController.getUserByToken);
// router.post('/api/' + API_V + '/user/forgot-password', multer().any(), user_validation.forgotPassword, userController.forgotPassword);
// router.post('/api/' + API_V + '/user/reset-password', multer().any(), userController.resetPassword);
// router.post('/api/' + API_V + '/user/logout', auth, userController.logoutUser);
// router.get('/api/' + API_V + '/user/dashboard', auth, userController.dashboardData);

module.exports = router;