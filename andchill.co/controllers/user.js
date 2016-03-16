/**
 * controllers/user.js: Control methods for user routes.
 */

var passport = require('passport');
var cloudinaryControllerObject = require('../controllers/CloudinaryController').CloudinaryController;

var User = require('../models/User');

/**
 * Renders the login page shown to users.
 */
exports.login = function(req, res) {
	if (req.user) return res.redirect('/');
	res.render('pages/login', {
		title: 'Login'
	});
};


/**
 * POST /login
 * Sign in using email and password, redirecting the user according to the returnTo property in req.session.
 */
exports.loginAccount = function(req, res, next) {
	req.assert('email', 'Email is not valid').isEmail();
	req.assert('password', 'Password cannot be blank').notEmpty();

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		return res.redirect('/user/login');
	}

	passport.authenticate('local', function(err, user, info) {
		if (err) return next(err);
		if (!user) {
			req.flash('errors', { msg: info.message });
			return res.redirect('/user/login');
		}
		req.logIn(user, function(err) {
			if (err) return next(err);
			req.flash('success', { msg: 'Success! You are logged in.' });
			res.redirect(req.session.returnTo || '/');
		});
	})(req, res, next);
};


/**
 * GET /signup
 * Renders the page allowing users to sign up.
 */
exports.register = function(req, res) {
	if (req.user) return res.redirect('/');
		res.render('pages/register', {
	});
};

/**
 * GET /logout
 * Log out the current user.
 */
exports.logout = function(req, res) {
	req.logOut();
	res.redirect('/');
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.createAccount = function(req, res, next) {
	req.assert('email', 'Email is not valid').isEmail();
	req.assert('password', 'Password must be at least 4 characters long').len(4);
	req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
	req.assert('name', 'Name cannot be blank').len(1);

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		return res.redirect('/user/register');
	}

	var user = new User({
		email: req.body.email,
		password: req.body.password
	});
	user.profile.name = req.body.name;

	User.findOne({ email: req.body.email }, function(err, existingUser) {
		if (existingUser) {
			req.flash('errors', { msg: 'Account with that email address already exists.' });
			return res.redirect('/user/register');
		}
		user.save(function(err) {
			if (err) return next(err);
			req.logIn(user, function(err) {
				if (err) return next(err);
				res.redirect('/');
			});
		});
	});
};


/**
 * GET /account
 * Renders the profile page, which allows the user to manage his account.
 */
exports.getAccount = function(req, res) {
	res.render('pages/profile', {
		title: 'Account Management'
	});
};

/**
 * POST /account/profile
 * Update profile information, excluding movies. If information is not specified, default empty strings are used.
 */
exports.postUpdateProfile = function(req, res, next) {
	User.findById(req.user.id, function(err, user) {
		if (err) return next(err);
		user.email = req.body.email || '';
		user.profile.age = req.body.age || 0;
		user.profile.name = req.body.name || '';
		user.profile.gender = req.body.gender || '';
		user.profile.orientation = req.body.orientation || '';
		user.profile.location = req.body.location || '';
		user.profile.bio = req.body.bio || '';

		// Note: favorite movies handled elsewhere

		user.save(function(err) {
			if (err) return next(err);
			req.flash('success', { msg: 'Profile information updated.' });
			res.redirect('/user/account');
		});
	});
};


/**
 * Adds a rating to the user specified in the request.
 *
 * Expects req.params.userId to be specified, as well as an email address in req.body.email and the ID of the rater in req.body.raterID.
 */
exports.addRating = function(req, res) {
	console.log("ID: " + req.params.userID)
	console.log("Rating: " + req.body.content)
	User.addRating(req.params.userID, req.body.content, req.body.email, req.body.raterID)
};

/**
 * Returns a JSON object containing the specified user's average rating.
 *
 * Expects req.params.userID to be specified as the ID of the user for whom to retrieve the average rating.
 */
exports.getAverageRating = function(req, res){
	User.getAverageRating(req.params.userID, function(err, rating){
		if (err){
			res.sendStatus(500);
		} else {
			res.send({ success: true, content: rating });
		}
	});
};

/**
 * POST /account/profile/movies
 * Adds a movie to the current user's profile. Requires login.
 */
