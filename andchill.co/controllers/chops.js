/**
 * controllers/chops.js: Controller methods for chops.
 */

var Chop = require('../models/Chop');
var Chat = require('../models/Chat');
var User = require('../models/User');

var GRAVATAR_SIZE = 60; // pixels

/**
 * Renders the actual chops page, displaying a Chop if there is one to show. Otherwise, shows the empty chop page.
 *
 * @param {Chop} chop - Chop to display
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
var renderChopPage = function (chop, req, res) {
	if (!req) {
		throw new Error('Must specify a request.')
	} else if (!res) {
		throw new Error('Must specify a response.')
	}

	if (chop) {
		// Figure out the other user
		chop.otherUser = chop.users[0].user === req.user._id ? chop.users[1].user : chop.users[0].user;

		// Grab the suggestions and then render them on the page
		req.user.suggestions(chop.otherUser, function (suggestionErr, suggestions) {
			res.render('pages/chops', {
				hasChop: true,
				chop: chop,
				suggestions: suggestions
			});
		})

	} else {
		res.render('pages/chops', { hasChop: false });
	}
};

/**
 * Handles get requests to the chops page, which allows users to accept new chops.
 *
 * Requires login.
 */
exports.chops = function (req, res) {
	// We begin by seeing if there are already any chops involving this user
	Chop.find({
		status: 'pending',
		'users.user': {
			$in: [req.user._id]
		},
		acceptingUsers: {
			$nin: [req.user._id]
		}
	}).populate('users.user')
	.exec(function (existingErr, existingChops) {
		if (existingChops.length > 0) {
			renderChopPage(existingChops[0], req, res);
		} else {
			// There are no existing Chops, so we get the ID of the User who should be the next one
			Chop.nextChopUser(req.user._id, req.user.profile, function (err, userId) {
				if (err) {
					res.sendStatus(500);
				} else if (!userId) {
					// If there is no user, just display nothing
					renderChopPage(null, req, res);
				} else {
					// Create a new Chop and show it to the user
					Chop.create({
						users: [
							{ user: req.user._id },
							{ user: userId }
						]
					}, function (createErr, createdChop) {
						Chop.populate(createdChop, { path: 'users.user' }, function (populateErr, populatedChop) {
							renderChopPage(populatedChop, req, res);
						});
					});
				}
			});
		}
	});
};

/**
 * Accepts a chop request and then redirects the client to the Chops page. If the Chop does not exist, has no effect.
 *
 * Expects chopId to be defined in req.params and requires login.
 */
exports.acceptChop = function (req, res) {
	console.log("accept chop in controller" + req.params.chopId ,req.user._id);

	// Grab the Chop object and then update it
	Chop.acceptChop(req.params.chopId, req.user._id, function (err, chop) {
		if (chop) {
			res.redirect('/chops');
		} else if (!err) {
			res.sendStatus(404); // No chop found but also no error
		} else {
			res.sendStatus(500); // No chop and an error
		}
	});
};

/**
 * Rejects a chop request and then redirects the client to the Chops page. If the Chop does not exist, has no effect.
 *
 * Requires login and expects chopId to be defined in req.params
 */
exports.rejectChop = function (req, res) {
	console.log("reject chop in controller" + req.params.chopId,req.user._id);
	Chop.rejectChop(req.params.chopId, req.user._id, function (err, chop) {
		if (chop) {
			res.redirect('/chops')
		} else if (!err) {
			res.sendStatus(404);
		} else {
			res.sendStatus(500);
		}
	})
};

/**
 * Renders the accepted chops page, which allows users to select which of their accepted chops they want to talk to.
 *
 * Requires login. Expects chopId to be defined in req.params
 */
exports.acceptedChops = function (req, res) {
	// Grab all the accepted chops of which the current user is a part
	Chop.find({
		status: 'accepted',
		acceptingUsers: {
			$in: [req.user._id]
		}
	}).populate('acceptingUsers') // Add accepting user details
	.exec(function (err, chops) {
		// Now we need to process this data to figure out the details of the user we've matched with. This is all view related, so we keep it here.
		var processedChops = [];
		chops.forEach(function (chop) {
			var user;
			if (chop.acceptingUsers[0].email === req.user.email) {
				user = chop.acceptingUsers[1];
			} else {
				user = chop.acceptingUsers[0];
			}
			processedChops.push({
				_id: chop._id,
				user: user
			});
		});

		// If a chop ID has been specified, we need to render the chat box as well
		if (req.params.chopId) {
			Chop.findOne({ _id: req.params.chopId })
			.populate('users.user')
			.exec(function (chopErr, chop) {
				var otherUser = chop.users[0].user._id.equals(req.user._id) ? chop.users[1].user : chop.users[0].user;

				// Abstract all the user's information (importantly, the gravatar) into an object
				var otherUserInfo = {
					_id: otherUser._id,
					email: otherUser.email,
					gravatar: otherUser.gravatar(GRAVATAR_SIZE), // Be sure to include a picture
					profile: otherUser.profile ? otherUser.profile : {}, // Make sure there's something in the profile
					id: otherUser._id
				};

				req.user.suggestions(otherUser, function (suggestionErr, suggestions) {
					// Load the information for the Chat, creating it as necessart
					Chat.findOne({ chop: req.params.chopId })
						.populate('messages.user', 'chat')
						.exec(function (err, existingChat) {
							// Check to see if the Chat must be created
							if (!existingChat) {
								Chat.create({ chop: req.params.chopId }, function (createErr, newChat) {
									// There are no messages so don't worry about populating anything
									res.render('pages/acceptedChops', {
										chops: processedChops,
										chat: newChat,
										otherUser: otherUserInfo,
										currentUser: req.user,
										chatMode: true,
										suggestions: suggestions
									});
								});
							} else {
								// Chat already exists, so we can go ahead and render it
								res.render('pages/acceptedChops', {
									chops: processedChops,
									chat: existingChat,
									otherUser: otherUserInfo,
									currentUser: req.user,
									chatMode: true,
									suggestions: suggestions
								});
							}
						});
				});
			});
		} else {
			res.render('pages/acceptedChops', {
				chops: processedChops,
				chatMode: false
			});
		}
	});
};
