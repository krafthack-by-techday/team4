/**
 *     Mapping input elements to error message, which server validation returns error
 *
 *     Example of use:
 *         serverErrorCodeMapping.UNIQUE_ORGANIZATION_NAME = ['#fullName'];
 */
var serverErrorCodeMapping = new Object();

trimForIE8();

(function ($) {
	$.fn.hasOverflow = function () {
		var $this = $(this);
		var $children = $this.find('*').not("script");
		var len = $children.length;

		if (len) {
			var maxWidth = 0;
			var maxHeight = 0
			$children.map(function () {
				maxWidth = Math.max(maxWidth, $(this).outerWidth(true));
				maxHeight = Math.max(maxHeight, $(this).outerHeight(true));
			});

			return maxWidth > $this.width() || maxHeight > $this.height();
		}

		return false;
	}
})(jQuery);

(function ($) {
	$.fn.addTooltip = function () {

		var effectIn, effectOut;

		if (document.documentMode) { // IE8 detect. If '8' -> IE8, if undefined -> "The Browser"
			effectIn = 'none';
			effectOut = 'none';
		} else {
			effectIn = 'fadeIn';
			effectOut = 'fadeOut';
		}

		$(this).each(function () {
			$(this).tooltip({show: {delay: 500, effect: effectIn}, hide: {effect: effectOut}, position: {my: 'left-10 top-3'}, tooltipClass: 'help-tooltip' });
		});

		return this;
	}
})(jQuery);

$(document).ready(function () {
	$('.jquery-tooltip').addTooltip();//.tooltip('open');
});

/** Hack for ie8 trim function */
function trimForIE8() {
	if (typeof String.prototype.trim !== 'function') {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, '');
		}
	}
}

/* Function send Ajax request and return response */
function fnAjaxRequest(nTr, url) {
	var sOut = '';
	var aData = oTable.fnGetData(nTr);

	$.ajax({
		type: 'GET',
		url: baseUrl + url,
		async: false,
		data: {id: aData[0]}

	}).done(function (data) {

			sOut = data;
		}
	).fail(function () {
			return "";
		});

	return sOut;
};

/** function transform tableData request to better 'object' form.
 Variables with same name but with index postfix are store into array
 **/
var stringify_aoData = function (aoData) {
	var o = {};
	var modifiers = ['mDataProp_', 'sSearch_', 'iSortCol_', 'bSortable_', 'bRegex_', 'bSearchable_', 'sSortDir_'];
	jQuery.each(aoData, function (idx, obj) {
		if (obj.name) {
			for (var i = 0; i < modifiers.length; i++) {
				if (obj.name.substring(0, modifiers[i].length) == modifiers[i]) {
					var index = parseInt(obj.name.substring(modifiers[i].length));
					var key = 'a' + modifiers[i].substring(0, modifiers[i].length - 1);
					if (!o[key]) {
						o[key] = [];
					}
					o[key][index] = obj.value;
					return;
				}
			}
			o[obj.name] = obj.value;
		}
		else {
			o[idx] = obj;
		}
	});
	return JSON.stringify(o);
};

var showErrorDialog = function (message) {
	$('<div id="errDlg">' + message + '</div>').dialog({
		title: 'Error',
		draggable: false,
		modal: true,
		resizable: false,
		width: "600px",
		heigth: "200px",
		buttons: {
			"OK": function () {
				$(this).dialog("close");
			}
		}
	});
};

function appendSecurityToken(nestedUrl) {
	var regex = /\\?(.+=.+){1,}$/;
	var appendToken = "securityToken=" + _securityToken;
	var appendChar = (regex.test(nestedUrl)) ? "&" : "?";
	appendToken = appendChar + appendToken;
	nestedUrl = nestedUrl + appendToken;
	return nestedUrl;
}

/**
 *     Ajax function which send request to server and return response with error handling
 *     options:
 *         contentType - type of data sent to server
 *         dataType - type of data returned from server
 *         url - URL where to send the request
 *         data - data sent to server; can be null
 *         method - HTTP request method; can be null, default GET
 *         async - asynchronous communication; can be null, default FALSE
 *         masterErrorMessage - element with master error message to show, if error is validation error; can be null
 *         success(responseData) - callback which is called when is ajax request successful process (can be null)
 *         error()  - callback which is called if AJAX error
 *
 *     return:
 *         ajax response
 *
 *     Example of use:
 *
 *     var result = ajaxRequestResponse({
 * 		url: '/usrm/orgs/update',
 * 		method: 'POST',
 * 		masterErrorMessage: '#master-error-message',
 * 		data: $(form).serialize(),
 * 		success: function(resp){
 * 			alert('Success; Data: ' + resp);
 * 		}
 * 	});
 *
 */
