/**
 * profile.js: Controller for the user profile page.
 */

$(function () {
	$('#favorite-movies-editor').taglist({
		newUrl: '/user/account/profile/movies',
		deleteUrl: '/user/account/profile/movies',
		loadUrl: '/user/account/profile/movies'
	});
});
