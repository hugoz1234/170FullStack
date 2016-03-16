/**
 * javascripts/chat.js: Back-end for the AndChill chat client.
 */

 $(function () {
 	'use strict';

	// All the controls on the page
	var sendButton = $('#chat-send'),
	messageInput = $('#chat-text'),
	chatContainer = $('#chat-area');

	var lastUpdate = new Date(0).getTime(); // Last time at which the list of chats was updated
	var UPDATE_INTERVAL = 2500; // Time between updates in ms
	var timeout; // doUpdate timeout
	var receivedMessages = [];

	/** Resets the scrollTop of the chat container to be all the way at the bottom if it is already at the bottom. */
	var resetScroll = function () {
		chatContainer[0].scrollTop = chatContainer[0].scrollHeight - chatContainer[0].clientHeight;
	};

	/**
	 * Updates the chat container with the latest messages.
	 *
	 * @param {Boolean} forceScroll - force scrolling even if not at the bottom. False if undefined
	 */
	 var doUpdate = function (forceScroll) {
	 	var since = lastUpdate;
	 	var chatId = sendButton.attr('data-chat-id');

	 	$.get('/chat/' + chatId, {
	 		since: since
	 	}, function (data) {
	 		if (data.success) {
				// Determines whether we need to scroll when we're done
				var atBottom = chatContainer[0].scrollTop === chatContainer[0].scrollHeight - chatContainer[0].clientHeight;
				var jqContent = $(data.content);
				console.log(data)

				data.messages.forEach(function (message) {
					// Make sure we don't add any duplicates due to timing issues
					if (receivedMessages.indexOf(message._id) === -1) {
						receivedMessages.push(message._id);
					} else {
						jqContent = jqContent.not('[data-message-id="' + message._id + '"]');
					}
				});
				chatContainer.append(jqContent);
				lastUpdate = data.timeUntil; // Update with when the server says the messages are up to

				if (atBottom || forceScroll)
					resetScroll();
			}
			setTimeout(doUpdate, UPDATE_INTERVAL); // Repeat the update after the specified interval
		});

		// We don't have a failure handler because we don't want to spam the user if requests repeatedly fail.
	 };


	 /** Handles send button clicks. Sends the message in the chatContainer to the server when clicked. */
	 sendButton.click(function () {
	 	var chatId = sendButton.attr('data-chat-id');
	 	$.post('/chat/' + chatId, {
	 		content: messageInput.val()
	 	}, function (data) {
				// Cancel the previously planned update and conduct it now
				clearTimeout(timeout);
				doUpdate();
			}).fail(function (err) {
				alert('There was an error while sending the message.')
			});
		messageInput.val(''); // Clear the input text box
	});

	 doUpdate(true);
	});
