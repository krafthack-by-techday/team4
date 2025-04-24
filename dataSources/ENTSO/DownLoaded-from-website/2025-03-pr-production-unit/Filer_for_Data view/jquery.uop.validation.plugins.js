/**
 * Global variables for both framework & custom validations
 */
var _webAddressRegex = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

$.validator.addMethod("checkboxList", function (value, elem, param) { // TODO fix binding method to validation
    if ($("#radioMachine:radio").is(":checked")) {
        if ($("#machine-checkboxes :checkbox:checked").length > 0) {
            return true;
        } else {
            return false;
        }
    }
    return true;
}, "You must select at least one!");

$.validator.addMethod("samePassword", function (value, elem, param) {
    if (value === $('#' + param).val()) {
        return true;
    } else {
        return false;
    }
}, "Passwords must be equal!");

$.validator.addMethod("valueNotEquals", function (value, element, arg) {
    return arg != value;
}, "Value must not equal arg.");

$.validator.addMethod('passwordLetters', function (value) {
    return value.match(/^[a-zA-Z0-9!@#$%^&*()_=\[\]{};':"\\|,.<>\/?+-]*$/) != null;
}, "Password contains invalid characters.");

$.validator.addMethod('codeLetters', function (value) {
	return value.match(/^[-a-zA-Z0-9_]*$/) != null;
}, "Code contains invalid characters.");

$.validator.addMethod('nameLetters', function (value) {
    return value.match(/^[^'"&<>]*$/) != null;
}, "Code contains invalid characters.");

$.validator.addMethod('codeLettersWithoutUnderscore', function (value) {
    return value.match(/^[-a-zA-Z0-9]*$/) != null;
}, "Code contains invalid characters.");

$.validator.addMethod('EICLength16', function (value) {
    return value.length === 16;
}, "EIC Code length must be 16 characters.");

$.validator.addMethod('maxLength35', function (value) {
    return value.length <= 35;
}, "Max length is 35 characters.");

$.validator.addMethod('maxLength70', function (value) {
    return value.length <= 70;
}, "Max length is 70 characters.");

$.validator.addMethod('ecpMessageType', function (value) {
	return value.match(/^[-a-zA-Z0-9]*$/) != null;
}, "It contains invalid characters. Only A-Z, a-z, 0-9 and - are allowed.");

$.validator.addMethod('webAddress', function (value) {
    return value === "" || value.match(_webAddressRegex) != null;
}, "Invalid web address");

$.validator.addMethod('timeMinutes', function (value){
    return value >= 0 && value <= 59;
}, "Invalid time format (minutes 0-59)");

$.validator.addMethod('timeHours', function (value){
    return value >= 0 && value <= 23;
}, "Invalid time format (hours 0-23)");

$.validator.addMethod('inputFilledDependency', function (value, element, arg) {
    if ($(element).val().length === 0)
        return true;
    else {
        return $('#' + arg).val().length > 0;
    }
}, 'Current password could not be empty.');

$.validator.addMethod("existsParentRole", function(value, elem, param) {
	var idParentRole = $('#'+param).val();
	if(idParentRole == -1 && value != "")
		return false;
	else
		return true;
}, 'For this assigned organization does not exist selected parent role!');

$.validator.addMethod("datepickerGreaterThen", function(value, element, param){
    return datePickersComparator(param, element, function(firstDate, secondDate) {return firstDate.isBefore(secondDate);});
}, "End date must be greater than start date");

$.validator.addMethod("datepickerGreaterOrEqualThen", function(value, element, param){
	return datePickersComparator(param, element, function(firstDate, secondDate) {return firstDate.isBefore(secondDate) || firstDate.isSame(secondDate);});
}, "End date must be greater or equal than start date");

$.validator.addMethod("datepickerFromToday", function(value, element, param){
	if (param === "false") {
        return true;
    }

	if (param !== "true") {
		// for Angular to use some ID element with data-use to determine if we should use this rule
		var use = $("#" + param).data("use");
		if (!use) {
            return true;
        }
	}

	var date = viewToServer.call($(element), $(element).val(), $('input[id="' + $(element).attr('id').replace('user-friendly-input-', '') + '"]').data('datepicker-type'));

	// empty datepickers
	if (date !== "") {
		date = date.match(/((0[0-9])|([1-2][0-9])|(3[0-1])).((0[1-9])|(1[0-2])).([1-2][0-9]{3}) (([0-1][0-9])|(2[0-3])):([0-5][0-9])/)[0];

		var secondDate = moment(date, 'DD.MM.YYYY HH:mm');
		var now = moment().startOf('day');
		return secondDate.isAfter(now, 'day') || secondDate.isSame(now, 'day');
	}
	return true;
}, "Date must be greater or equal than today");

$.validator.addMethod("fieldsMustBeFilled", function(value, element, param){
	var param = $('#'+param).val();
	if((param == "" && value == "") || (param !="" && value != ""))
		return true;
	else
		return false;
}, "Both fields must be filled or empty");

/* At least one input field in current row has to be filled */
$.validator.addMethod("oneFieldMustBeFilled", function () {
    var fieldIsFilled = false;
    $("tr input").each(function () {
        if (this.value !== "") {
            fieldIsFilled = true;
        }
    });
    return fieldIsFilled;
}, "At least one field must be filled");

$.validator.addMethod("integerValue", function(value){
	return value == parseInt(value);
}, "Value must be integer");

/*
$.validator.addMethod("autocompleteCombo", function(value, element){
    var $input = $('input[name="' + $(element).attr('id') + '_input"]');
    var validValues = $.map($(element).children('option') ,function(option) {
        return $(option).html();
    });

    return $.inArray($input.val(), validValues) >= 0;
}, "Invalid value.");
*/

$.validator.addMethod("decimal", function(value, element, param){
    if (param == "mandatory") {
	    return value == parseFloat(value);
    }
	else {
	    return value == "" || value == parseFloat(value);
    }
}, "Please insert a decimal value");

$.validator.addMethod("wholeNumber", function (value) {
    var input = parseInt(value, 10);
    return (input >= 0) && (value.length == input.toString().length);
}, "Value must be a non-negative whole number");

$.validator.addMethod("shuttleboxRequired", function (value, element) {
	return $(element).find("option").length !== 0;
}, "Please add some items");

$.validator.addMethod("maxDec", function max(value,element,param) {
    if (value != undefined && value != "") {
        var parsedValue = parseFloat(value);
        if (parsedValue <= parseFloat(param)) {
            return parsedValue;
        }
    } else {
        return value == "";
    }
},function (param) {
    return "Please enter a value less than or equal to " + param;
});