function ajaxRequestResponse(options) {

	function handleError(responseData){
		var errorCode, errorMessage, error = false;
		// if response is given by JSONResponse JAVA Object -> deprecated
		if (responseData.status) {
			if (responseData.status === 'FAIL') {
				error = true;
				errorCode = responseData.errorCode;
				errorMessage = responseData.result;
			} else {
				return responseData.result === "" || typeof responseData.result === "undefined" ? {} : responseData.result;
			}
		} else {
			if (responseData.errors) {
				error = true;
				errorCode = responseData.errors[0].code;
				errorMessage = responseData.errors[0].message;
			} else {
				return responseData === "" ? {} : responseData;
			}
		}

		if (error) {
			if (typeof serverErrorCodeMapping[errorCode] === 'object' && serverErrorCodeMapping[errorCode].length > 0) {
				$.each(serverErrorCodeMapping[errorCode], function (index, element) {
					$(element).showError(errorMessage, options.masterErrorMessage);
				});
			} else if (typeof serverErrorCodeMapping[errorCode] === 'string' && serverErrorCodeMapping[errorCode] === ':message:') {
				showErrorDialog(errorMessage);
			} else if (typeof serverErrorCodeMapping[errorCode] === 'ACCESS_DENIED') {
				showErrorDialog(errorMessage);
			} else if ("DETAIL_MONGO_DOCUMENT_NOT_FOUND" === errorCode){
				showDisplayedValueHasBeenUpdatedDialog(errorMessage);
			} else if ("CANNOT_REVALIDATE" === errorCode) {
				showCannotRevalidateInfoMessage(errorMessage);
			} else {
				showRequestFailedErrorDialog(errorCode, errorMessage);
			}
			if (typeof options.error === 'function') {
				options.error();
			}

			return false;
		}

		return true;
	}

	if (options.method === undefined)
        options.method = 'GET';
	if (options.async === undefined)
        options.async = false;
	if (options.cache === undefined)
        options.cache = false;
	if (options.securityTokenCheck === undefined)
        options.securityTokenCheck = false;
	if (options.masterErrorMessage === undefined)
        options.masterErrorMessage = '#master-error-message';
	if (options.appendBaseUrl === undefined)
        options.appendBaseUrl = true;
	if (options.contextVariable === undefined)
		options.contextVariable = null;

	var nestedUrl = (options.appendBaseUrl) ? baseUrl + options.url : options.url;

	if (options.securityTokenCheck === true && !(/securityToken/.test(nestedUrl))) {
		nestedUrl = appendSecurityToken(nestedUrl);
	}

	var hideAllErrorMessages = function() {
		// hide all error messages
		for (var prop in serverErrorCodeMapping) {
			if (serverErrorCodeMapping.hasOwnProperty(prop) && serverErrorCodeMapping[prop] !== ':message:') {
				var props = serverErrorCodeMapping[prop];
				var element;
				for (element in props) {
					$(serverErrorCodeMapping[prop][element]).hideError();
				}
			}
		}
	};

	$.ajax({
		contentType: options.contentType,
		dataType: options.dataType,
		method: options.method,
		url: nestedUrl,
		cache: options.cache,
		data: options.data,
		async: options.async,
		beforeSend: function(){
			_ajaxRequestsActive++;
			window.setTimeout(showSpinner, 1000);
		},
		success: function (responseData, status, xhr) {
			// Record google analytics hit upon success (only for domains)
			//if (nestedUrl.match(/^\/[a-z]+-domain/i)) {
			//	_gaq.push(['_trackPageview']);
			//}
			// hide all error messages
			hideAllErrorMessages();

			if (responseData === null) {
				if (typeof options.success === 'function') {
					options.success(null, options.contextVariable, status, xhr);
				}
				return;
			}
			// DEPRECATED - error should be always return as 4xx or 5xx HTTP status
			var response = handleError(responseData);
			if (response) {
				response = (responseData.status && options.dataType && options.dataType.toLowerCase() == 'json') ? eval('(' + response + ')') : response;  // if json, eval else return raw data
				if (typeof options.success == 'function') {
					options.success(response, options.contextVariable, status, xhr);
				}
			}

		},
		error: function (jqXHR, textStatus, errorThrown) {
			if (jqXHR.status == 403 || jqXHR.status == 405) {
				showAccessDeniedDialog('Forbidden', 'Access denied!');
				return;
			}

			// hide all error messages
			hideAllErrorMessages();

			var responseData;

			try {
				responseData = $.parseJSON(jqXHR.responseText);
				if (responseData == null) {
					showRequestFailedErrorDialog('AJAX_ERROR', 'Unable to send request to server.');
					return;
				}

				if (handleError(responseData)) {
					showRequestFailedErrorDialog('AJAX_ERROR', 'Unable to send request to server.');
				}
			}
			catch (e) {
				showRequestFailedErrorDialog('AJAX_ERROR', 'Unable to send request to server.');
			}
		},
		complete: function(){
			hideSpinner();
		}
	});
}

