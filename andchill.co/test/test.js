/**
 * test/test.js: Tests for AndChill.
 */

var assert = require('assert');
var mongoose = require('mongoose');

var User = require('../models/User');
var Chop = require('../models/Chop');
var Chat = require('../models/Chat');

// Mongo clearing code based loosely on the Piazza post at: https://piazza.com/class/ie37hxzeepf51a?cid=419
// This connects us to our database and then cleans out the old test DB
before(function (done) {
	mongoose.connect('mongodb://localhost/test');
	mongoose.connection.db.dropDatabase();
	done();
});

// After we're done, close the connecton
after(function (done) {
	mongoose.connection.close();
	done();
});

/** User tests. */
describe('User', function () {
	afterEach(function (done) {
		User.find({}).remove().exec(function (err) {
			if (err) done(err);
			else done();
		});
	});
	describe('#create', function () {
		it('Should be able to make a new user', function (done) {
			var usr = new User({
				email: 'joe@joe.com',
				password: 'joe'
			}).save(function (err) {
				if (err) done(err);
				else {
					User.findOne({
						email: 'joe@joe.com'
					}, function (err2, joe) {
						if (err2) done(err2);
						else {
							assert.equal('joe@joe.com', joe.email);
							done();
						}
					});
				}
			});
		});

		it('Should not be able to make two users with same email', function (done) {
			var u1 = new User({
				email: 'joe@joe.com',
				password: 'joe'
			}).save(function (err) {
				if (err) done(err);
				else {
					var u2 = new User({
						email: 'joe@joe.com',
						password: 'somethingElse'
					});
					assert.throws(u2.save(function (err2) {
						done();
					}), Error, 'Throws exception on second save');
				}
			});
		});
	});

	describe('#comparePassword', function () {
		it('Should be able to compare user\'s password', function (done) {
			var u = new User({
				email: 'e@mail.com',
				password: 'lolnoob'
			}).save(function (err) {
				if (err) done(err);
				else {
					User.findOne({
						email: 'e@mail.com'
					}, function (err2, user) {
						if (err2) done(err2);
						else {
							// Compare the password against something correct and something incorrect
							user.comparePassword('lolnoob', function (err3, correctPassword) {
								if (err3) done(err3);
								else {
									assert.equal(true, correctPassword);
									user.comparePassword('loldkjhe3iu31i', function (err4, incorrectPassword) {
										if (err4) done(err4);
										else {
											assert.equal(false, incorrectPassword);
											done();
										}
									});
								}
							});
						}
					});
				}
			});
		});
	});

	describe('#gravatar', function () {
		it('Should return something URL-like', function (done) {
			new User({
				email: 'parsonsj@mit.edu',
				password: 'lolnoob'
			}).save(function (err) {
				if (err) done(err);
				else {
					User.findOne({
						email: 'parsonsj@mit.edu'
					}, function (err2, user) {
						var gravatarUrl = user.gravatar();
						assert.ok(gravatarUrl.toLowerCase().indexOf('http') !== -1);
						assert.ok(gravatarUrl.toLowerCase().indexOf('gravatar') !== -1);
						done();
					});
				}
			});
		});
	});

	describe('#tagMovie', function () {
		it('Should add correct tags for The Hateful Eight (requires network)', function (done) {
			this.timeout(5000); // Make sure there's enough time for the test

			new User({
				email: 'parsonsj@mit.edu',
				password: 'lolnoob'
			}).save(function (err) {
				if (err) done(err);
				else {
					User.findOne({
						email: 'parsonsj@mit.edu'
					}, function (err2, user) {
						user.tagMovie('The Hateful Eight', function (err3, tags) {
							// Just grab the user again
							User.findOne({
								email: 'parsonsj@mit.edu'
							}, function (err4, savedUser) {
								savedUser.profile.tags.forEach(function (tag) {
									// Make sure it's tagged as a Western
									if (tag.tagType === 'genre') {
										assert.equal(37, tag.name); // Corresponds with TMDB
										assert.equal(1, tag.count)
									}
								});
								done();
							});
						});
					});
				}
			});
		});

		it('Should handle tags for two movies with the same director (requires network)', function (done) {
			this.timeout(5000); // Make sure there's enough time for the test

			new User({
				email: 'parsonsj@mit.edu',
				password: 'lolnoob'
			}).save(function (err) {
				if (err) done(err);
				else {
					User.findOne({
						email: 'parsonsj@mit.edu'
					}, function (err2, user) {
						user.tagMovie('The Hateful Eight', function (err3, tags) {

							user.tagMovie('Django Unchained', function (err4, tags2) {
								// Just grab the user again
								User.findOne({
									email: 'parsonsj@mit.edu'
								}, function (err4, savedUser) {
									savedUser.profile.tags.forEach(function (tag) {
										// Make sure Tarantino gets included twice
										if (tag.tagType === 'genre' && tag.name === 37) {
											assert.equal(2, tag.count);
										}
									});
									done();
								});
							});
						});
					});
				}
			});
		});
	});

	describe('#untagMovie', function () {
		it('Should undo addMovie for the same movie (requires network)', function (done) {
			this.timeout(5000); // Make sure there's enough time for the test

			new User({
				email: 'parsonsj@mit.edu',
				password: 'lolnoob'
			}).save(function (err) {
				if (err) return done(err);
				else {
					User.findOne({
						email: 'parsonsj@mit.edu'
					}, function (err2, user) {
						user.tagMovie('Horrible Bosses', function (err3, tags) {
							// Immediately undo
							user.untagMovie('Horrible Bosses', function (err4, tags2) {
								// Just grab the user again
								User.findOne({
									email: 'parsonsj@mit.edu'
								}, function (err4, savedUser) {
									savedUser.profile.tags.forEach(function (tag) {
										assert.equal(0, tag.count); // As we've done and undone everything, nothing should have a count above 0
									});
									return done();
								});
							});
						});
					});
				}
			});
		});
	});

	describe('#scoreUser', function () {
		it('Should give a positive score to users with a common movie', function (done) {
			this.timeout(5000);

			new User({
				email: 'parsonsj2@mit.edu',
				password: 'lolnoob',
				'profile.tags' : [
					{ tagType: 'movie', name: 'The Hunger Games', count: 1 },
					{ tagType: 'genre', name: 200, count: 1 }
				]
			}).save().then(function(u1) {
				assert.ok(u1.scoreUser(u1) > 0);
				return done();
			});
		});
	});

	describe('#suggestions', function () {
		it('Should suggest movies in common to users (requires network)', function (done) {
			this.timeout(5000);

			new User({
				email: 'parsonsj2@mit.edu',
				password: 'lolnoob',
				'profile.tags' : [
					{ tagType: 'movie', name: 'The Hateful Eight', count: 1 },
					{ tagType: 'genre', name: 28, count: 1 }
				],
				'profile.favoriteMovies' : [
					'The Hateful Eight'
				]
			}).save().then(function(u1) {
				u1.suggestions(u1, function (err, suggestionList) {
					if (err) done(err);
					assert.ok(suggestionList.indexOf('The Hateful Eight') !== -1);
					done();
				})
			});
		});

		it('Should always suggest at least five movies', function (done) {
			this.timeout(5000);
			new User({
				email: 'parsonsj2@mit.edu',
				password: 'lolnoob',
				'profile.tags' : [
					{ tagType: 'movie', name: 'The Hateful Eight', count: 1 },
					{ tagType: 'genre', name: 28, count: 1 }
				],
				'profile.favoriteMovies' : [
					'The Hateful Eight'
				]
			}).save().then(function(u1) {
				u1.suggestions(u1, function (err, suggestionList) {
					if (err) done(err);
					assert.ok(suggestionList.length >= 5);
					done();
				})
			});
		})
	})
});

