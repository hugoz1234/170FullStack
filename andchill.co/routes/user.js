var express = require('express');
var router = express.Router();
var userController = require('../controllers/user');
var passportConf = require('../config/passport');
var fileParser = require('connect-multiparty')();

/** GET login page. */
router.get('/login/', userController.login);

/** POST login page. */
router.post('/login/', userController.loginAccount);

/** GET registration page. */
router.get('/register/', userController.register);

/** POST registration page. */
router.post('/register/', userController.createAccount);

/** GET log out. */
router.get('/logout', userController.logout);

/** GET user profile view. */
router.get('/viewProfile/:id', userController.viewProfile);

/** POST image upload */
router.post('/uploadImage',fileParser, userController.uploadImage);

/** POST profile picture upload */
router.post('/uploadCover',fileParser, userController.uploadCover);

/** GET user profile. */
router.get('/account', passportConf.isAuthenticated, userController.getAccount);

/** POST update user profile. */
router.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);

/** POST update user password. */
router.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);

/** POST delete user account */
router.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);

/** POST sends the ratings of the other user */
router.post('/ratings/:userID', passportConf.isAuthenticated, userController.addRating);

/** GET the average rating of a user */
router.get('/ratings/:userID', passportConf.isAuthenticated, userController.getAverageRating);

/** GET list user's favorite movies. */
router.get('/account/profile/movies', passportConf.isAuthenticated, userController.listMovies);

/** POST add new favorite movie. */
router.post('/account/profile/movies', passportConf.isAuthenticated, userController.addMovie);

/** DELETE remove favorite movie. */
router.delete('/account/profile/movies', passportConf.isAuthenticated, userController.deleteMovie);


module.exports = router;