var _ajaxRequestsActive = 0;
function showSpinner() {
	if (_ajaxRequestsActive > 0) {
		activateSpinner();
	}
}

function hideSpinner() {
	_ajaxRequestsActive--;
	deactivateSpinner();
}

function activateSpinner() {
	$('#loading').fadeIn(100);
}

function deactivateSpinner() {
    $('#loading').fadeOut(100);
}

/*
 * GUID-like number generator 
 */
function guid() {
	return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());

	function s4() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	}
}

/*
 * Downloads file from specified URL with parameters
 * 
 * url : valid URL
 * parameters : array of JSON objects with key and value attributes
 * 
 * EXAMPLE:
 * downloadFile('https://my.url.com/download.jsp', [{ 'key' : 'name' , 'value' : 'abcd' }, { 'key' : 'userId' , 'value' : '1234' }]);
 */
function downloadFile(url, parameters, method) {
    var errorMsg = "The requested file has been deleted.";
    var ajaxParams = {};
	if (method == undefined)
        method = 'post';
	var inputs = new String();
	if (parameters != undefined && parameters != null) {
		for (var i = 0; i < parameters.length; i++) {
			inputs = inputs.concat('<input type="hidden" name="').concat(parameters[i].key).concat('" value="').concat(parameters[i].value).concat('" />');
            ajaxParams[parameters[i].key] = parameters[i].value;
		}
	}

    // Check the url whether status is ok, if not display dialog
    // Downside is an extra request
    $.ajax({
        type: method,
        url: url,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        // true enables traditional encoding for jQuery array since 1.4
        data: jQuery.param(ajaxParams, true),
        success: function () {
            jQuery('<form action="' + url + '" method="' + method + '">' + inputs + '</form>').appendTo('body').submit().remove();
        },
        error: function() {
            showErrorDialog(errorMsg);
        }
    });

	return false;
}
// Correct function to redirection
// TPM-1601 Fix

function redirectToLocation(url, params, method) {
	var urlParams = params.map(function(e){return e.key + '=' + e.value;}).join('&');
	window.location = url + '?' + urlParams;
}

// Don't use this function anymore. Its title is misleading.
function uopRedirect(url, parameters, method) {
	downloadFile(url, parameters, method);
}

function showDataItemBrowser() {
	ajaxRequestResponse({
		url: '/cm/dataItemBrowser',
		success: function (data) {
			var dialogDiv = $('<div id="dataItemDialog">')
				.appendTo(document.body);

			$(dialogDiv).empty().append(data).triggerCallback(function () {
				$('.diLink').on('click', function () {
					var val = $(this).html();
					var id = $(this).attr("id");
					$("#dataItemSelect").val(id);
					$('input[name=dataItemSelect_input]').val(val);
					$('#diForm').submit();
				});

				$('#diAccordion').initAccordion({
					collapsible: true
				});

                $('#filters-configured').prettyCheckable();
                $('#filters-my').prettyCheckable()
                $('#filters-all').prettyCheckable()

				$('#dataItemSelect').val('-1');
				$('#dataItemSelect').combobox({showValidationLabel: true});

				$('form#diForm').validation({
					submitHandler: function (form) {
						var value = $('#dataItemSelect').val();
						if (value == '-1' || value == undefined || value == '') {
							return false;
						}
						form.submit();
					}
				});
			});

			$(dialogDiv).initDialog({
				modal: true,
				title: 'Choose Data Item',
				width: 520,
				topCloseButton: {text: "Close"},
				buttons: {
					"Configure Selected Data Item": function () {
						// no action
					}
				},

				close: function (ev, ui) {
					$(dialogDiv).remove();
				}
			});

			$('div.ui-dialog-buttonset button').hide();
		}
	});
}