/** Chop tests. */
describe('Chop', function () {
	var user1, user2;
	beforeEach(function (done) {
		// Create two test users before each chat, as well as an accepted Chop between them
		User.create({
			email: 'u1@u1.com',
		}, function (u1e, u1) {
			user1 = u1;
			User.create({
				email: 'u2@u2.com'
			}, function (u2e, u2) {
				user2 = u2;
				done();
			});
		});
	});

	afterEach(function (done) {
		User.find({}).remove().exec(function (err) {
			if (err) done(err);
			Chop.find({}).remove().exec(function(err2) {
				if(err2) done(err2);
				else done();
			});
		});
	});

	describe('#nextForUser', function () {
		it('Should return only other user if only one exists', function (done) {
			Chop.nextChopUser(user1._id, user1.profile, function (err, nextUser) {
				if (err) {
					done(err);
				} else {
					assert.ok(user2._id.equals(nextUser));
					done();
				}
			});
		});

		it('Should respect user orientation preferences', function (done) {
			User.create({
				email: 'u3@u3.com',
				profile: {
					orientation: 'male',
					gender: 'male'
				}
			}, function (u3e, u3) {
				User.create({
					email: 'u4@u4.com',
					profile: {
						orientation: 'male',
						gender: 'male'
					}
				}, function (u4e, u4) {
					Chop.nextChopUser(u4._id, u4.profile, function (err, nextUser) {
						if (err) {
							done(err);
						} else {
							assert.ok(u3._id.equals(nextUser));
							done();
						}
					});
				});
			});
		});
	});

	describe('#create', function () {
		it('Should be able to create a pending Chop between two users', function (done) {
			Chop.create({
				users: [{ user: user1._id }, { user: user2._id }]
			}, function (err, chop) {
				if (err) done(err);
				else {
					assert.equal('pending', chop.status);
					assert.equal(2, chop.users.length);
					assert.equal(0, chop.acceptingUsers.length);
					done();
				}
			});
		});

		it('Should disallow Chops with != 2 Users', function (done) {
			assert.throws(Chop.create({
				users: [{ user: user1._id }]
			}, function (err1, chop1) {
				done();
			}), Error, 'Throws error with 1-user chop');
		});

		it('Should disallow Chops with an invalid status', function (done) {
			assert.throws(Chop.create({
				users: [{ user: user1._id }, { user: user2._id }],
				status: 'asddsadsa'
			}, function (err, chop) {
				done();
			}), Error, 'Throws error with invalid status');
		});
	});
});

