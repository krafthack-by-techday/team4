/*
 *  Project: prettyCheckable
 *  Description: jQuery plugin to replace checkboxes and radios for custom images
 *  Author: Arthur Gouveia
 *  License: Licensed under the MIT License
 */


(function($, window, undefined) {

	var pluginName = 'prettyCheckable', document = window.document, defaults = {
		labelPosition : 'right',
		customClass : '',
		color : 'blue',
		eventType : 'change',
		singleSelectParentSelector : null,
		multipleSelectParentSelector : null
	};

	function Plugin(element, options) {
		this.element = element;
		this.options = $.extend({}, defaults, options);

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	function addCheckableEvents(element, options) {

		element.find('a').on(
				'touchstart click',
				function(e) {

					e.preventDefault();

					var clickedParent = $(this).parent();

					if (clickedParent.hasClass("disabled")) {
                        return;
                    }

					var input = $(this).siblings("input");
					var fakeCheckable = $(this);

					if (input.prop('type') === 'radio') {

						$('input[name="' + input.attr('name') + '"]').each(
								function(index, el) {

									$(el).prop('checked', false).parent().find(
											'a').removeClass('checked');

								});

					}
					else if (options.singleSelectParentSelector != null
						&& options.singleSelectParentSelector != '')
					{
						$("div.prettycheckbox", options.singleSelectParentSelector).each(function()
						{
							$(this).find("a").removeClass("checked");
							$(this).find("input").removeAttr("checked");
						});
					}
					else if (options.multipleSelectParentSelector != null
						&& options.multipleSelectParentSelector != '')
					{
						var selectedBoxesCount = input
							.parents('.dv-multiple-select-checkboxes')
							.children('.dv-filter-checkbox')
							.find('input[type="checkbox"]:checked')
							.length;
						var selectedAreaBoxesCount = input
							.parents('.dv-multiple-select-checkboxes')
							.find('.dv-sub-filter-hierarchic-wrapper')
							.children('.dv-filter-checkbox')
							.find('input[type="checkbox"]:checked')
							.length;
						if (input.attr('checked') === "checked" && (selectedBoxesCount < 2 && selectedAreaBoxesCount < 2)) {
							fakeCheckable.toggleClass('checked');
							input.removeAttr("checked");
						}
					}
					
					// checked attribute must not be changed when click event is fired
					// otherwise two clicks are done
					if (options.eventType != "click")
					{
						if (input.attr('checked') == "checked") {
							input.removeAttr("checked");
						} else {
							input.attr('checked', "checked");			
						}
					}

					// fire the original event on the input
					input.trigger(options.eventType);

					if (input.attr('checked') === "checked") {
						fakeCheckable.addClass('checked');
					} else {
						fakeCheckable.removeClass('checked');
					}
				});

		element.find('a').on('keyup', function(e) {

			if (e.keyCode === 32) {

				$(this).click();
			}

		});
		
		if (options.eventType != "click")
		{
			// Finds thirdparty label and handles its click event
			element.siblings("label[for=" + element.find("input").attr("id") + "]")
						.unbind("click")
						.click(function (e) 
							{ 
								e.preventDefault();
								element.find("a").click();
							});
		}
			
	}

	Plugin.prototype.init = function() {

		var el = $(this.element);

		el.css('display', 'none');

		var classType = el.data('type') !== undefined ? el.data('type') : el.attr('type');
		var label = el.data('label') !== undefined ? el.data('label') : '';

		var labelPosition = el.data('labelposition') !== undefined ? 'label'
				+ el.data('labelposition') : 'label'
				+ this.options.labelPosition;

		var customClass = el.data('customclass') !== undefined ? el
				.data('customclass') : this.options.customClass;

		var color = el.data('color') !== undefined ? el.data('color')
				: this.options.color;

		var disabled = el.prop('disabled') === true ? 'disabled' : '';

		var containerClasses = [ 'pretty' + classType, labelPosition,
				customClass, color, disabled ].join(' ');

		el.wrap('<div class="clearfix ' + containerClasses + '"></div>')
				.parent().html();

		var dom = [];
		var isChecked = el.prop('checked') ? 'checked' : '';
		var isDisabled = el.prop('disabled') ? true : false;

		if (labelPosition === 'labelright') {

			dom.push('<a href="#" class="' + isChecked + '"></a>');
			dom.push('<label for="' + el.attr('id') + '">' + label + '</label>');

		} else {

			dom
					.push('<label for="' + el.attr('id') + '">' + label
							+ '</label>');
			dom.push('<a href="#" class="' + isChecked + '"></a>');

		}

		el.parent().append(dom.join('\n'));
		addCheckableEvents(el.parent(), this.options);

	};

	Plugin.prototype.disableInput = function(clearSelected) {

		var el = $(this.element);

		if (clearSelected)
		{
			el.parent().find('a').removeClass('checked');
			el.prop("checked", false);
		}

		el.parent().addClass('disabled');
		el.attr("disabled", "disabled");

	};

	Plugin.prototype.enableInput = function(clearSelected) {
		
		var el = $(this.element);
		if (clearSelected)
		{
			el.parent().find('a').removeClass('checked');
			el.prop("checked", false);
		}
		el.parent().removeClass('disabled');
		el.removeAttr("disabled");

	};

    Plugin.prototype.isEnabledInput = function() {

        var el = $(this.element);
        return typeof el.attr('disabled') === 'undefined';
    };


	$.fn[pluginName] = function(options) {
		var inputs = [];
		this.each(function() {
			if (!$.data(this, 'plugin_' + pluginName)) {
				inputs.push($.data(this, 'plugin_' + pluginName, new Plugin(
						this, options)));
			}
		});
		return inputs;
	};

}(jQuery, window));
