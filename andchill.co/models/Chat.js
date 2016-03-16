/**
 * models/Chat.js: Chat associated with an AndChill Chop.
 */

var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');

var chatSchema = mongoose.Schema({
	// Schema invariants: The Chop associated with the Chat should not change.

	/** Chop with which the Chat is associated. */
	chop: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Chop'
	},

	/** Messages sent in the Chat. */
	messages: [
		{
			/** User who sent the message. */
			user: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},

			/** Date/Time at which the message was sent. */
			date: {
				type: Date,
				default: Date.now
			},

			/** Content of the message. */
			content: {
				type: String,
				required: true
			}
		}
	]
});

/**
 * Add a new message to a Chat at the current server time.
 *
 * @param {ObjectId} chatId - ID of the chat to which to add the message
 * @param {ObjectId} senderId - ID of the sending user
 * @param {String} content - content of the message
 * @param {Function} cb - callback to invoke when done
 */
chatSchema.statics.sendMessage = function (chatId, senderId, content, cb) {
	return this.findOneAndUpdate({
		_id: chatId,
	}, {
		$push: {
			messages: {
				user: senderId,
				content: content
			}
		}
	}, cb);
};

// Add the Find or Create method specified by our plugin
chatSchema.plugin(findOrCreate);

module.exports = mongoose.model('Chat', chatSchema);
