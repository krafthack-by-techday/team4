(function ($) {
    $.fn.validation = function (options) {

        var $form = $(this);

        var errorLabelClass = options === undefined ? 'error-label' : options.errorLabelClass === undefined ? 'error-label' : options.errorLabelClass;
        var errorInputClass = options === undefined ? 'error-input' : options.errorInputClass === undefined ? 'error-input' : options.errorInputClass;
        var errorMessageClass = options === undefined ? 'error-message' : options.errorMessageClass === undefined ? 'error-message' : options.errorMessageClass;

        var _errorPlacement = function (error, element) {
            var $element;
            if ($(element).hasClass('hasDatepicker')) { // if validated input is datepicker
                if ($(element).parent().parent()[0] && $(element).parent().parent().is('div[id^="originalinput-wrapper"]')) { // if datepicker has arrows
                    $element = $(element).parent().parent();
                } else {
                    $element = $(element).parent();
                }
            } else {
                $element = $(element);
            }

            $(error).insertAfter($element).removeClass('valid');
        };

        var _success = function (label, element) {
            if ($(element).hasClass('hasDatepicker')) {
                $(element).parent().removeClass(errorInputClass);
                $(element).removeClass(errorInputClass);
                var $mainLabel;
                if ($(element).parent().parent()[0] && $(element).parent().parent().is('div[id^="originalinput-wrapper"]')) { // if datepicker has arrows)
                    $mainLabel = $(element).parent().parent().siblings('label[for="' + $(element).attr('id').replace('originalinput-wrapper-user-friendly-input-','') + '"][class!="' + errorMessageClass + '"]');
                } else {
                    $mainLabel = $(element).parent().siblings('label[for="' + $(element).attr('id').replace('user-friendly-input-','') + '"][class!="' + errorMessageClass + '"]');
                }
                $mainLabel.removeClass(errorLabelClass);
            } else {
                $(element).siblings('label[for="' + $(element).attr('id') + '"]').removeClass(errorLabelClass);
                $(element).removeClass(errorInputClass);

                // input of jQuery combox is validated
                if ($(element).hasClass("ui-combobox-input")) {
                    var originalSelectId = $(element).attr("name").replace("_input", '');
                    $(element).parent().parent().find('label[for="' + originalSelectId + '"]').removeClass(errorLabelClass);
                }
            }

            if (options !== undefined && options.masterErrorMessage !== undefined && $form.validate().numberOfInvalids() == 0) {
                $(options.masterErrorMessage).fadeOut();
            }
        };

        var _highlight = function (element, clazz) {
            if ($(element).hasClass('hasDatepicker')) {
                $(element).parent().addClass(errorInputClass);
                $(element).addClass(errorInputClass);
                var $mainLabel;
                if ($(element).parent().parent()[0] && $(element).parent().parent().is('div[id^="originalinput-wrapper"]')) { // if datepicker has arrows)
                    $mainLabel = $(element).parent().parent().siblings('label[for="' + $(element).attr('id').replace('originalinput-wrapper-user-friendly-input-','') + '"][class!="' + errorMessageClass + '"]');
                } else {
                    $mainLabel = $(element).parent().siblings('label[for="' + $(element).attr('id').replace('user-friendly-input-','') + '"][class!="' + errorMessageClass + '"]');
                }
                $mainLabel.addClass(errorLabelClass);
            } else {

                $(element).siblings('label[for="' + $(element).attr('id') + '"][class!="' + errorMessageClass + '"]').addClass(errorLabelClass);
                $(element).addClass(errorInputClass);

                // input of jQuery combox is validated
                if ($(element).hasClass("ui-combobox-input")) {
                    var originalSelectId = $(element).attr("name").replace("_input", '');
                    $(element).parent().parent().find('label[for="' + originalSelectId + '"][class!="' + errorMessageClass + '"]').addClass(errorLabelClass);
                }
            }

            if (options !== undefined && options.masterErrorMessage !== undefined) {
                if ($form.validate().numberOfInvalids() > 0) {
                    $(options.masterErrorMessage).fadeIn();
                }
            }

        };

        var _submitHandler = function (form) {
            $form.submit(false);

            setTimeout(function () {
                if ($(".uopComboInvalid").length > 0)
                {
                    $(".uopComboInvalid").removeClass("uopComboInvalid");
                    return false;
                }

                if (options !== undefined && options.submitHandler !== undefined) {
                    options.submitHandler(form);
                }

            }, 250);
        }

        var messagesStr = {}; // definition of error messages
        messagesStr['required'] = "Please fill this field";
        messagesStr['url'] = "Please enter a valid URL";
        messagesStr['email'] = "Please enter a valid email address";
        messagesStr['valueNotEquals'] = "Please select any field";

        var rules = {};
        var messages = {};

        // for each input element, which is not a submit...
        $(this).find('input[type!="submit"], select').each(function (index, elem) {

            if ($(elem).attr('class') !== undefined) {

                // process each class in found input element
                $.each($(elem).attr('class').split(" "), function (indexClass, subClass) {

                    var matched = "" + subClass.match(/validation-.[_a-zA-Z0-9-]*/) + ""; // check if processing class is validation definition class
                    if (matched.length > 5) {
                        var message = matched.split("--");
                        if (message.length > 1) {
                            matched = message[0];
                            message = message[1].replace(/_/g, ' ');
                        } else {
                            matched = message[0];
                            message = undefined;
                        }
                        var value = matched.split("_")[1]; // parse validation value
                        var method = matched.split('-')[1].split("_")[0]; // parse validation rule

                        var name;

                        if($(elem).hasClass('has-datepicker')){
                            $('input[id$="' + $(elem).attr('id') + '"].hasDatepicker').attr('name', 'datepicker-' + $(elem).attr('name'));
                            name = 'datepicker-' + $(elem).attr('name');
                        } else {
                            name = $(elem).attr('name');
                        }

                        if (rules[name] === undefined) { // if input has no rule
                            rules[name] = {}; // make object for rules definition
                        }
                        if (messages[name] === undefined) { // same as with rules
                            messages[name] = {};
                        }
                        value = value === "true" ? true : value; // type conversion
                        value = value === "false" ? false : value;
                        rules[name][method] = value; // add validation rule
                        messages[name][method] = message ? message : messagesStr[method]; // add error message
                    }
                });
            }
        });

        var _options = {}; // create options object
        _options.errorClass = errorMessageClass;
        _options.rules = rules;
        _options.messages = messages;
        _options.submitHandler = options === undefined ? undefined : options.submitHandler === undefined ? undefined : _submitHandler;
        _options.success = options === undefined ? _success : options.success === undefined ? _success : options.success;
        _options.highlight = options === undefined ? _highlight : options.highlight === undefined ? _highlight : options.highlight;
        _options.errorPlacement = options === undefined ? _errorPlacement : options.errorPlacement === undefined ? _errorPlacement : options.errorPlacement;
        _options.onfocusout = false;
        _options.newValidator = options === undefined ? false: options.newValidator === undefined ? false : options.newValidator;
        $(this).validate(_options); // bind validation
    };
})(jQuery);

