/**
 * If you want to hide some items from combobox, you have to specify items value to data-hidden-options attribute of original HTML select.
 * Options must be separated by space.
 *
 * Example of use:
 * $('select').combobox(); //initilization of combo
 * $('select').data('hidden-options', 'OPT1 OPT2'); // I want to hide options OPT1 and OPT2
 */

(function ($) {
	$.widget("ui.combobox", {
		options: { setOriginalWidth: false },
		/*
		 * Creates the combobox
		 */
		_create: function () {
			// check if select element has its own id
			if (this.element.attr("id") == undefined
				|| this.element.attr("id") == null
				|| this.element.attr("id") == '') {
				// if not, generate new one
				this.element.attr("id", guid());
			}

			this.wrapper = $("<div>")
				.attr("class", this.element.attr("class"))
				.addClass("ui-combobox")
				.insertAfter(this.element);

			var width = this.element.width() + 10 + 'px';

			if(typeof mobileView !== "undefined" && mobileView){
				width = this.element.width() * 2 + 30 + 'pt';
				this.element.width(this.element.width() * 2.5);
			}

			this.wrapper.css("width", width);

			this.element.hide();
			var isDisabled = this.element.attr('disabled') != undefined;

			this._createAutocomplete(isDisabled, this.element.width() - 20);
			this._createShowAllButton(isDisabled);
		},
		_createAutocomplete: function (disabled, width) {
			var selected = this.element.children(":selected");
			var value = selected.val() ? selected.text() : "";
			// ie specific padding
			var padding = (document.all) ? 4 : 6;

			function tog(v) {
				return v ? 'addClass' : 'removeClass';
			}

			this.input = $("<input type='text'>")
				.appendTo(this.wrapper)
				.val(value)
				.attr("title", "")
				.attr("name", this.element.attr("id") + '_input')
				.attr("class", this.element.attr("class"))
				.css("width", width + "px")
				.addClass("ui-combobox-input")
				.autocomplete({
					delay: 0,
					minLength: 0,
					source: $.proxy(this, "_source"),
					open: function (event, ui) {
						$(".ui-autocomplete")
							.css("min-width", (width + 30) + "px")
							.addClass("ui-combobox-active")
							.removeClass("ui-corner-all");
						$(this).addClass("ui-combobox-active");
						$(".ui-autocomplete li").unbind('mouseenter mouseleave mouseover');
						$(".ui-autocomplete li").bind("mouseenter", function () {
							$(".ui-combobox-input").tooltip("close");
						});
					},
					close: function (event, ui) {
						$(this).removeClass("ui-combobox-active");
						$('#' + $(this).attr('name').replace(/(_input)$/, '')).trigger('autocomplete-close');
					}
				}).tooltip({
					tooltipClass: "tooltip glow-box",
					show: { delay: 1000 }
				}).on('input showCross', function () {
					$(this)[tog(this.value)]('x');
				}).on('mousemove', '.x', function (e) {
					$(this)[tog(this.offsetWidth - 18 < e.clientX - this.getBoundingClientRect().left)]('onX');
				}).on('click', '.onX', function () {
					$(this).removeClass('x onX').val('').trigger('clearByButton');
				});

			var thisReference = this;
			this.input.data('ui-autocomplete')._renderItem = function(ul, item){
				var hiddenItems = $(thisReference.element).data('hidden-options') ? $(thisReference.element).data('hidden-options').split(' ') : [];
				var retLi = "";
				if (item.label == "&nbsp;"){
          retLi = $('<li>').append('<a>' + item.label + '</a>').appendTo(ul);
				}else{
          retLi = $('<li>').append('<a>' + $("<span />").text(item.label).html() + '</a>').appendTo(ul);
				}
				if($.inArray(item.option.value, hiddenItems) > -1){
					retLi.css({display: 'none'});
				}
				return retLi;
			};

			if (disabled) {
				this.input.attr("disabled", "disabled");
				this.wrapper.addClass('disabled');
			}


			this._on(this.input, {
				autocompleteselect: function (event, ui) {
					ui.item.option.selected = true;
					this._trigger("select", event, {
						item: ui.item.option
					});
					this.input.attr("title", ui.item.option.text);
					if (this.options.showValidationLabel && $(this.wrapper).next().hasClass('autocomplete-clear')) {
						$(this.wrapper).nextUntil('.combobox-error-message+*').remove();
					}
					this.input.removeClass("uopComboInvalid");
					// additional change event trigger
					$(ui.item.option).parents("select").trigger('autocomplete-select');
				},
				autocompleteclose: function () {
					this.element.trigger("change");
				},
				autocompletechange: function (event, ui) {
					this._removeIfInvalid(event, ui);
				}/*,
				change: function (event, ui) {
					this._removeIfInvalid(event, ui);
				}*/
			});

			this.input.bind("keypress", function (event, ui) {
				$(this).attr("title", "");
			});

			// Removes frozen tooltip when reentering the filter value
			this.input.bind("keyup", function (event, ui) {
				$(".tooltip").hide();
			});
		},

		_createShowAllButton: function (disabled) {
			var input = this.input,
				wasOpen = false;

			var button = $("<input type='button'>");
			button.attr("tabIndex", -1)
				.attr("title", "Show All Items")
				.appendTo(this.wrapper)
				.button()
				.addClass("ui-combobox-toggle")
				.mousedown(function () {
					wasOpen = input.autocomplete("widget").is(":visible");
				})
				.click(function () {
					if (disabled) return;
					input.focus();

					// Close if already visible
					if (wasOpen) {
						return;
					}

					// Pass empty string as value to search for, displaying all results
					input.autocomplete("search", "");
				});
		},

		_source: function (request, response) {
			var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
			var sortedOptions = (this.options && this.options.noSorting && this.options.noSorting === true) ? this.element.children("option") : sortOptionsByText(this.element.children("option"));
			response(sortedOptions.map(function () {
				var text = $(this).text();
				if (this.value && ( !request.term || matcher.test(text) ))
					return {
						label: text == '' ? '&nbsp;' : text,
						value: text,
						option: this
					};
			}));

			function sortOptionsByText(optionCollection) {

				optionCollection.sort(function (a, b) {
					if (a.text < b.text) return -1;
					if (a.text == b.text) return 0;
					return 1;
				});
				return optionCollection;
			}
		},

		_removeIfInvalid: function (event, ui) {

			// Selected an item, nothing to do
			if (ui && ui.item) {
				this.input.removeClass("uopComboInvalid");
				return;
			}
			this.input.addClass("uopComboInvalid");

			// Search for a match (case-insensitive)
			var value = this.input.val(),
				valueLowerCase = value.toLowerCase(),
				valid = false;
			this.element.children("option").each(function () {
				if ($(this).text().toLowerCase() === valueLowerCase) {
					this.selected = valid = true;
					return false;
				}
			});

			// Found a match, nothing to do
			if (valid) {
				this.input.removeClass("uopComboInvalid");
				return;
			}

			// Remove invalid value
			this.input.val("");

      value = $("<span />").text(value).html();

      if (this.options.showValidationLabel) {
				$(this.wrapper).nextUntil('.combobox-error-message+*').remove();
				$(this.wrapper).after('<div class="clear autocomplete-clear"></div><div class="error-message combobox-error-message" style="display: block; margin-top: 5px;">\"' + value + '\" didn\'t match any item.</div>');
			} else {
				/*
				 this.input.attr("title", value + " didn't match any item")
				 .tooltip("option", "tooltipClass", "tooltip glow-box tooltip-error")
				 .tooltip("option", "show", { delay: 0 })
				 .tooltip("open");    */

				$('<div class="glow-box combobox-error-message-tooltip"></div>')
					.prepend(value + " didn't match any item")
					.appendTo('body')
					.css({top: $(this.wrapper).offset().top + $(this.wrapper).height() + 5,
						left: $(this.wrapper).offset().left})
					.fadeIn(250)
					.delay(2000)
					.fadeOut(250, function () {
						$(this).remove();
					});
			}

			// try to search empty option
			var emptyOption = this.element.find('option').filter(function () {
				return this.text == ""
			});
			if (emptyOption.length == 0) {
				this.element.val("");
				this.input.val(this.element.find("option:selected").text());
			}
			else this.element.val(emptyOption.val());

			this._delay(function () {
				if (this.input.parent().parent()[0])
					this.input.tooltip("option", "tooltipClass", "tooltip glow-box")
						.tooltip("option", "show", { delay: 1000 })
						.tooltip("close").attr("title", "")
						.removeClass("uopComboInvalid");
			}, 2500);
		},

		_destroy: function () {
			this.wrapper.remove();
			this.element.show();
		}
	});
})(jQuery);