function showMasterDataMenuBrowser() {
	ajaxRequestResponse({
		url: '/master-data/menu',
		success: function (data) {
			var dialogDiv = $('<div id="dataItemDialog">')
				.appendTo(document.body);

			$(dialogDiv).empty().append(data).triggerCallback(function () {
				$('.diLink').on('click', function () {
					var val = $(this).html();
					var href = $(this).attr("href");
					$("#dataItemSelect").val(href);
					$('input[name=dataItemSelect_input]').val(val);
					window.location = baseUrl + "/" + href;
				});

				$('#diAccordion').initAccordion({
					collapsible: true
				});

				$('#add-filters').prettyCheckable();
				$('#no-filters').prettyCheckable();

				$('#dataItemSelect').val('-1');
				$('#dataItemSelect').combobox({showValidationLabel: true});

				$('#dataItemSelect').on('change', function(){
					if($(this).val() + "" !== "-1"){
						window.location = baseUrl + "/" + $(this).val();
					}
				});

			});

			$(dialogDiv).initDialog({
				modal: true,
				title: 'Choose Item to Configure',
				width: 520,
				topCloseButton: {text: "Close"},
				buttons: {
					"Configure Selected Item": function () {
						// no action
					}
				},

				close: function () {
					$(dialogDiv).remove();
				}
			});

			$('div.ui-dialog-buttonset button').hide();
		}
	});
}

function showCACMMenuBrowser(){
	ajaxRequestResponse({
		url: '/cacm/menu',
		success: function (data) {
			var dialogDiv = $('<div style="width: 100%;" id="dialogDiv"></div>')
				.appendTo(document.body).append(data);

			$(dialogDiv).initDialog({
				modal: true,
				title: 'CACM',
				width: 400,
				topCloseButton: {text: "Close"},
				close: function () {
					$(dialogDiv).remove();
				}
			});

			$('div.ui-dialog-buttonset button').hide();
		}
	});
}


function showFSKARMenuBrowser(){
	ajaxRequestResponse({
		url: '/fskar/menu',
		success: function (data) {
			var dialogDiv = $('<div style="width: 100%;" id="dialogDiv"></div>')
				.appendTo(document.body).append(data);

			$(dialogDiv).initDialog({
				modal: true,
				title: 'FSKAR',
				width: 400,
				topCloseButton: {text: "Close"},
				close: function () {
					$(dialogDiv).remove();
				}
			});

			$('div.ui-dialog-buttonset button').hide();
		}
	});
}


function showMonitoringMenuBrowser(){
	ajaxRequestResponse({
		url: '/monitoring/menu',
		success: function (data) {
			var dialogDiv = $('<div id="dialogDiv"></div>')
				.appendTo(document.body).append(data);

			$(dialogDiv).initDialog({
				modal: true,
				title: 'Choose Type Of Monitoring',
				width: 350,
				topCloseButton: {text: "Close"},
				close: function () {
					$(dialogDiv).remove();
				}
			});

			$('div.ui-dialog-buttonset button').hide();
		}
	});
}

/*
 * Fills the href attribute value of a link (link to a home page of EMFIP, e.g. www.entsoe.net)
 */
function addHomeLinkHref(aSelector) {
	// loads element by selector
	var headerLink = $(aSelector);
	// element found
	if (headerLink.length > 0) {
		// baseUrl check
		var urlForRedirect = baseUrl;
		if (typeof(baseUrl) == "undefined") {
			urlForRedirect = "#";
		}
		// fill the attribute
		headerLink.attr("href", "");
		headerLink.attr("href", urlForRedirect);
	}
}

function submitOnSelectedOptionChanged() {
	$('#diForm').submit();
}

/*
 * Format user name
 */
function getName(names) {
	if (names.length > 2) {
		return names[0] + " " + names[1] + ", " + names[2];
	}
	return names[0] + " " + names[1];
}

/*
 * Changes state of checkbox programmatically
 * 
 * originalCheckbox - original checkbox element
 * forceState - if true, checkbox will be checked
 */