/*
 *
 *
 *
 *
 *
 *
 *
 */

(function ($) {
    $.fn.showError = function (message, masterErrorMessage, classes) {

        var errorLabelClass = classes === undefined ? 'error-label' : classes.errorLabelClass === undefined ? 'error-label' : classes.errorLabelClass;
        var errorInputClass = classes === undefined ? 'error-input' : classes.errorInputClass === undefined ? 'error-input' : classes.errorInputClass;
        var errorMessageClass = classes === undefined ? 'error-message' : classes.errorMessageClass === undefined ? 'error-message' : classes.errorMessageClass;

        $(this).prev('label[for="' + $(this).attr('id') + '"]').addClass(errorLabelClass);
        if($(this).hasClass('has-datepicker')){
            $('#input-button-wrapper-user-friendly-input-' + $(this).attr('id') + ', #user-friendly-input-' + $(this).attr('id')).addClass(errorInputClass);
        } else
            $(this).addClass(errorInputClass);

        if (message !== undefined) {

	        var $element = $(this);
	        if (typeof $element.attr('data-error-to-tooltip') === 'string') {

	            if($element.attr('data-tooltip-attached') == true) {
	                $element.tooltip('destroy');
	                $element.attr('data-tooltip-attached', false);
                }

		        $element.off('tooltipcreate').on('tooltipcreate', function () {
			        $element.off('tooltipclose').on('tooltipclose', function () {
				        $element.tooltip('destroy');
				        $element.attr('data-tooltip-attached', false);
			        });
		        });

		        $element
			        .attr('data-tooltip-attached', true)
			        .addTooltip()
			        .tooltip('option', 'content', message)
			        .tooltip('open');

	        } else {
		        var $errorMessageLabel = $(this).next('label[class*="' + errorMessageClass + '"]');
		        if ($errorMessageLabel === undefined || $errorMessageLabel.length == 0) {
			        var label = '<label class="' + errorMessageClass + '" for="' + $(this).attr('id') + '">' + message + '</label>';
			        if ($(this).hasClass('has-datepicker')) {
				        if ($('div#originalinput-wrapper-user-friendly-input-' + $(this).attr('id')).length > 0) { //datepicker has arrows
					        $errorMessageLabel = $('div#originalinput-wrapper-user-friendly-input-' + $(this).attr('id')).after(label).next('label');
				        } else {
					        $errorMessageLabel = $('div#input-button-wrapper-user-friendly-input-' + $(this).attr('id')).after(label).next('label');
				        }

			        } else {
				        $errorMessageLabel = $(this).after(label).next('label');
			        }
		        } else {
			        $errorMessageLabel.html(message).removeClass('valid');
		        }
		        $errorMessageLabel.fadeIn(1);
	        }
        }

        if (masterErrorMessage !== undefined) {
            $(masterErrorMessage).fadeIn(1);
        }

    };
})(jQuery);

