/**
 * models/User.js: Data model for AndChill user.
 */

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var mongoose = require('mongoose');
var secrets = require('../config/secrets');
var movieDb = require('moviedb')(secrets.moviedb); // TheMovieDB API

var DEFAULT_GENRE = 28; // TheMovieDB magic code for Action

var TITLE_TAG = 'title';
var TITLE_MULTIPLIER = 5;

var GENRE_TAG = 'genre';
var GENRE_MULTIPLIER = 1;

var userSchema = mongoose.Schema({
	// Schema invariant: email must be unique.

	email: { type: String, unique: true, lowercase: true },
	password: String,

	facebook: String,
	tokens: Array,

	profile: {
		name: { type: String, default: '' },
		gender: { type: String, default: '' },
		orientation: { type: String, default: '' },
		age:{type: Number, default: 0},
		location: { type: String, default: '' },
        favoriteMovies: [{type: String, default: ''}],
        tags: [{ name: String, tagType: String, count: Number }],
		picture: { type: String, default: '' },
		ratings: [{type: Number}],
		ratedUsers: [{type: String}],
		bio: String
	},
	pictures:[{ type: String, default: '' }],

	resetPasswordToken: String,
	resetPasswordExpires: Date
});


/**
 * Password hash middleware.
 */
userSchema.pre('save', function(next) {
	var user = this;
	if (!user.isModified('password')) return next();
	bcrypt.genSalt(10, function(err, salt) {
		if (err) return next(err);
		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if (err) return next(err);
			user.password = hash;
			next();
		});
	});
});

/**
* Updates the user's rating.
*
* @param userId - ID of the User
* @param rating - rating to add
* @param otherUserEmail - email of the user adding the rating
* @param raterId - id of the user adding the rating
*/
userSchema.statics.addRating = function(userID, rating, otherUserEmail, raterID){
	// Assertions
	if (!userID) throw new Error('You must specify a user ID.');
	if (!rating) throw new Error('You must specify a rating.');
	if (!otherUserEmail) throw new Error('You must specify the other user\'s email.');
	if (!raterID) throw new Error('You must specify a rater ID.');

	var userModel = this;
	userModel.findById(userID, function(err, user) {
		if (err) return next(err);

		user.profile.ratings.push(rating)

		user.save(function(err) {
			if (err) return next(err);
			console.log("User ratings updated")
		});
	});

	userModel.findById(raterID, function(err, user) {
		if (err) return next(err);

		//user.profile.ratings.push(rating)
		user.profile.ratedUsers.push(otherUserEmail)

		user.save(function(err) {
			if (err) return next(err);
			console.log("User ratings updated")
		});
	});
}

/**
 * Returns the average rating of the User.
 *
 * @param {ObjectId} userID - Id of the user for whom to retrieve the rating
 * @param {Function} callback - callback to invoke when done
 */
userSchema.statics.getAverageRating = function(userID, callback){
	if (!userID) throw new Error('You must specify a user ID.');

	var userModel = this;
	userModel.findById(userID, function(err, user) {
		if (err) return callback(err);

		if (user.profile.ratings.length == 0){
			averageRating = 0
		}else{
			var sum = user.profile.ratings.reduce(function(pv, cv) { return pv + cv; }, 0);
			averageRating = sum/user.profile.ratings.length
		}
		if (typeof callback === 'function') callback(null, averageRating.toFixed(1));
	});
};


/**
 * Helper method for validating user's password.
 *
 * @param {String} candidatePassword - possible password
 * @param {Function} cb - callback to invoke when done
 */
userSchema.methods.comparePassword = function(candidatePassword, cb) {
	// We don't need to assert that candidatePassword is defined, because if it is undefined, it won't compare correctly
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err) return cb(err);
		if (typeof cb === 'function') cb(null, isMatch);
	});
};

/**
 * Helper method for getting user's gravatar.
 *
 * @param {Number} size - size of the gravatar image (square), in pixels
 */