function toggleCheckbox(originalCheckbox, forceState, triggerEvent) {
	var input = $(originalCheckbox);

	if (forceState != undefined) {
		// specific state is required
		if (forceState == true) {
			input.attr('checked', "checked");
			input.siblings("a").addClass('checked');
		}
		else {
			input.removeAttr("checked");
			input.siblings("a").removeClass('checked');
		}

		if (triggerEvent) {
			input.trigger('change');
		}

		return;
	}
	// toggle only
	if (input.attr('checked') == "checked") {
		input.removeAttr("checked");
	} else {
		input.attr('checked', "checked");
	}

	if (triggerEvent) {
		input.trigger('change');
	}

	input.siblings("a").toggleClass('checked');
}

/*
 * Changes value of combobox programmatically
 * 
 * originalComboID - id attribute of original combo
 * value - value to set
 * triggerChangeEvent - if true, change event will be triggered
 */
function setComboValue(originalComboID, value, triggerChangeEvent) {
	// get original select
	var select = $("#" + originalComboID);
	// change select value
	select.val(value);
	// change fake input value
	$("input[name=" + originalComboID + "_input]").val(select.find("option:selected").text()).attr('title', select.find("option:selected").text());
	// trigger change event if required
	if (triggerChangeEvent)
        select.trigger("change");
}

function getStatusTableColumnBody(value, itemType) {
	var cssClass = (itemType == "USER") ? "user-status-" : "di-status-";
	var cssValue = value.replace(/[ ]+/g, "").toUpperCase();
	return "<div class='td-item-status " + cssClass + cssValue + "'>" + value + "</div>";
}

function addDataViewToLocalStorage(domain) {

	if ($(this).find('a').attr('href') === undefined) return;

	if (!_loggedUser || !domain) return;

	var _dataViewName = $(this).find('a').html();

	var dataview = $(this).find('a').attr('href');

	for (var i = 0, found = false; i < 8; i++) {
		if (localStorage['emfip.' + _loggedUser + '.' + domain + '.' + i] === (dataview + '|' + _dataViewName)) {
			found = true;
		}
		if (found) {
			localStorage['emfip.' + _loggedUser + '.' + domain + '.' + i] = localStorage['emfip.' + _loggedUser + '.' + domain + '.' + (i * 1 + 1)];
		}
		if (localStorage['emfip.' + _loggedUser + '.' + domain + '.' + i] == 'undefined') {
			localStorage.removeItem('emfip.' + _loggedUser + '.' + domain + '.' + i);
		}
	}

	for (var i = 6; i >= 0; i--) {
		var rec = localStorage['emfip.' + _loggedUser + '.' + domain + '.' + i];
		if (rec) {
			localStorage['emfip.' + _loggedUser + '.' + domain + '.' + (i * 1 + 1)] = rec;
		}
	}

	localStorage['emfip.' + _loggedUser + '.' + domain + '.0'] = dataview + '|' + _dataViewName;
}

function ajaxSessionTimeout() {
	window.location.href = baseUrl + "/homepageLogin";

}

/*
 * Catch error code after session timeout and redirect to login page
 */
!function ($) {
	$.ajaxSetup({
		statusCode: {
			901: ajaxSessionTimeout
		}
	});
}(window.jQuery);

function minimizeText(text, length, direction) {
	text = text.trim();
	if (text.length > length) {
		return '<span title="' + text + '">' + text.substring(0, length - 3) + '...</span>';
	}

	return text;
}

function getUrlParameterByName(name) {
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.href);
	return results == null ? "undefined" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/**
 * Creates request param for remote datatable opening.
 * Options:
 *      start - int - default 0
 *      length - int - default 10
 *      sorting - array of strings - format [colnum,"asc/desc"] - default desc on 1st col
 *      filters - string - format "colnum|filter_value","..." - mandatory
 *      cols - int - number of table columns - mandatory
 */
function getDatatableRequestString(options) {
	if (options.start === undefined) options.start = 0;
	if (options.length === undefined) options.length = 10;
	if (options.sorting === undefined) options.sorting = '[1,"desc"]';

	var dtRequest = new Array();
	dtRequest.push('"iStart":' + options.start);
	dtRequest.push('"iLength":' + options.length);
	dtRequest.push('"aaSorting":[' + options.sorting + ']');
	dtRequest.push('"aoSearchCols":[' + options.filters + ']');
	dtRequest.push('"cols":' + options.cols);

	return "tableSettings={" + dtRequest.toString() + "}";
}

/*
 * Sets date picker value
 * Parameters:
 *   - inputID - string - ID of the original date picker input
 *   - serverString - string - time in server format, e.g. "01.01.2013 00:00|UTC|DAY"
 */
