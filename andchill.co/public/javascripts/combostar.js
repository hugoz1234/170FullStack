/**
 * javascripts/combostar.js: Initializes the use of the Combostars library.
 */

$(function () {
	$('#combostar').on('change', function () {
		$('#starcount').text($(this).val());
	});
	$('#combostar').combostars();
});