userSchema.methods.gravatar = function(size) {
	if (!size) size = 200;
	if (!this.email) return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
	var md5 = crypto.createHash('md5').update(this.email).digest('hex');
	return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
};

var movieTaglists = {}; // Taglist cache so we don't repeatedly look up movies if we don't have to
var movieMap = {}; // Maps short names to full names

/**
 * Uses an API or a local cache to get the list of tags for the movie with the specified name.
 *
 * @param {String} movieName - the name of the movie
 * @param {Function} cb - callback to invoke when done looking up the movie
 */
var taglistForMovie = function (movieName, cb) {
	if (typeof movieName !== 'string') throw new Error('Movie name must be a string.');

	if (movieTaglists[movieName.toLowerCase()]) {
		if (typeof cb === 'function') cb(null, movieTaglists[movieName.toLowerCase()], movieMap[movieName.toLowerCase()]);
	} else {
		movieDb.searchMovie({ query: movieName }, function (err, potentialMovies) {
			var tags = [];

			if (err) {
				return cb(err, [], movieName);
			} else if (potentialMovies.results.length === 0) {
				return cb('Movie not found', [], movieName)
			}

			var movie = potentialMovies.results[0];

			// Create a tag for the movie title
			tags.push({ name: movie.original_title, tagType: TITLE_TAG });

			// Create tags for the genres
			movie.genre_ids.forEach(function (genre) {
				tags.push({ name: genre.toString(), tagType: GENRE_TAG });
			});

			// Cache stuff
			movieTaglists[movieName.toLowerCase()] = tags;
			movieMap[movieName.toLowerCase()] = movie.original_title;
			if (typeof cb === 'function') cb(err, tags, movie.original_title); // Don't return, since this is an async method
		});
	}
};

/**
 * Modifies the User's tags to take into account the specified movie.
 *
 * @param {String} movieName - the name of the movie
 * @param {Function} cb - callback to invoke when done looking up the movie
 */
userSchema.methods.tagMovie = function (movieName, cb) {
	if (typeof movieName !== 'string') throw new Error('Movie name must be a string.');
	var that = this;

	// Grab all the tags for the movie
	taglistForMovie(movieName, function (err, tags, movie) {
		var found = false;
		tags.forEach(function (tag) {
			// Iterate over all the tags we currently have to see if we can find the tag
			that.profile.tags.forEach(function (profileTag, index) {
				// If so, increment the count
				if (profileTag.name === tag.name && profileTag.tagType === tag.tagType) {
					that.profile.tags[index].count += 1;
					found = true;
				}
			});

			// If not, then add a new tag
			if (!found) {
				tag.count = 1;
				that.profile.tags.push(tag);
			}
		});

		that.save(function (err2) {
			if (typeof cb === 'function') cb(err2, tags, movie);
		});
	});
};

/**
 * Modifies the User's tags not to take into account the specified movie.
 *
 * @param {String} movieName - the name of the movie
 * @param {Function} cb - callback to invoke when done looking up the movie
 */
userSchema.methods.untagMovie = function (movieName, cb) {
	if (typeof movieName !== 'string') throw new Error('Movie name must be a string.');

	var that = this;

	taglistForMovie(movieName, function (err, tags) {
		tags.forEach(function (tag) {
			that.profile.tags.forEach(function (profileTag, index) {
				if (profileTag.name === tag.name && profileTag.tagType === tag.tagType) {
					that.profile.tags[index].count -= 1;
				}
			});
		});

		that.save(function (err2) {
			if (typeof cb === 'function') cb(err2, tags);
		});
	});
};

/**
 * Returns an integer representing the similarity between the two given tag sets. Is not asynchronous.
 *
 * @param tagSet1 - Array containing the first list of tags
 * @param tagSet2 - Array containing the second list of tags
 */
