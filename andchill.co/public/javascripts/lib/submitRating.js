
$(function () {
	'use strict';
	var submitRating = $('#submit-rating');

	$('#combostar').combostars();
	submitRating.click(function(){

		var rating = $('#combostar').val()
		var userID = $(this).data('id');
		var raterID = $(this).data('current');
		var otherUserEmail = $(this).data('email');

		/** Adds a new rating to the list of ratings */
		$.post('/chat/ratings/' + userID, {
			content: rating,
			raterID: raterID,
			email: otherUserEmail
		});

		$('div.notRated').html('<p> <i>Thanks for Rating</i></p>')

	});
});