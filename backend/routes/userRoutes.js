const express = require('express');
const router = express.Router();
const authToken = require('../utils/authToken');
const userController = require('../controllers/userController');


// User Sign up, sign in, logout routes
router.route('/signup').post(userController.userRegistration);
router.route('/login').post(userController.userLogin);
router.route('/logout').get(userController.userLogout);

// User Password change routes
router.route('/password/update').put(authToken.isUserAuthenticated, userController.userPasswordUpdate);
router.route('/password/reset/:token').put(userController.resetUserPassword);
router.route('/password/forgot').post(userController.setForgotPassword);

// User Profile routes
router.route('/profile').get(authToken.isUserAuthenticated ,userController.getUserProfile);
router.route('/update/profile').put(authToken.isUserAuthenticated, userController.updateUserProfile)
router.route('/account/delete').delete(authToken.isUserAuthenticated, userController.userAccountDelete)


module.exports = router;