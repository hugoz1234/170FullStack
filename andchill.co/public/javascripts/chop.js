/**
 * javascripts/chop.js: Back-end for the AndChill chop client.
 */

$(function () {
	// All the controls on the page
	var acceptButton = $('#accept-chop'),
		rejectButton = $('#reject-chop');

	/** Handler for when the accept button is clicked. */
	acceptButton.click(function(){
		console.log("accepted");
		var chopID = $(this).data('id');
		$.post(
			'/chops/acceptChop/' + chopID
		).done(function(response) {
			window.location.href= '/chops';
		}).fail(function () {
			alert('There was an error while accepting the Chop. Please try again.')
		});
	});

	rejectButton.click(function(){
		console.log("rejected");
		var chopID = $(this).data('id');
		$.post(
			'/chops/rejectChop/' + chopID
		).done(function(response) {
			window.location.href= '/chops';
		}).fail(function (err) {
			alert('There was an error while rejecting the Chop. Please try again.');
		});
	});
});