var scoreTags = function (tagSet1, tagSet2) {
	if (typeof tagSet1 === 'undefined' || typeof tagSet2 === 'undefined') throw new Error('You must provide two tag sets to scoreTags.');

	var score = 0;

	// Loop over all the tag sets and figure out what the score is.
	tagSet1.forEach(function (tag1) {
		tagSet2.forEach(function (tag2) {
			// If we are comparing the same type of tag
			if (tag1.tagType === tag2.tagType && tag1.name === tag2.name) {
				var rawScore = tag1.count > 0 && tag2.count > 0 ? Math.pow(Math.pow(tag1.count, 2) + Math.pow(tag2.count, 2), 0.5) : 0; // Square root of sums of scores

				switch (tag1.tagType) {
					case GENRE_TAG: rawScore *= GENRE_MULTIPLIER; break;
					case TITLE_TAG: rawScore *= TITLE_MULTIPLIER; break;
				}

				score += rawScore;
			}
		});
	});
	return score;
};

/**
 * Returns an integer representing the similarity between the specified user and the current user. DOES NOT fire a callback.
 *
 * @param {User} user - user against which to score the current user.
 */
userSchema.methods.scoreUser = function (user) {
	return scoreTags(this.profile.tags, user.profile.tags);
};

/**
 * Static method that scores two users.
 *
 * @param {ObjectId} userId1 - ID of the first user
 * @param {ObjectId} userId2 - ID of the second user
 * @param {Function} cb - callback to invoke when done
 */
userSchema.statics.scoreUsers = function (userId1, userId2, cb) {
	var that = this;

	this.findOne({
		_id: userId1
	}, function (err1, u1) {
		that.findOne({
			_id: userId2
		}, function (err2, u2) {
			if (typeof cb === 'function') cb(err1 || err2, err1 || err2 ? null : u1.scoreUser(u2));
		});
	});
};

/**
 * Exported version of scoreTags, which returns the similarity between two tag sets.
 */
userSchema.statics.scoreTags = scoreTags;

/**
 * Returns up to five (or more if in common) movie suggestions between the current user and another specified user.
 *
 * @param {User} user - user for whom to find suggestions.
 * @param {Function(err, suggestionList)} cb - callback to invoke when done
 */
userSchema.methods.suggestions = function (user, cb) {
	if (!user) throw new Error('You must specify a user.');

	var suggestion = [];

	// First, add any movies that the users have in common
	this.profile.favoriteMovies.forEach(function (movie) {
		if (user.profile.favoriteMovies.indexOf(movie) !== -1)
			suggestion.push(movie);
	});

	if (suggestion.length >= 5) {
		if (typeof cb === 'function')return cb(null, suggestion);
		else return;
	} else {
		var mostCommonTag = DEFAULT_GENRE;
		var mostCommonTagAmount = -1;
		// We didn't get enough movies, so we need to look up by the weighted most common genre between the users
		this.profile.tags.forEach(function (tag1) {
			user.profile.tags.forEach(function (tag2) {
				// See if this tag is better, and if so
				if (tag1.tagType === tag2.tagType && tag1.name === tag2.name && tag1.tagType === GENRE_TAG) {
					var tagAmount = tag1.count > 0 && tag2.count > 0 ? Math.pow(Math.pow(tag1.count, 2) + Math.pow(tag2.count, 2), 0.5) : 0;
					if (tagAmount > mostCommonTagAmount) {
						mostCommonTagAmount = tagAmount;
						mostCommonTag = tag1.name;
					}
				}
			});
		});

		movieDb.genreMovies({ id: mostCommonTag }, function (err, movies) {
			if (err) {
				// If something goes wrong with the API, then we just return a default suggestion so our app still works.
				suggestion.push('The Notebook');
				if (typeof cb === 'function') return cb(err, suggestion);
			} else {
				movies.results.forEach(function (movie, index) {
					// Only add five movie suggestions
					if (index < 5)
						suggestion.push(movie.original_title);
				});
				if (typeof cb === 'function')return cb(err, suggestion);
			}
		});
	}
};

module.exports = mongoose.model('User', userSchema);