/** Chat tests. */
describe('Chat', function () {
	var user1, user2, chop;

	beforeEach(function (done) {
		// Create two test users before each chat, as well as an accepted Chop between them
		var u1 = new User({
			email: 'u1@u1.com',
			password: 'u1'
		}).save(function (err1) {
			var u2 = new User({
				email: 'u2@u2.com',
				password: 'u2'
			}).save(function (err2) {
				user1 = u1;
				user2 = u2;

				// Now create a Chop
				Chop.create({
					users: [{ user: u1._id }, { user: u2._id }],
					acceptingUsers: [u1._id, u2._id],
					status: 'accepted'
				}, function (err3, newChop) {
					if (err3) done(err3);
					else {
						chop = newChop;
						done();
					}
				});
			});
		})
	});

	afterEach(function (done) {
		User.find({}).remove().exec(function (err) {
			if (err) done(err);
			Chop.find({}).remove().exec(function(err2) {
				if(err2) done(err2);
				Chat.find({}).remove().exec(function(err3) {
					if(err3) done(err3);
					done();
				});
			});
		});
	});

	describe('#create', function () {
		it('Should be able to create a new Chat for a Chop', function (done) {
			Chat.create({ chop: chop }, function (err, newChat) {
				if (err) done(err);
				else done();
			});
		});
	});

	describe('#sendMessage', function () {
		it('Should create a new message in a Chat', function (done) {
			Chat.create({ chop: chop }, function (err, newChat) {
				if (err) done(err);
				Chat.sendMessage(newChat._id, user1._id, 'hello world', function (err2, chat2) {
					if (err2) done(err2);

					// Grab the updated Chat and make sure there's a message
					Chat.findOne({ _id: newChat._id }, function (err3, updatedChat) {
						assert.equal('hello world', updatedChat.messages[0].content);
						done();
					});
				});
			});
		});
	});
});
