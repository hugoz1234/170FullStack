/**
 * jquery.taglist.js: jQuery plugin that creates a "taglist" within the element on which it is called.
 *
 * Originally created by John for John's startup, EditRevise, on 6/15/15. I've modified it to be more RESTful and keep it around for
 * instances like AndChill that require an easy way to maintain a list of items.
 */

(function($) {
	$.fn.taglist = function (args) {
		var settings = {
			emptyText: 'Nothing here yet!',
			additionalPostParams: {},
			initialItems: [], // ID, text pairs
			loadingIconUrl: 'https://editrevise.com/static/erEditate/img/ajax-loader.gif',
			loadUrl: '', // Returns list of objects to display
			saveUrl: '', // Where to save updated objects
			newUrl: '', // Where to POST to create a new object
			deleteUrl: '', // Where to POST to delete an object
			editable: true // If items can be edited
		};
		$.extend(settings, args);

		var lastId = 0; // So we can always give unique IDs

		// currently only works on a single element

		// Topbar stuff
		var addonContainer = $('<div />').addClass('input-group');
		var textbox = $('<input />').attr('type', 'textbox')
			.addClass('form-control');
		var addButton = $('<button />').attr('type', 'button')
			.addClass('btn')
			.addClass('btn-default')
			.css('border-width', '1px')
			.text('Add');
		var buttonSpan = $('<span />').addClass('input-group-btn');

		// Add all the top stuff to the container
		textbox.appendTo(addonContainer);
		buttonSpan.append(addButton).appendTo(addonContainer);
		this.append(addonContainer);

		// List group configuration
		var listGroup = $('<div />').addClass('list-group');
		this.append(listGroup);

		// Attach handlers
		addButton.on('click', function () { addButtonClickHandler() });
		textbox.on('keypress', function (e) {
			// Also do button clicks on enter (enter is 13)
			var ENTER = 13;
			if (e.which === ENTER) {
				addButtonClickHandler();
				e.preventDefault(); // Keep any forms from submitting
			}
		});

		var addButtonClickHandler = function addButtonClickHandler () {
			var value = textbox.val();
			if (value) {
				createItem(value);
				textbox.val('');
			}
		};

		/** Checks to see if the listGroup is empty. If it is, it adds an empty item. If it is not, it removes the empty item. */
		var emptyListHandler = function emptyListHandler () {
			// No children: Add the empty item
			if (listGroup.children().length === 0) {
				listGroup.append($('<a />').addClass('list-group-item').addClass('taglist-empty-item').text(settings.emptyText));
			}

			// Has children: remove the empty item
			else if (listGroup.children().length > 1 && listGroup.find('.taglist-empty-item').length === 1) {
				listGroup.find('.taglist-empty-item').remove();
			}
		};

		/**
		 * Sets the row with the specified ID's loading state to isLoading.
		 *
		 * @param rowId id of the row
		 * @param isLoading whether or not the row with the specified ID is loading.
		 */
		var setRowLoading = function setRowLoading (row, isLoading) {
			//var rowControls = $('.taglist-row[data-id="' + rowId + '"]');
			var deleteLink = row.find('.taglist-row-delete');
			var loadingIcon = row.find('.taglist-row-loading');

			if (isLoading) {
				deleteLink.hide();
				loadingIcon.show();
			} else {
				deleteLink.show();
				loadingIcon.hide();
			}
		};

		/**
		 * Creates a new row to be displayed in the taglist. This new row is in the 'loading' state, so it has a loading image.
		 *
		 * @param text the text of the row
		 * @param id the ID of the object represented by the row
		 *
		 * @return jQuery object representhing the row (not appended to anything)
		 */
		var createRow = function createRow (text, id) {
			var row = $('<a />').addClass('list-group-item')
				.addClass('taglist-row')
				.attr('data-id', id);
			var rowText = $('<span />').addClass('taglist-row-text')
				.text(text)
				.on('click', function () { editItem($(this).attr('data-id') )});

			var rowControls = $('<span />').css('float', 'right')
				.addClass('taglist-row-controls');
			var deleteLink = $('<a />').attr('href', '#')
				.addClass('taglist-row-delete')
				.on('click', function (e) {
					deleteItemWithId(row.attr('data-id'));
					e.preventDefault(); // Don't jump to the top of the page
				}).html('<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>')
				.hide()
				.appendTo(rowControls);
			var loadingIcon = $('<img />').attr('src', settings.loadingIconUrl)
				.addClass('taglist-row-loading')
				.appendTo(rowControls);

			row.append(rowControls).append(rowText);

			return row;
		};

		/**
		 * Creates an item with the specified text on the remote server and adds it to the local list on success.
		 *
		 * @param text the text of the item to create
		 */
		var createItem = function createItem (text) {
			var row = createRow(text, -1);
			var postParams = { text: text };
			$.extend(postParams, settings.additionalPostParams);

			var successfn = function (id, receivedText) {
				if (receivedText)
					row.find('.taglist-row-text').text(receivedText);

				row.attr('data-id', id); // Update the row's ID once we get it from the server
				setRowLoading(row, false);
			};

			if (settings.newUrl) {
				$.post(settings.newUrl, postParams, function (d) {
					console.log('CreateItem:', d);
					var data = d;
					successfn(data.message.id, data.message.text);
				}).fail(function () {
					alert('Failed to create the item. Please try again.');
					row.remove();
					emptyListHandler();
				});
			} else {
				successfn(lastId++);
			}

			row.appendTo(listGroup);
			emptyListHandler();
		};

		/**
		 * Adds an existing item to the taglist.
		 *
		 * @param text the text of the existing item
		 * @param id the id of the existing item
		 */
		var addExistingItem = function addExistingItem (text, id) {
			var row = createRow(text, id);
			row.appendTo(listGroup);
			setRowLoading(row, false);
			emptyListHandler();
		};

		/**
		 * Edits the row with the specified ID.
		 *
		 * @param id ID of the row to edit.
		 */
		var editItem = function editItem (id) {
			var row = $('.taglist-row[data-id="' + id + '"]');
			var originalText = row.find('.taglist-row-text').text();

			var editContainer = $('<div />').addClass('input-group');

			var editTextBox = $('<input />').attr('type', 'text')
				.addClass('form-control')
				.val(originalText)
				.appendTo(editContainer)

				// Handle key presses
				.on('keypress', function (e) {
					// TODO: ESC -> cancel (doesn't seem to work for some reason)
					var ENTER = 13;
					if (e.which === ENTER) {
						persistEdits();
					}
				});

			var buttonContainer = $('<span />').addClass('input-group-btn').appendTo(editContainer);

			var saveButton = $('<button />').addClass('btn')
				.addClass('btn-success')
				.attr('type', 'button')
				.on('click', function () { persistEdits(); })
				.html('<span class="glyphicon glyphicon-ok-sign" aria-hidden="true"></span> <span class="sr-only">Save</span>')
				.css('border-width', '1px')
				.css('height', '34px') // Necessary with the glyphicon due to a Bootstrap bug
				.appendTo(buttonContainer);

			var cancelButton = $('<button />').addClass('btn')
				.addClass('btn-danger')
				.attr('type', 'button')
				.on('click', function () { cancelEdits(); })
				.html('<span class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span> <span class="sr-only">Cancel</span>')
				.css('border-width', '1px')
				.css('height', '34px')
				.appendTo(buttonContainer);

			// Set up the editing
			row.find('.taglist-row-text').remove();
			row.prepend(editContainer);
			row.find('.taglist-row-controls').hide();

			/** Saves the edits made to the row. */
			var persistEdits = function () {
				// We only need to do something if there is a save URL specified
				if (settings.saveUrl) {
					// Replace the old row with a new, loading one
					var newText = editTextBox.val()
					var postParams = { id: id, text: newText };
					var newRow = createRow(newText, id);
					row.replaceWith(newRow);
					row = newRow;

					$.extend(postParams, settings.additionalPostParams);

					$.post(settings.saveUrl, postParams, function (d) {
						// On success, just set the loading state to false
						setRowLoading(row, false);
					}).fail(function () {
						// On failure, replace the row with the old one
						var newRow = createRow(originalText, id);
						row.replaceWith(newRow);
						row = newRow;
						setRowLoading(row, false);
					});
				}
			};

			/** Gets rid of the edits made to the row. */
			var cancelEdits = function () {
				var newRowText = $('<span />').addClass('taglist-row-text')
					.text(originalText);
				editContainer.remove();
				row.append(newRowText);
				row.find('.taglist-row-controls').show();
			};
		};

		/**
		 * Deletes the item with the specified ID from the remote server and removes it from the local list on success.
		 *
		 * @param id the ID of the item to remove
		 */
		var deleteItemWithId = function deleteItemWithId (id) {
			id = id ? id : '';

			var row = $('.taglist-row[data-id="' + id + '"]');
			var postParams = { id: id };
			$.extend(postParams, settings.additionalPostParams);

			var successfn = function () {
				row.remove();
				emptyListHandler();
			};

			setRowLoading(row, true);
			console.log(postParams, row)
			if (settings.deleteUrl) {
				$.ajax({
					url: settings.deleteUrl,
					data: postParams,
					method: 'DELETE'
				}).done(function (d) {
					var data = d;
					successfn();
				}).fail(function () {
					alert('Failed to delete the item. Please try again.');
					setRowLoading(row, false);
				});
			} else {
				successfn();
			}
		};

		// Edit a row when its text gets clicked
		this.on('click', '.taglist-row-text', function () {
			if (settings.editable) {
				editItem($(this).parent().attr('data-id'));
			}
		});

		// Add all the initial items
		for (var i = 0; i < settings.initialItems.length; i++) {
			var item = settings.initialItems[i];

			// Switch the pk property into the id property so we can use it
			if (item && typeof item.id === 'undefined' && typeof item.pk !== 'undefined')
				item.id = item.pk

			// Sanity check
			if (typeof item.id === 'undefined' || typeof item.text === 'undefined')
				throw 'Initial TagList items must have an id field and a text field.'

			addExistingItem(item.text, item.id);
		}

		// Load existing items from the server as well as user specified ones
		if (settings.loadUrl) {
			$.get(settings.loadUrl, settings.additionalPostParams, function (d) {
				var data = d;
				for (var i = 0; i < data.length; i++) {
					settings.initialItems.push(data[i]);
					addExistingItem(data[i].text, data[i].id)
				}
			});
		}

		emptyListHandler();
	};
}(jQuery));
