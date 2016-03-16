/**
 * controllers/chat.js: Chat between AndChill users.
 */

var Chat = require('../models/Chat');

/**
 * POST method that adds a new method to a Chat.
 *
 * Request body should contain chatId as ID of chat to which to add a message and content as content of new message.
 */
exports.sendMessage = function (req, res) {
	Chat.findOne({
		_id: req.params.chatId
	})
	.populate('chop')
	.exec(function (err, chat) {
		// Make sure the user is allowed to send the message
		if (!chat.chop.users[0].user.equals(req.user._id) && !chat.chop.users[1].user.equals(req.user._id)) {
			res.status(403);
			res.send({ success: false, message: 'You are not authorized to send this message.', oldContent: req.body.content });
		} else {
			Chat.sendMessage(req.params.chatId, req.user._id, req.body.content, function (err, message) {
				if (err) {
					res.status(500);
					res.send({ success: false, message: 'Your message failed to send. Please try again.', oldContent: req.body.content });
				} else {
					res.send({ success: true, message: 'Your message sent succesfully.' });
				}
			});
		}
	});
};

/**
 * GET method that retrieves the messages in a Chat, optionally since a specific time. The returned JSON object specifies the time at which
 * messages were retrieved so that the since parameter may be correctly defined in future requests.
 *
 * Expects the since property to be defined in req.query. This should be a JavaScript timestamp. If since is undefined, all messages since time 0 are returned.
 */
exports.getMessages = function (req, res) {
	var since = req.query.since ? new Date(Number(req.query.since)) : new Date(0); // Start back in 1970 if no date is specified
	var chatId = req.params.chatId;

	// Grab all the messages
	Chat.findOne({ _id: chatId })
		.populate('messages.user')
		.exec(function (err, chat) {
		if (err) {
			res.status(500);
			res.send({ success: false, message: 'Failed to retrieve messages.' });
		} else {
			var messages = chat.messages;
			var timeUntil = new Date().getTime();

			// Filter out the messages we don't want, which are the ones that are too old
			var filteredMessages = messages.filter(function (message) {
				return message.date.getTime() >= since.getTime();
			});

			if (filteredMessages.length > 0) {
				filteredMessages.sort(function (a, b) {
					return b.date < a.date;
				});

				res.render('partials/messageList', {
					messages: filteredMessages
				}, function (renderErr, renderedContent) {
					res.send({ success: true, content: renderedContent, timeUntil: timeUntil, messages: filteredMessages });
				});
			} else {
				res.send({ success: true, content: '', timeUntil: timeUntil, messages: [] }); // Don't bother rendering if there are no messages
			}
		}
	});
};
