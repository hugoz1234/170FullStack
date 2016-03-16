/**
 * jQuery plugin that renders stars used for ratings. See http://stackoverflow.com/questions/1987524/turn-a-number-into-star-rating-display-using-jquery-and-css.
 * usage: $('span.stars').stars();
 * 	<div class="star-container">
 *    <span class="stars"># Stars</span> <small class="detail"># stars rating</small><br>
 *  </div>
 */

(function($){
	'use strict';

	var STAR_WIDTH = 16;

	$.fn.stars = function(val) {
		return $(this).each(function() {
			// Get the value
			//var val = parseFloat($(this).html());
			// Make sure that the value is in 0 - 5 range, multiply to get width
			var size = Math.max(0, (Math.min(5, val))) * STAR_WIDTH;
			// Create stars holder
			var $span = $('<span />').width(size);

			// Replace the numerical value with stars
			$(this).html($span);
		});
	};
})(jQuery);