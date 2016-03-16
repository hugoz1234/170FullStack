$(function ($) {
	'use strict';


	var userID = $('span.stars').data('id');
		$.get('/chat/ratings/' + userID).done(function(data){
			$('#detail').text(data.content);
			$('span.stars').stars(data.content);
		});

});