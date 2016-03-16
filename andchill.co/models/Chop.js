/**
 * models/Chop.js: Data model for Chill Opportunity in AndChill.
 */

var mongoose = require('mongoose');
var User = require('./User');

var chopSchema = mongoose.Schema({

	// Schema invariants: - No more than two users should be in the users or acceptingUsers relation.
	// 					  - A chop should be accepted if there are two acceptingUsers
	//					  - Status should be one of pending, accepted, or rejected

	/** Users presented with the Chop. Should be no more than two. */
	users: [{
		/** User involved in the Chop. */
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
	}],

	/** Users who have accepted the Chop. */
	acceptingUsers: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}],

	/** Status of the Chop: accepted, pending, or rejected. */
	status: {
		type: String,
		default: 'pending'
	},

    // Movie Suggestions
    suggestion: {
        movieTitle: String
    }
});

/**
 * Accept the Chop with the specified ID.
 *
 * @param chopId - ID of the chop to accept
 * @param acceptingUser - ID of User accepting the Chop
 * @param cb - callback
 */
chopSchema.statics.acceptChop = function(chopID, acceptingUser, cb){
	return this.findById(chopID,
		function(err, chop){
			if (chop){
				// Only accept the chop if both users accept
				if (chop.acceptingUsers.length === 1)
					chop.status = "accepted";

				chop.acceptingUsers.push(acceptingUser);

				if (typeof cb === 'function')
					chop.save(cb);
				else
					chop.save();

			} else {
				if (typeof cb === 'function') cb(err, chop);
			}
		}
	);
};

/**
 * Reject the Chop with the specified ID.
 *
 * @param chopId - ID of the chop to accept
 * @param rejectingUser - User rejecting the Chop
 * @param cb - callback
 */
chopSchema.statics.rejectChop = function(chopID, rejectingUser, cb){
	return this.findById(chopID,
		function(err, chop){
			if (chop){
				console.log("Reject" + chop);
				chop.status = "rejected";
				if (typeof cb === 'function')
					chop.save(cb);
				else
					chop.save();
			} else {
				if (typeof cb === 'function') cb(err, chop);
			}
		});
};

/**
 * Find and return the ID of the next User with whom the user with the specified ID should match, or null if none
 *
 * @param userId - ID of the user to look up
 * @param profile - profile of the user to look up
 * @param cb - callback
 */
chopSchema.statics.nextChopUser = function (userId, profile, cb) {
	if (!cb) return;
	if (!userId || !profile) cb(new Error('You must specify a user ID and a profile.'), null);

	// No pre-existing chops for this User, so we're going to need to create a new one.
	// Start by getting a list of all existing Chops for this user
	this.find({
		'users.user': {
			$in: [userId],
		}
	}, function (allErr, allChops) {
		// Get the IDs of the users that the current user is matched with
		var currentMatches = allChops.map(function (chop) {
			return chop.users[0].user.equals(userId) ? chop.users[1].user : chop.users[0].user;
		});

		// We have all the Chops of which the current user is a part
		// Let's find all the users that match up with the current user's sexual preferences

		var lookingFor = [profile.orientation];
		var matchedOrientations = [profile.gender];

		User.find({
			_id: {
				$ne: userId,
				$nin: currentMatches
			},
			'profile.gender' : {
				$in: lookingFor
			},
			'profile.orientation': {
				$in: matchedOrientations
			}
		}, function (userErr, users) {
			if (users.length > 0) {
				users.sort(function (userA, userB) {
					return User.scoreTags(profile.tags, userA.profile.tags) > User.scoreTags(profile.tags, userB.profile.tags) ? -1 : 1;
				});
				return cb(userErr, users[0]._id);

			} else {
				return cb(userErr, null);
			}
		});
	});
};


var chopModel = mongoose.model('Chop', chopSchema);

/** Restricts the value of 'status' to 'accepted', 'pending', or 'rejected' */
chopModel.schema.path('status').validate(function(value) {
	return /accepted|pending|rejected/i.test(value);
});

/** Ensures that exactly two users are loaded into every Chop. */
chopModel.schema.path('users').validate(function (value) {
	return value.length === 2;
});

module.exports = chopModel;