/*
 *
 *
 *
 *
 *
 *
 *
 */

(function ($) {
    $.fn.hideError = function (masterErrorMessage, classes) {

        var errorLabelClass = classes === undefined ? 'error-label' : classes.errorLabelClass === undefined ? 'error-label' : classes.errorLabelClass;
        var errorInputClass = classes === undefined ? 'error-input' : classes.errorInputClass === undefined ? 'error-input' : classes.errorInputClass;
        var errorMessageClass = classes === undefined ? 'error-message' : classes.errorMessageClass === undefined ? 'error-message' : classes.errorMessageClass;

        $(this).prev('label[for="' + $(this).attr('id') + '"]').removeClass(errorLabelClass);
        if($(this).hasClass('has-datepicker')){
            $('#input-button-wrapper-user-friendly-input-' + $(this).attr('id') + ', #user-friendly-input-' + $(this).attr('id')).removeClass(errorInputClass);
        } else
            $(this).removeClass(errorInputClass);

        var $errorMessageLabel;
        if($(this).hasClass('has-datepicker')){
            $errorMessageLabel = $('label[for="' + $(this).attr('id') + '"].' + errorMessageClass);
        } else
            $errorMessageLabel = $(this).next('label[class*="' + errorMessageClass + '"]');

        if ($errorMessageLabel !== undefined & $errorMessageLabel.length != 0) {
            $errorMessageLabel.addClass('valid').fadeOut(1);
        }

        if (masterErrorMessage !== undefined) {
            $(masterErrorMessage).addClass('valid').fadeOut(1);
        }
    };
})(jQuery);

/*
 *
 *
 *
 *
 *
 *
 *
 */

var showErrors = function (validationResult, masterErrorMessage, classes) {
    $.each(validationResult, function (index, item) {
        $('#' + item.errorField).showError(item.errorMessage, masterErrorMessage !== undefined ? masterErrorMessage : undefined, classes !== undefined ? classes : undefined);
    });

};

/*
 *
 *
 *
 *
 *
 *
 *
 */
(function ($) {
    $.fn.triggerCallback = function (callback) {
        if (typeof callback == 'function') callback();
        return this;
    };
})(jQuery);