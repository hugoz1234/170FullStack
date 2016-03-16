/**
 * routes/chat.js: Chat related routes for AndChill.
 */

var express = require('express');
var router = express.Router();
var passportConf = require('../config/passport');

var chatController = require('../controllers/chat');
var userController = require('../controllers/user');

/** POST send a new message in the Chat. */
router.post('/:chatId', passportConf.isAuthenticated, chatController.sendMessage);

/** GET retrieve all the messages in the Chat. */
router.get('/:chatId', passportConf.isAuthenticated, chatController.getMessages);

/** POST sends the ratings of the other user */
router.post('/ratings/:userID', passportConf.isAuthenticated, userController.addRating);

/** GET the average rating of a user */
router.get('/ratings/:userID', passportConf.isAuthenticated, userController.getAverageRating);

module.exports = router;