function setDatePickerValue(inputID, serverString) {
	$("#" + inputID).val(serverString);
	$("#user-friendly-input-" + inputID).val(serverToView(serverString));
}

/*
 This function make an String as a part of URL from some Array [key : value]
 */
function makeUrlFromExternalFiltersValue(options) {

	if (Object.prototype.toString.call(options) == '[object Array]') {
		var urlValues = "";
		$.each(options, function (i) {
			var object = options[i];
			if (object["value"] != null)
				urlValues = urlValues + object["key"].toString() + "=" + object["value"].toString() + "&";


		});
		return urlValues;
	}
};
/*
 opposite function to  makeUrlFromExternalFiltersValue(options)
 */
function makeArrayFromUrl(url) {

	var array = new Array();//new Array();
	if (url != "") {
		var m = url.match(/\?/);
		if (m !== null) {
			var url1 = url.replace(/.*\?|&tableSettings=\{.*\}*./g, "");
			url1 = url1.split("&");
			$.each(url1, function (i) {
				var object = url1[i];
				var e = object.match(/\=/);
				if (e !== null) {
					object = object.split("=");
					array[object[0].toString()] = object[1].toString();
				}
			});
		}
	}
	return array;

}

function parseQueryToObject(query, separator) {
	if (query.charAt(0) === "?") {
		query = query.substr(1);
	}

	var result = {};
	var entries = query.split("&");
	entries.forEach(function(entry) {
		var equalsIndex = entry.indexOf("=");
		var key = decodeURIComponent(entry.substr(0, equalsIndex));
		var strValue = decodeURIComponent(entry.substr(equalsIndex + 1)).replace(/\+/g, " ");
		var value = (separator)
				? strValue.split(separator)
				: [strValue];

		if (result.hasOwnProperty(key)) {
			if (!(result[key] instanceof Array)) {
				result[key] = [result[key]];
			}
			value.forEach(function(v) { result[key].push(v)});
		} else {
			if (value.length === 1) {
				result[key] = value[0];
			} else {
				result[key] = value;
			}

		}
	});
	return result;
}

function buildUrl(externalFilters, tableId) {
	var tableSettings = 'tableSettings=' + $('#' + tableId + '_settings').val();
	var parameters = window.location.search;
	if (tableSettings !== 'tableSettings=undefined') {
		var tableSettingsIndex = parameters.indexOf("tableSettings");
		if (tableSettingsIndex != -1) // is present
		// always actual table settings
			parameters = parameters.substring(0, tableSettingsIndex - 1); // delete & char
		// var url = parameters + "&" + tableSettings;
		if (externalFilters != null) {
			var url = (externalFilters == '') ? "?" + tableSettings : "?" + externalFilters + tableSettings;
			return url;
		} else {
			var url = (parameters == '') ? "?" + tableSettings : parameters + '&' + tableSettings;
			return url
		}

	} else {
		if (externalFilters !== 'externalFilters=undefined' && externalFilters !== null) {
			if (externalFilters !== '') {
				var url = "?" + externalFilters;
				return url;
			}
		}
	}
};

function getMapLenght(arr) {
	var size = 0;
	for (var i in arr) {
		size++;
	}
	return size;
};

function setUpTableSettings(oSettings, oApi) {
	// Store the interesting variables
	var i, iLen, bInfinite = oSettings.oScroll.bInfinite;
	var oState = {
		"iStart": (bInfinite ? 0 : oSettings._iDisplayStart),
		"iLength": oSettings._iDisplayLength,
		"aaSorting": $.extend(true, [], oSettings.aaSorting),
		"aoSearchCols": new Array(),
		"cols": oSettings.aoColumns.length
	};
// Update filter settings
	for (i = 0, iLen = oSettings.aoColumns.length; i < iLen; i++) {
		if (oSettings.aoPreSearchCols[i].sSearch != "")
			oState.aoSearchCols.push(i + "|" + oSettings.aoPreSearchCols[i].sSearch);
	}
// Create hidden input if it does not exist
	if ($("#" + oSettings.sTableId + "_settings").length == 0) {
		$("<input type='hidden' id='" + oSettings.sTableId + "_settings' />").appendTo($("#" + oSettings.sTableId).parent());
	}
// Fill hidden input
	$("#" + oSettings.sTableId + "_settings").val(oApi._fnJsonString(oState));
}