exports.addMovie = function (req, res) {
	var movieName = req.body.text; // The plugin sends the movie name as text

	User.findById(req.user.id, function (err, user) {
		if (err) {
			res.send({ success: false, message: 'User does not exist.' });
		} else {
			if (user.profile.favoriteMovies.indexOf(movieName) === -1) {
				// Add the tag to the user and then save the additional movie to the User
				user.tagMovie(movieName, function (err1, cb, movie) {
					user.profile.favoriteMovies.push(movie);
					user.save(function (err2) {
						if (err1 || err2) {
							res.status(500);
							res.send({ success: false, message: 'Save error.' });
						} else {
							res.send({ success: true, message: { id: movieName, text: movie } });
						}
					});
				});
			} else {
				res.send({ success: false, message: 'Cannot add a duplicate movie.' });
			}
		}
	});
};

/**
 * GET /account/profile/movies
 * Retrieves a list of movies that the user already likes. Requires login.
 */
exports.listMovies = function (req, res) {
	User.findById(req.user.id, function (err, user) {
		if (err) {
			res.status(500);
			res.send({ success: false, message: 'Failed to retrieve user.' });
		} else {
			res.send(user.profile.favoriteMovies.map(function (movie) {
				return { text: movie, id: movie }; // Make sure movie names are unique
			}));
		}
	});
};

/**
 * DELETE /account/profile/movies
 * Deletes the movie with the text in the ID post parameter.
 */
exports.deleteMovie = function (req, res) {
	// The ID in the post params is the text to be removed
	var movieName = req.body.id;

	User.findById(req.user.id, function(err, user) {
		if (err) {
			res.status(500);
			res.send({ success: false, message: 'Failed to retrieve user.' });
		} else {
			var movieIndex = user.profile.favoriteMovies.indexOf(movieName);
			if (movieIndex !== -1) {
				user.profile.favoriteMovies.splice(movieIndex, 1); // Remove from the list if needed
			}
			user.untagMovie(movieName, function (err1, tags) {
				user.save(function (err2) {
					if (err1 || err2) {
						res.send({ success: false, message: 'Delete error.' });
					} else {
						res.send({ success: true, message: 'Delete success.' });
					}
				});
			});
		}
	});
};

/**
 * POST /account/password
 * Update current password. Requires login.
 */
exports.postUpdatePassword = function(req, res, next) {
	req.assert('password', 'Password must be at least 4 characters long').len(4);
	req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		return res.redirect('/user/account');
	}

	// Find the user and update the password once we've validated everything
	User.findById(req.user.id, function(err, user) {
		if (err) return next(err);

		user.password = req.body.password;

		user.save(function(err) {
			if (err) return next(err);
			req.flash('success', { msg: 'Password has been changed.' });
			res.redirect('/user/account');
		});
	});
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = function(req, res, next) {
	User.remove({ _id: req.user.id }, function(err) {
		if (err) return next(err);
		req.logout();
		req.flash('info', { msg: 'Your account has been deleted.' });
		res.redirect('/');
	});
};

/**
 * Allows a user's profile to be viewed.
 *
 * Expects the ID of the profile to be viewed to be defined in req.params
 */
exports.viewProfile = function (req, res) {
	User.findById(req.params.id, function (err, user) {
		if (err) {
			req.status(500);
			res.send({ success: false, message: 'Failed to retrieve user.' });
		} else {
			res.render('pages/viewProfile', {
				title: 'Profile',
				viewUser: user
			});
		}
	});
};

// Redirect the call to the controller to upload image.
exports.uploadImage = function(req, res) {
	console.log("###HERE: " + req.files.image );
	var imagepath = req.files.image;
	cloudinaryControllerObject.uploadImageToCloudinary(imagepath, function(result){
		console.log("Router Upload: " + result.url);
		User.findByIdAndUpdate(req.user.id , { $push: { "pictures" : result.url} }, {safe: true, upsert: true, new : true},
			function(err, model) {
				console.log(model);
			});
		res.redirect('back');
	});
};

// Redirect the call to the controller to upload image.
exports.uploadCover = function(req, res) {
	var imagepath = req.files.image;
	console.log("###UPLOAD COVER: " + req.files.image );
	cloudinaryControllerObject.uploadImageToCloudinary(imagepath, function(result){
		User.findByIdAndUpdate(req.user.id , {"profile": {"picture" : result.url}}, {safe: true, upsert: true},
			function(err, model) {
				console.log(model);
			});
		res.redirect('back');
	});
};