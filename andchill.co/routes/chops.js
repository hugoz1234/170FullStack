/**
 * routes/chops.js: Routes for chops. Prefixed by /chops/
 */

var express = require('express');
var router = express.Router();
var passportConf = require('../config/passport');

var chopsController = require('../controllers/chops');

/** GET chops page. */
router.get('/', passportConf.isAuthenticated, chopsController.chops);

/** GET accepted chops page. */
router.get('/accepted/', passportConf.isAuthenticated, chopsController.acceptedChops);

/** GET accepted chops page with a chat for a certain chop. */
router.get('/accepted/:chopId', passportConf.isAuthenticated, chopsController.acceptedChops);

/** Accept a chop */
router.post('/acceptChop/:chopId', passportConf.isAuthenticated, chopsController.acceptChop);

/** Reject a chop */
router.post('/rejectChop/:chopId', passportConf.isAuthenticated, chopsController.rejectChop);

module.exports = router;
