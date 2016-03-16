/**
 * controllers/index.js: Control methods for routes at the root level
 */

var Chop = require('../models/Chop');

/** Renders the homepage of AndChill. */
exports.home = function (req, res) {
	res.render('pages/home', {});
};