/**
 *  Formatting function for breaking up the excessively long lines in the text
 *  str:
 *      text to be processed
 *  n:
 *      max length of a line in the text
 *  return:
 *      text with separated long lines
 */
function splitTextByLineMaxWidth(str, n) {
    return str.replace(RegExp("(\\w{" + n + "})(\\w)", "g"), function(all, text, char){
        return text + "<br />" + char;
    });
}

function getCookie(cookieName) {
	var name = cookieName + "=";
	var cookies = document.cookie.split(';');
	for (var i = 0; i < cookies.length; i++) {
		var c = cookies[i].trim();
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires="+d.toUTCString();
	document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
}

(function () {
	jQuery.fn.isChildOverflowing = function (child) {
		var p = jQuery(this).get(0);
		var el = jQuery(child).get(0);
		return (el.offsetTop < p.offsetTop || el.offsetLeft < p.offsetLeft) ||
			(el.offsetTop + el.offsetHeight > p.offsetTop + p.offsetHeight || el.offsetLeft + el.offsetWidth > p.offsetLeft + p.offsetWidth);
	}
})(jQuery);

function detectBrowser() {
	if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
		return "chrome";
	}

	if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
		return "firefox";
	}

    if (navigator.userAgent.toLowerCase().indexOf('edge') > -1) {
        return "edge";
    }

    if (navigator.userAgent.toLowerCase().indexOf('opera') > -1) {
        return "opera";
    }

	var ua = navigator.userAgent;
	var re = null;
	if (navigator.appName == 'Microsoft Internet Explorer') {
		re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
	} else if (ua.indexOf('rv:1') > -1) {
		// new UA string for IE on Win8.1 and later
		// https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx#ie11
		re = new RegExp("rv\:([0-9]{1,}[0-9]{0,})");
	}
	if (re != null && re.exec(ua) != null) {
		var rv = parseFloat(RegExp.$1);
		if (rv > 0) {
			return 'IE' + rv;
		}
	}

	return "safari";
}

function detectBrowserVersion() {
    var browser = detectBrowser();
    var raw;
    if (browser === 'chrome') {
        raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
        return raw ? parseInt(raw[2], 10) : false;
    } else if (browser === 'firefox') {
        raw = navigator.userAgent.match(/Firefox\/(.*)$/);
        if (raw && raw.length > 1) {
            return raw[1];
        }
    } else if (browser === 'safari') {
        if(navigator.userAgent) {
	        var regex = navigator.userAgent.match(/Version\/(\d*).* Safari/);
	        if(regex && regex[1]) {
		        return regex[1];
	        } else {
		        return 0;
	        }
        }
    }
}

function fullReplaceTags(str) {
	var tagsToReplace = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'\n': '<br/>'
	};

	function replaceTag(tag) {
		return tagsToReplace[tag] || tag;
	}

	return str.replace(/[&<>\n]/g, replaceTag)
}

/**
 * Maps array of objects to map with key defined in input argument key.
 * Example of use:
 *    * We have a array: var array = [{id: 1, name: "one"}, {id: 2, name: "two"}, ...];
 *    *                  var map = array.objectsToMap('id');
 *    * We gets something like this: {1: {id: 1, name: "one"},
 *    *                               2: {id: 2, name: "two"},
 *    *                                    ... }
 *    Note: this source has been compiled from coffeeScript
 */
Array.prototype.objectsToMap = function(key) {
	var map, object, _i, _len;
	map = {};
	for (_i = 0, _len = this.length; _i < _len; _i++) {
		object = this[_i];
		if (typeof object === "object" && (object[key] != null)) {
			map[object[key]] = object;
		}
	}
	return map;
};

/**
 * Function for escaping html characters on json object. e.g. on Rich DI views
 */
function escapeJson(json) {
  return JSON.parse(JSON.stringify(json).replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/'/g, "&#039;"));
}
/**
 * Function for reverse escaping of '<br/>' tag in the json object.
 */
function reverseBRTagEscapeInJson(json) {
	return JSON.parse(JSON.stringify(json).replace(/&lt;br\/&gt;/g, "<br/>"))
}

function escapeHtml(unsafe) {
	return unsafe
	.replace(/&/g, "&amp;")
	.replace(/</g, "&lt;")
	.replace(/>/g, "&gt;")
	.replace(/"/g, "&quot;")
	.replace(/'/g, "&#039;");
}