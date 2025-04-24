var beforeDVContentLoad = function () {
};

var tableInitialization = function () {
	dataViewTable = $(".data-view-table").dataTable({
		"bPaginate": false,
		"bLengthChange": false,
		"bFilter": false,
		"bSort": false,
		"bInfo": false,
		"bAutoWidth": false
	});
};

var graphInitialization = function () {
	if (dataViewName == "Actual Generation per Production Type") {
		// Makes more room for graph with long legend
		$('#dv-data-graph-content').height($('#dv-data-graph-content').height() + chart.chartsCount * 26);

	}

	drawChart('dv-data-graph-content', chart);
};

var mapInitialization = function () {
	$('#dv-data').children().wrapAll('<div class="dv-map-padding"></div>');
	$('#map-time-combo').combobox();
};

function updateDINames() {
	if (typeof dataItemsAsJSON !== 'undefined') {
		$('#dv-data-item-names').empty();
		$.each(dataItemsAsJSON, function (index, element) {
			$('#dv-data-item-names').append('<h6 id="dataItemName' + element.id + '" data-id="' + element.id + '">' + element.name + '</h6>');
		});
	}
}

function fireUopFilterChangedEvent(query) {
	var changeEvent = document.createEvent("Event");
	changeEvent.initEvent("uopFilterChanged", true, true);
	changeEvent.form = parseQueryToObject(query, '!');
	document.dispatchEvent(changeEvent);
}

// Time change & timeshift variables
var timestamp;
var timestampTitle;
var timeShift = null;
var timeZoneBeforeChange;
//var valueHistoryParams = {};
var triggeredEvent = false;
var timeStep = 1;
var sourceDataLength;


// add icon which focus on Knowledge base toolbox
function showKbIcon() {
	$('#dataViewName').after('<a id="kb-link"><div id="dv-knowledge-base-focus-icon" class="datepicker-help-icon"></div></a>');
	var $kbLink = $('#kb-link');
	$kbLink.attr("title", dvInfo);
	$kbLink.attr("href", kbUrl);
}

var documentInitialize = function () {
	selectTab();

	pageLoad();
	fireUopFilterChangedEvent($("#selectedFilters").serialize());
	showKbIcon();

	(function (window) {

		// Bind to StateChange Event
		History.Adapter.bind(window, 'statechange', function (data) {
			if (pushState) {
				pushState = false;
			} else {
				if ($.browser.msie && $.browser.version < 10) {
					//Reload on click back
					var url = History.getState().url;
					url = url.replace(/show/g, "showIE");
					ajaxRequestResponse({
						appendBaseUrl: false,
						contentType: "application/json;charset=UTF-8",
						url: url,
						async: false,
						success: function (html) {
							// html = whole page html
							var dataViewContent = html.split('<section>')[1].split("</section>")[0];
							$("section").empty().html(dataViewContent);
							pageLoad();
						}
					});
				}
				else window.location.reload();
			}
		});
	})(window);
	if ($('#dv-heading li').length > 0) {
		//hide fullscreen option when accessing graph from dashboard
		var contentID = $('#dv-heading li').find("img").attr("id").replace("image", "data");

		var viewType = getUrlParameterByName('viewType');
		if (contentID == "dv-data-table" && $("#dv-show-fullscreen").is(":visible") && (viewType === 'GRAPH' || viewType === 'MAP')) {
			$("#dv-show-fullscreen").hide();
		}
	}
};

if (detectBrowser() === 'chrome') {
	$(window).load(documentInitialize);
} else {
	$(document).ready(documentInitialize);
}

function mergeDuplicatedCellsInColumn(columnIndex) {

	var repeatedValues = $("table.data-view-table tbody tr td:nth-child(" + columnIndex + ")").toArray()
		.map(function (a) {
			return $(a).text()
		})
		.map(function (name) {
			return {
				count: 1,
				name: name
			}
		})
		.reduce(function (a, b) {
			a[b.name] = (a[b.name] || 0) + b.count;
			return a
		}, {});

	var keys = Object.keys(repeatedValues);
	for(var i=0, keysLen = keys.length; i<keysLen; i++) {
		if(repeatedValues[keys[i]] > 1) {
			$("table.data-view-table td:contains('"+keys[i]+"'):first").attr("rowspan", repeatedValues[keys[i]]).addClass("with-rowspan");
			$("table.data-view-table td:contains('"+keys[i]+"'):not(.with-rowspan)").remove();
		}
	}

	$(".with-rowspan").removeClass("with-rowspan");
}

// date picker restriction
function datePickerRestrict(picker, useDateRestriction) {

	var datePickerTypeToResolution = {
		"DAY": 'days',
		"DAYTIME": 'days',
		"DAYTIMERANGE": 'days',
		"WEEK": 'weeks',
		"MONTH": 'months',
		"QUARTER": 'quarter',
		"YEAR": 'years'
	};

	var $from = $('#dv-date-from');
	var $to = $('#dv-date-to');

	if ($to.length === 0) {
		return; // datepicker dv-date-to is not present (time filter is not range)
	}

	var datePickerType = $from.val().match(/[A-Z]*$/)[0];

	var timeZone = $from.val().match(/(UTC)|(CET)|(WET)|(EET)|(GET)|(Asia\/Tbilisi)/)[0];

	var dateFrom = $from.val().match(/^[0-9. :]*/)[0];
	var dateTo = $to.val().match(/^[0-9. :]*/)[0];

	dateFrom = moment(dateFrom, 'DD.MM.YYYY HH:mm', true);
	dateTo = moment(dateTo, 'DD.MM.YYYY HH:mm', true);

	var $restriction = $('#dv-date-restriction');
	if ($restriction.length && useDateRestriction) {
		var dateRestriction = $restriction.val().match(/^[0-9. :]*/)[0];

		var restrictionType = datePickerTypeToResolution[datePickerRestrictionType];
		var dateRestrictionFrom = moment(dateRestriction, 'DD.MM.YYYY HH:mm', true).startOf(restrictionType);
		var dateRestrictionTo = moment(dateRestriction, 'DD.MM.YYYY HH:mm', true).endOf(restrictionType).add(1, 'minute');

		setDate(dateFrom, 'dv-date-from', dateRestrictionFrom);
		setDate(dateTo, 'dv-date-to', dateRestrictionTo);
	}
	if (dateTo.isBefore(dateFrom)) {
		if ($(picker).attr('id') == 'dv-date-from') { // dateFrom triggered change event
			dateTo = moment(dateFrom);
			dateTo.add(datePickerTypeToResolution[datePickerType], 1);
			setDatePickerValue('dv-date-to', dateTo.format('DD.MM.YYYY HH:mm') + "|" + timeZone + "|" + datePickerType);
		} else {
			dateFrom = moment(dateTo);
			dateFrom.subtract(datePickerTypeToResolution[datePickerType], 1);
			setDatePickerValue('dv-date-from', dateFrom.format('DD.MM.YYYY HH:mm') + "|" + timeZone + "|" + datePickerType);
		}
	}
	function setDate(target, targetClass, newDate) {
		target = moment(newDate);
		setDatePickerValue(targetClass, target.format('DD.MM.YYYY HH:mm') + "|" + timeZone + "|" + datePickerType);
	}
}

function showUnsupportedBrowserWarning() {
    var cookieName = 'emfip-unsupported-browser';

    if (getCookie(cookieName)) {
        return;
    }

    var currentBrowser = detectBrowser();
    var currentVersion = detectBrowserVersion();

    var showDialog = false;

    if (currentBrowser === 'opera') {
        currentBrowser = 'Opera';
        showDialog = true;

    } else if (currentBrowser === 'edge') {
        currentBrowser = 'Microsoft Edge';
        showDialog = true;

    } else if (currentBrowser === 'firefox') {
        showDialog = currentVersion < 38;
        currentBrowser = 'Mozilla Firefox ' + currentVersion;

    } else if (currentBrowser === 'chrome') {
        showDialog = currentVersion < 43;
        currentBrowser = 'Google Chrome ' + currentVersion;

    } else if (currentBrowser === 'safari') {
        showDialog = currentVersion < 8;
        currentBrowser = 'Safari ' + currentVersion;
    } else if (! /(IE10)|(IE11)/.test(currentBrowser)) {
        var version = currentBrowser.match(/\d+(?!\d+)/);
        if (version !== null) {
            currentBrowser = 'Internet Explorer ' + version[0];
        }
        showDialog = true;
    }

    if (showDialog) {
        var warningMessage = 'Transparency platform is not optimized for browser ' + currentBrowser +
            ' please try Mozilla Firefox 38, Google Chrome 43, Safari 8, Internet Explorer 10 or Internet Explorer 11.';
        showErrorDialog(warningMessage);
        setCookie(cookieName, true, 100*365);
    }
}

function dataviewTypeChange() {
	beforeDVContentLoad();

	var section = $(this).children('img').attr('id').match(/(table)|(graph)|(map)/)[0];
	if ((section == 'table' & !tableEnabled) | (section == 'graph' & !graphEnabled) | (section == 'map' & !mapEnabled))
		return;

	$('#dv-heading li').removeClass("selected");
	$("div.dv-data-content").hide();
	$(this).addClass('selected');
	var contentID = $(this).find("img").attr("id").replace("image", "data");

	if (contentID == "dv-data-table" && $("#dv-show-fullscreen").is(":visible") == false) {
		$("#dv-show-fullscreen").fadeToggle('fast');
	} else if (contentID != "dv-data-table" && $("#dv-show-fullscreen").is(":visible")) {
		$("#dv-show-fullscreen").fadeToggle('fast');
	}

	var viewType = contentID.match(/(table)|(graph)|(map)/)[0].toUpperCase();

	$('#viewType').val(viewType);

	if (viewType == 'MAP') {
		$('#dv-business-filters').css('display', 'none');
		$('#dv-main-content').css('margin-left', '0px');
	} else {
		$('#dv-business-filters').css('display', 'block');
		$('#dv-main-content').css('margin-left', '223px');
	}

	changeFilter(this);
}

function pageLoad() {
    //TPI-5777 Show unsupported browser dialog if user use old version of browser.
    showUnsupportedBrowserWarning();

	var effectIn, effectOut;

	if (document.documentMode) { // IE8 detect. If '8' -> IE8, if undefined -> "The Browser"
		effectIn = 'none';
		effectOut = 'none';
	} else {
		effectIn = 'fadeIn';
		effectOut = 'fadeOut';
	}
	//Remove all unused hidden input for spring checkboxes
	$("input[type=hidden][value='on']").remove();
	var imageMinus = baseUrl + '/resources/images/icons/Icon_Minus.png';
	var imagePlus = baseUrl + '/resources/images/icons/Icon_Plus.png';

	// show-hide div & change image
	$('#dv-business-filters .dv-filter-heading').has('img').click(function () {

		var filterContent = $(this).next('div.dv-filter-content');
		filterContent.slideToggle('fast');

		$(this).toggleClass('expanded');

		if ($(this).hasClass('expanded')) {
			$(this).children('img').attr('title', 'Collapse').attr('src', imageMinus);
			$(this).tooltip({'content': 'Collapse', show: {delay: 500, effect: effectIn}, hide: {effect: effectOut}, position: {my: 'left-15 top+5'}, tooltipClass: 'help-tooltip'});
		} else {
			$(this).children('img').attr('title', 'Expand').attr('src', imagePlus);
			$(this).tooltip({'content': 'Expand', show: {delay: 500, effect: effectIn}, hide: {effect: effectOut}, position: {my: 'left-15 top+5'}, tooltipClass: 'help-tooltip'});
		}
	});

	$("a#dv-show-fullscreen").click(function () {
		var afterLoadFullScreenScript = "var datePickerRange = false;var datePickerRestrictionType = false;var setFullScreen = true;var datePickerType = '';$(window).load(function(){$('span[onclick]').prop('onclick', null);$('.button-column').remove();$('.dt-row-expanded').removeClass('dt-row-expanded')});";
		var html = "<html>" + $("html").html() + "</html>";

		// remove requirejs processed includes
		html = html.replace(/<script[^>]*data-requiremodule="[^"]+"[^>]*><\/script>/ig, "");
		html = html.replace(/<body[^>]*>/ig, "<body>");

		var htmlArray = html.split("<body>");
		var table = htmlArray[1].split('<!-- Data Table -->')[1];
		var $table = $(table);

		$table.find('.dt-detail-row, .data-view-detail-table').remove();

		table = '';
		$tableWrapper = $table.find('.dataTables_wrapper').length == 0 ? $table.find('.data-view-table').not('.dv-fixed-first-column').parent() : $table.find('.dataTables_wrapper');

		$tableWrapper.addClass('glow-box').each(function (index, element) {
			$element = $(element);
			$element.find('.dv-fixed-first-column-wrapper').remove();
			table += $element.html();
		});

		var scripts = '';
		$(htmlArray[1]).find('script').each(function (index, element) {
			scripts = scripts + $(element).html();
		});

		var fullScreen = window.open();
		$(fullScreen.document).ready(function () {
			fullScreen.document.write(htmlArray[0].replace('</head>', '') + "<script type='text/javascript'>" + scripts + "</script><script type='text/javascript'>" + afterLoadFullScreenScript + "</script></head><body style='width: 100%;' class='fullscreen'>" + table + "</body></html>");
			var currentBrowser = detectBrowser();
			if (currentBrowser !== 'chrome' && currentBrowser !== 'firefox') {
				// IE workaround for disabling links
				fullScreen.history.go(0);
			}
		});
		fullScreen.document.close();
		return false;
	});

	if ($('#viewType').val()) {
		$('#dv-heading li').removeClass('selected');
		$('#dv-image-' + $('#viewType').val().toLowerCase()).parent().addClass('selected');
		if (window.IS_MOBILE_VERSION) {
			$('#dv-business-filters').css('display', 'block');
		}
		else {
			if ($('#viewType').val() == 'MAP') {
				$('#dv-business-filters').css('display', 'none');
				$('#dv-main-content').css('margin-left', '0px');
				$("#dv-show-fullscreen").hide();
			} else {
				$('#dv-business-filters').css('display', 'block');
				$('#dv-main-content').css('margin-left', '223px');
			}
			if ($('#dv-business-filters').html().trim() == '') {
				$('#dv-main-content').css('margin-left', '0px');
			}
		}
	}

	// click on icon of show
	$('#dv-heading li').click(dataviewTypeChange);

	// Setting table as default view
	//$('#dv-heading li:first').addClass('selected');

    if ($('#dv-time-filter').length) {
        //set correct type of datepickers
        if (typeof datePickerType != 'undefined') {
            if ($('#dv-date-from').length != 0) {
                var fromValue = $('#dv-date-from').val();
                fromValue = fromValue.match(/^([0-9. :]*)\|.{3}\|/);
                if (fromValue) {
                    fromValue = fromValue[0] + datePickerType.toUpperCase();
                    $('#dv-date-from').val(fromValue);
                }
            }
            if ($('#dv-date-to').length != 0) {
                var toValue = $('#dv-date-to').val();
                toValue = toValue.match(/^([0-9. :]*)\|.{3}\|/);
                if (toValue) {
                    toValue = toValue[0] + datePickerType.toUpperCase();
                    $('#dv-date-to').val(toValue);
                }
            }
        }

        // cannot have restriction and dateTimeRange at the time
        // fix - call showDatePicker(...) after branching
        if (datePickerRestrictionType) {
            var pickerRestriction = $('#dv-date-restriction');
            var pickerFrom = $('#dv-date-from');
            var pickerTo = $('#dv-date-to');

            // copy 'from' date string and replace date type
            var val = pickerFrom.val();
            var valParts = val.split("|");
            valParts[2] = datePickerRestrictionType;
            val = valParts.join("|");
            pickerRestriction.val(val);

            pickerRestriction.showDatePicker({
                type: datePickerRestrictionType,
                range: false,
                arrows: true,
                timeStep: timeStep
            });
            pickerFrom.showDatePicker({
                type: datePickerType,
                range: false,
                arrows: true,
                timeStep: timeStep,
                changeYear: true,
                beforeShowDay: $.datepicker.noWeekends
            });
            pickerTo.showDatePicker({
                type: datePickerType,
                range: false,
                arrows: true,
                timeStep: timeStep,
                changeYear: true,
                beforeShowDay: $.datepicker.noWeekends
            });

            // Register event handlers (onSelect not working here)
            pickerRestriction.change(
                function () {
                    datePickerRestrict(pickerFrom, true);
                    datePickerRestrict(pickerTo, true);
                });
            pickerFrom.change(
                function () {
                    datePickerRestrict(pickerFrom);
                });
            pickerTo.change(
                function () {
                    datePickerRestrict(pickerTo);
                });

            if (datePickerRestrictionType === 'QUARTER' && location.search == '') {
                $("[id^=quarterpicker-this-quarter]").click();
            }

            var textAlignment = "display: inline-block; width: 40px";
            $("<span style='" + textAlignment + "'>From</span>").insertBefore('#originalinput-wrapper-user-friendly-input-dv-date-from');
            $("<span style='" + textAlignment + "'>To</span>").insertBefore('#originalinput-wrapper-user-friendly-input-dv-date-to');
            $('#originalinput-wrapper-user-friendly-input-dv-date-from').prop('title', 'From');
            $('#originalinput-wrapper-user-friendly-input-dv-date-to').prop('title', 'To');
        } else if (datePickerRange) {

            if (datePickerType === "dayTimeRange") {
                var dateFormat = "DD.MM.YYYY HH:mm";
                var offsetParam = getUrlParameterByName('datepicker-day-offset-select-dv-date-from_input');
                var offsetVal = (offsetParam === 'undefined') ? 0 : translateOffset(offsetParam);

                // Correct end date for range
                var startDate = $("#dv-date-from").val().split('|')[0];
                var endDateArray = $("#dv-date-from").val().split('|');
                var momentStart = moment(startDate, dateFormat, true);
                var endDateStr = momentStart.add(Math.abs(offsetVal), 'd').format(dateFormat);

                endDateArray[0] = endDateStr;

                $("#dv-date-to").val(endDateArray.join('|'));

                $(null).showDatePicker({
                    inputFrom: '#dv-date-from',
                    inputTo: '#dv-date-to',
                    type: datePickerType,
                    range: true,
                    arrows: true,
                    dayOffset: datePickerOffset,
                    dayOffsetNegative: dayOffsetNegative,
                    dayOffsetCurrentValue: offsetVal,
                    timeStep: timeStep
                });
            } else {
                $('#dv-date-from').showDatePicker({
                    type: datePickerType,
                    range: false,
                    arrows: true,
                    timeStep: timeStep
                });
                $('#dv-date-to').showDatePicker({
                    type: datePickerType,
                    range: false,
                    arrows: true,
                    timeStep: timeStep
                });

                // Register event handlers ( onSelect not working here :( )
                $("#dv-date-from").change(
                    function () {
                        datePickerRestrict($(this));
                    });

                $("#dv-date-to").change(
                    function () {
                        datePickerRestrict($(this));
                    });

                var textAlignment = "display: inline-block; clear: left; width: 40px";
                $("<span style='" + textAlignment + "'>From</span>").insertBefore('#originalinput-wrapper-user-friendly-input-dv-date-from');
                $("<span style='" + textAlignment + "'>To</span>").insertBefore('#originalinput-wrapper-user-friendly-input-dv-date-to');
                $('#originalinput-wrapper-user-friendly-input-dv-date-from').prop('title', 'From');
                $('#originalinput-wrapper-user-friendly-input-dv-date-to').prop('title', 'To');
            }
        } else {
            $('#dv-date-from').showDatePicker({
                type: datePickerType,
                range: false,
                arrows: true,
                timeStep: timeStep
            });
        }
    }

	$("div.dv-filter-hierarchic-wrapper").each(function () {
		$(this).find("div.dv-sub-filter-hierarchic-wrapper").hide();
	});

	$("#dateTime\\.timezone").on("change", function (e) {
		changeTimeZone();

		if (dataViewType == "MAP") {
			loadHours();
			reloadMap();
			e.preventDefault();
			return false;
		} else {
			changeFilter(this);
		}


	}).combobox({
		setOriginalWidth: true,
		noSorting: true
	});

	// custom checkbox label click event handler
	$("div.dv-business-filter").find('label').each(function () {
		$(this).click(function (e) {
			e.preventDefault();
			var nativeLabel = $(this).siblings("div.prettycheckbox").find("a");
			if (nativeLabel.length) {
				nativeLabel.trigger("click");
			} else {
				var outsideLabel = $(this).parents("div.dv-filter-checkbox").find("a");
				outsideLabel.trigger("click");
			}

		});                                                                                            //            display: none   // ;-) with line #179
	});                                                                                                //                 |
	//                                                                                                                    v
	$('.dv-filter-hierarchic-wrapper > .dv-filter-checkbox').append('<div class="dv-business-filter-heading-image" style=""></div>');

	$("div.dv-filter-content").each(function () {
		var hasSingleSelectClass = $(this).hasClass("dv-single-select-checkboxes");
		var hasMultipleSelectClass = $(this).hasClass("dv-multiple-select-checkboxes");
		var elementId = $(this).prop("id");

		$(this).find('input[type=checkbox]').each(function () {
			var checkboxOptions = {
				eventType: "click"
			};

			if (hasSingleSelectClass)
				checkboxOptions.singleSelectParentSelector = 'div#' + elementId;
			if (hasMultipleSelectClass) {
				checkboxOptions.multipleSelectParentSelector = 'div#' + elementId;
			}

			if (hasMultipleSelectClass) {
				checkboxOptions.multipleSelectParentSelector = 'div#' + elementId;
			}

			$(this).prettyCheckable(checkboxOptions);

			if ($(this).is(":checked"))
				colorizeFilter(this);
		});
	});
	/*.triggerCallback(function(){
	 $('.dv-business-filter-heading-image').each(function(index, element){
	 setTimeout(function(){$(element).fadeIn('fast')},index * 40);
	 });
	 }); */

	$('.tabs ul li').click(function () {
		if ($(this).hasClass('selected')) {
			return;
		}
		$('#areaType').val($(this).attr('name'));
		$('#atch').val('true');
		var form = $("#selectedFilters").serialize();
		if (typeof additionallyParameters == 'string') {
			form += '&' + additionallyParameters;
		}
		if (!detectBrowser() == "IE8") {
			pushState = true;
			if (document.documentMode * 1 < 10) {
				// for MSIE 8 and 9 push only query string
				History.pushState(null, "Data View", '?' + decodeURI(form));
			}
			else {
				History.pushState(null, "Data View", window.location.origin + window.location.pathname + '?' + form);
			}
		}
		ajaxRequestResponse({
			method: "GET",
			async: false,
			url: ajaxUrl,
			data: form,
			success: function (html) {
				var dataViewContent = html.split('<section>')[1].split("</section>")[0];
				$("section").empty().html(dataViewContent);
				$('#atch').val('false');
				pageLoad();
				selectTab();
				showKbIcon();
			}
		});
	});

	$("div.dv-filter-checkbox").find("a").on("click", function () {

		if (!triggeredEvent && $(this).parents('.dv-business-filter-primary').length != 0) {
			toggleCheckbox($('#dv-check-all-filters'), false);
		}

		triggeredEvent = false;

		if ($('#dv-check-all-filters').length > 0 && $('#dv-check-all-filters').is(':checked')) {
			return;
		} else if ($('#dv-check-all-filters').length > 0) {
			$('#dv-check-all-filters').parents('.dv-filter-checkbox').removeClass('dv-filter-hierarchic-wrapper dv-filter-checkbox-selected');
		}


		/*        $('div.dv-sub-filter-hierarchic-wrapper').find('a[class=checked]').removeClass('checked');
		 $('div.dv-sub-filter-hierarchic-wrapper').find('input[type=checkbox]:checked').removeAttr("checked");*/

		var val = $(this).parent().find('input[type=checkbox]').val();
		if (val.match(/.*(SINGLE)/) || val.match(/.*(MULTI)/)) {
			if ($("div.dv-filter-hierarchic-wrapper").hasClass("border")) {
				$("div.dv-filter-hierarchic-wrapper.border").removeClass("border").find('a').removeClass('partially-checked');
			}
			$("div.dv-sub-filter-hierarchic-wrapper:has(:visible)").hide();
			$(this).closest("div.dv-filter-hierarchic-wrapper").addClass("border");
			$(this).closest("div.dv-filter-hierarchic-wrapper").find('div.dv-sub-filter-hierarchic-wrapper').show("fast");
			if (val.match(/.*(SINGLE)/)) {
				$(this).closest("div.dv-filter-hierarchic-wrapper").find("div.dv-sub-filter-hierarchic-wrapper > .dv-filter-checkbox:first-child a").addClass("checked");
				$(this).closest("div.dv-filter-hierarchic-wrapper").find("div.dv-sub-filter-hierarchic-wrapper  > .dv-filter-checkbox:first-child input[type=checkbox]").trigger("click");
			}
			if (val.match(/.*(MULTI)/)) {
				$('div.dv-sub-filter-hierarchic-wrapper').find('a[class=checked]').removeClass('checked').removeClass('partially-checked');
				$('div.dv-sub-filter-hierarchic-wrapper').find('input[type=checkbox]:checked').removeAttr("checked");
				$(this).closest("div.dv-filter-hierarchic-wrapper").find("div.dv-sub-filter-hierarchic-wrapper > .dv-filter-checkbox a").addClass("checked");
				$(this).closest("div.dv-filter-hierarchic-wrapper").find("div.dv-sub-filter-hierarchic-wrapper > .dv-filter-checkbox input[type=checkbox]:not(:last)").attr("checked", true);
				$(this).closest("div.dv-filter-hierarchic-wrapper").find("div.dv-sub-filter-hierarchic-wrapper  > .dv-filter-checkbox input[type=checkbox]").last().trigger("click");
			}
		}
		if ($("div.dv-filter-hierarchic-wrapper").hasClass("border")) {
			$("div.dv-filter-hierarchic-wrapper > div.dv-filter-checkbox-selected").removeClass("dv-filter-checkbox-selected");
			$("div.dv-filter-hierarchic-wrapper > div.dv-filter-checkbox a").removeClass("checked");
			$("div.dv-filter-hierarchic-wrapper.border > div.dv-filter-checkbox").addClass("dv-filter-checkbox-selected");
			$("div.dv-filter-hierarchic-wrapper.border > div.dv-filter-checkbox a").addClass("checked")
		} else {
			colorizeFilter(this);
		}

		var totalCunt = $(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-sub-filter-hierarchic-wrapper').find('input[type="checkbox"]').length;
		var checkedCunt = $(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-sub-filter-hierarchic-wrapper').find('input[type="checkbox"]:checked').length;

		$(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-filter-checkbox').find('a').removeClass('checked partially-checked');

		if (checkedCunt > 0 && checkedCunt < totalCunt) {
			$(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-filter-checkbox').find('a').addClass('partially-checked');
		} else if (checkedCunt > 0) {
			$(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-filter-checkbox').find('a').addClass('checked');
		}

	});

	$('div.dv-sub-filter-hierarchic-wrapper').find('a.checked').each(function () {
		var totalCunt = $(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-sub-filter-hierarchic-wrapper').find('input[type="checkbox"]').length;
		var checkedCunt = $(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-sub-filter-hierarchic-wrapper').find('input[type="checkbox"]:checked').length;

		$(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-filter-checkbox').find('a').removeClass('checked partially-checked');

		if (checkedCunt > 0 && checkedCunt < totalCunt) {
			$(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-filter-checkbox').find('a').addClass('partially-checked');
		} else if (checkedCunt > 0) {
			$(this).parents('.dv-filter-hierarchic-wrapper').children('.dv-filter-checkbox').find('a').addClass('checked');
		}
	});

	if ($('div.dv-sub-filter-hierarchic-wrapper').find('a.checked').length == 0 && $('.dv-business-filter-primary #dv-check-all-filters').length > 0) {
		toggleCheckbox($('.dv-business-filter-primary input#dv-check-all-filters'), true, false);
		$('.dv-business-filter-primary input#dv-check-all-filters').closest('.dv-filter-checkbox').addClass('dv-filter-hierarchic-wrapper dv-filter-checkbox-selected border');
	}

	$("#dv-date-from, #dv-date-to, #dv-date-restriction").on("change", function (e) {
		if (dataViewType == "MAP") {

			loadHours();
			reloadMap();
			e.preventDefault();
			return false;
		} else {
			changeFilter(this);
		}
	});

	afterLoadDataViewContentProcess();

	if ($('div.dv-sub-filter-hierarchic-wrapper').find('a').hasClass("checked")) {
		$("div.dv-filter-checkbox-selected").removeClass("dv-filter-checkbox-selected");
		var element = $('div.dv-sub-filter-hierarchic-wrapper').find('a[class=checked]').closest('div.dv-filter-hierarchic-wrapper');
		element.addClass("border");
		element.find('div.dv-sub-filter-hierarchic-wrapper').show("fast", scrollToPosition);
	}

	$("input[type=checkbox]:checked").closest("div.dv-filter-hierarchic-wrapper.border").find("div.dv-filter-checkbox a:first").addClass("checked");
	$("input[type=checkbox]:checked").closest("div.dv-filter-hierarchic-wrapper.border").find("div.dv-filter-checkbox:first").addClass("dv-filter-checkbox-selected");
	$("input[type=checkbox]:checked").closest("div.dv-filter-hierarchic-wrapper.border").find("div.dv-filter-checkbox:last").removeClass("dv-filter-checkbox-selected");

	// Export menu section
	var slideToggleExportMenuTime = 150;

	// Set timezone for summer/winter timeshift
	timeZoneBeforeChange = $('#dateTime\\.timezone').val();

	// Timezone storing mechanism for summer/winter timeshift
	$('div[class=time-zone-select] input[class~=ui-combobox-toggle]').on('click', function () {
		timeZoneBeforeChange = $('#dateTime\\.timezone').val();
	});

	$('#dv-export-menu-wrapper').on('click', function (event) {
		$('#dv-export-menu').css({
			left: $('#dv-export-menu-wrapper')[0].offsetLeft,
			top: $('#dv-export-menu-wrapper')[0].offsetTop + $('#dv-export-menu-wrapper').height() + 5
		}).slideToggle(slideToggleExportMenuTime);
		return false;
	});

	var dvExportMenu = $('#dv-export-menu');

	const extractFilenameFromHeaders = (xhr) =>  {
		let filename = "";
		let disposition = xhr.getResponseHeader('Content-Disposition');
		if (disposition && disposition.indexOf('attachment') !== -1) {
			const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
			let matches = filenameRegex.exec(disposition);
			if (matches != null && matches[1]) {
				filename = matches[1].replace(/['"]/g, '');
			}
		}
		return filename;
	}

	const base64toBlob = (b64Data, contentType='', sliceSize= 512) => {
		const byteCharacters = atob(b64Data);
		const byteArrays = [];

		for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);

			const byteNumbers = new Array(slice.length);
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}

		return new Blob(byteArrays, {type: contentType});
	}

	$('#dv-export-menu > div > a').on('click', function () {
		var form = $("#selectedFilters").serialize() + '&dataItem=' + $(this).attr('dataitem') + '&timeRange=' + $(this).attr('timerange') + '&exportType=' + $(this).attr('exporttype');
		var table = $(".export-extract-pagging");
		var tableRows = $("table#dv-datatable tr[data-detail-id]");
		if (table.length > 0) {
			var setting = table.dataTable().fnSettings();
			var start = setting._iDisplayStart;
			var length = setting._iDisplayLength;
			form = form + '&pageNumber=' + Math.floor(start / length) + "&pageLength=" + length;
		}
		if (useInstanceExportUrl) {
			let instanceCodesParams = [];
			Array.from(tableRows).forEach(tableRow => instanceCodesParams.push(tableRow.getAttribute("data-detail-id")));

			let instanceCodesForm = {};
			instanceCodesForm.instanceCodes = instanceCodesParams;

			ajaxRequestResponse({
				url: exportUrl + "/?" + form,
				method: "POST",
				data: JSON.stringify(instanceCodesForm),
				responseType: "blob",
				contentType: "application/json;charset=UTF-8",
				success: function (response, contextVariable, status, xhr) {
					const contentType = xhr.getResponseHeader("Content-Type");
					const filename = extractFilenameFromHeaders(xhr);

					const blob = base64toBlob(response, contentType);
					const downloadUrl = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = downloadUrl;
					a.download = filename;
					document.body.appendChild(a);
					a.click();
				}
			});
		} else {
			window.location = baseUrl + exportUrl + '?' + form;
		}
	});

	// Hover detection for export menu
	dvExportMenu.on('mouseenter mouseleave', function () {
		$(this).toggleClass('hover');
	});

	// Hide visible export menu upon clicking outside its area
	$(this).bind('click', function () {
		var exportMenu = $('#dv-export-menu');
		if (dvExportMenu.is(":visible") && !dvExportMenu.hasClass('hover')) {
			exportMenu.slideToggle(slideToggleExportMenuTime);
		}
	});

	fixFirstColumn($('.table-container').not('.ignore-fix-first-column'));

	showButtonsForBinaryDI();

	changeTimeZone();

	prepareAngularSubscribeUC();

	if (window.IS_MOBILE_VERSION) {
		initDataViewMobilePage();
	}
}

function scrollToPosition() {
	var areaContainer = $('#dv-market-areas-content');
	var scrollTo = $('div.dv-sub-filter-hierarchic-wrapper').find('a[class=checked]').closest('div.dv-filter-hierarchic-wrapper');

	if (scrollTo.length == 1) {
		areaContainer.animate({
			scrollTop: scrollTo.offset().top - areaContainer.offset().top + areaContainer.scrollTop()
		});
	}
}


//reload hour filter
function loadHours() {

	if (typeof mapHourUrl !== "undefined") {

		timestampTitle = $("input[name='map-time-combo_input']").val();

		var $hourCombo = $('#map-time-combo');
		var form = $("#selectedFilters").serialize();

		pushState = true;

		if ($.browser.msie && ($.browser.version * 1) < 10) {
			// for MSIE 8 and 9 push only query string
			History.pushState(null, "Data View", '?' + decodeURI(form));
		}
		else {
			History.pushState(null, "Data View", window.location.origin + window.location.pathname + '?' + form);
		}

		ajaxRequestResponse({
			method: 'post',
			url: mapHourUrl,
			data: form,
			success: function (data) {
				detectTimeShift();

				var comboData = eval('(' + data + ')');
				var shiftSet = false;
				$hourCombo.empty();

				// add all to combo box
				$.each(comboData.result, function (key, val) {
					if (timeShift !== null && key == timeShift[0] && $('#dateTime\\.timezone').val() == timeShift[1]) {
						timestamp = timeShift[0];
						shiftSet = true;
						invalidateTimeShift();
					} else if (shiftSet === false && val == timestampTitle) {
						timestamp = key;
					}

					$hourCombo.append('<option value="' + key + '">' + val + '</option>');
				});
				$hourCombo.val('-1');
				setComboValue('map-time-combo', timestamp, true);
			}
		});
	}
}

// Detect whether the combo box val is affected by time shift
function detectTimeShift() {
	var comboText = $('select[id=map-time-combo] option:selected').text();
	var comboTimestamp = $('#map-time-combo').val();

	$('#map-time-combo').children("option").each(function () {
		if (comboText == $(this).text()) {
			if ($(this).text() == comboText && $(this).next() && $(this).next().text() == $(this).text() && $(this).val() == comboTimestamp) {
				timeShift = [];
				timeShift[0] = $(this).val();
				timeShift[1] = timeZoneBeforeChange;
				return false;
			}
		}
	})
}

function invalidateTimeShift() {
	timeShift = null;
}

function afterLoadDashboardContentProcess() {
	$.getScript(baseUrl + '/resources/javascript/dashboard.js');
}

function afterLoadDataViewContentProcess() {
	if (typeof defaultValue !== 'undefined') $('#defaultValue').val(defaultValue);
	if (typeof dataViewName !== 'undefined')
		$('#dataViewName').html(dataViewName);
	$('div.dv-add-to-dashboard a').on("click", function (event) {
		event.preventDefault();
		var dataView = $('h2').text();
		var data = getDataToDashboard(getActualUrl(actualLocation), dataView, dataView);
		ajaxRequestResponse({
			method: "post",
			url: "/dashboard/setup",
			data: data,
			success: function (html) {
				if (html != null) {
					$('<div id="dialog-content"></div>').appendTo('body').append(html).triggerCallback(afterLoadDashboardContentProcess).initDialog({
						modal: true,
						width: 925,
						topCloseButton: { text: "Close without saving" },
						title: 'Please Select desired Widget position on Dashboard',
						close: function () {
							$('#dialog-content').remove();
						}
					});
				}
			}
		});
	});
	var visibleCol;
	dataViewType = $('#viewType').val();

	switch (dataViewType) {
		case 'TABLE':
			if (!((typeof noDataTable !== "undefined") && (noDataTable == true)))
				tableInitialization();
			scrollToPosition();
			break;
		case 'GRAPH':
			if (!((typeof publicationResolutionError !== "undefined") && (publicationResolutionError == true)))
				graphInitialization();
			break;
		case 'MAP':
			mapInitialization();
			break;
	}

	showHideExports();

	$("#dv-check-all-filters").off('change').on('change', function () {
		triggeredEvent = true;
		if ($(this).is(':checked')) {
			$('.dv-filter-hierarchic-wrapper input[type="checkbox"]:checked').each(function (index, element) {
				toggleCheckbox($(element), false);
			});
			$('.dv-filter-hierarchic-wrapper a.partially-checked').removeClass('partially-checked');
			var $this = $(this);
			var wrapper = $('.dv-filter-hierarchic-wrapper.border');
			wrapper.find('.dv-sub-filter-hierarchic-wrapper').hide();
			wrapper.find('.dv-filter-checkbox-selected').removeClass('dv-filter-checkbox-selected');
			wrapper.removeClass('border');
			$($this).parents('.dv-filter-checkbox').addClass('dv-filter-hierarchic-wrapper dv-filter-checkbox-selected border');

			changeFilter();
		} else {
			toggleCheckbox($(this));
			setTimeout("$('.dv-business-filter-primary .prettycheckbox a.checked').not('#dv-check-all-filters ~ a').removeClass('checked')", 5);
		}
	});
}

function isEmpty(el) {
	return !$.trim(el.html())
}


function showHideExports() {
	var elements = ["#dv-export-data", "#dv-export-menu-wrapper", "#dv-subscribe"];
	var bindElement = "div#dv-warning-message.dv-warning-publication-resolution";

	if (isEmpty($(bindElement))) {
		for (i = 0; i < elements.length; i++) {
			var element = elements[i];
			if (element === '#dv-export-menu-wrapper') {
				// prevent displaying empty export menu
				if ($('#dv-export-menu, #dv-export-menu > .export-item').children('a').length !== 0 && dvContainsData === "" || dvContainsData === "true") {
            		$(element).show();
				} else {
					$(element).hide();
				}
			} else {
            	$(element).show();
			}
		}
	} else {
		for (i = 0; i < elements.length; i++) {
			$(elements[i]).hide();
		}
	}
}

function colorizeFilter(innerElement) {
	var parent = $(innerElement).parents("div.dv-filter-checkbox");
	var isSelected = parent.hasClass("dv-filter-checkbox-selected");
	$("div.dv-filter-checkbox").removeClass("dv-filter-checkbox-selected");
	if (isSelected == false && parent.parent().hasClass('dv-filter-hierarchic-wrapper'))
		parent.addClass("dv-filter-checkbox-selected");
}

function changeFilter(additionallyParameters) {
	/*Changed by data viedw web*/
	var form = $("#selectedFilters").serialize();

	if (typeof additionallyParameters == 'string') {
		form += '&' + additionallyParameters;
	}

	pushState = true;

	if (document.documentMode * 1 < 10) {
		// for MSIE 8 and 9 push only query string
		History.pushState(null, "Data View", '?' + decodeURI(form));
	} else if (!window.location.origin) {
		//TPM TPM-1241 - fix for MSIE 10 ( window.location.origin not avalaible)
		window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
		History.pushState(null, "Data View", window.location.origin + window.location.pathname + '?' + decodeURI(form));
	} else {
		History.pushState(null, "Data View", window.location.origin + window.location.pathname + '?' + decodeURI(form));
	}

	ajaxRequestResponse({
		contentType: "application/json;charset=UTF-8",
		url: ajaxUrl,
		async: true,
		data: form,
		success: function (html) {
			if (html != null) {

				var expr = new RegExp('>[ \t\r\n\v\f]*<', 'g');
				html = html.replace(expr, '><');

				$('#dv-data').animate({opacity: 0}, 0, function () {
					var height = $('#dv-data').height();

					$('#dv-data').css('height', height)
						.empty()
						.append('<!-- Data Table -->')
						.append(html)
						.append('<!-- Data Table -->')
						.triggerCallback(afterLoadDataViewContentProcess)
						.css('height', 'auto')
						.animate({opacity: 1}, 0);

					fixFirstColumn($('.table-container').not('.ignore-fix-first-column'));
					showButtonsForBinaryDI();
					changeTimeZone();
					updateDINames();
					adjustExportMenu();
					showHideExports();
					fireUopFilterChangedEvent(form);
				});
			}
		}
	});
}

function adjustExportMenu() {
	if (typeof linkFilterWithDIs !== 'undefined') {
		var $elements = $('input[name="' + linkFilterWithDIs.filterInputName + '"]');
		$elements.each(function(index, element){
			var $exportItem = $('#dv-export-menu a[dataitem="'+linkFilterWithDIs.mapping[$(element).val()]+'"]');
			$exportItem.parents('.export-item').toggleClass('hidden', $(element).is(':not(:checked)'));
		});
	}
}

function getActualUrl(location) {
	var loc = location.replace(baseUrl, '');
	loc = loc + "?viewType=" + dataViewType;
	// add business data filter
	loc = loc + "$" + appendToDashboardURL($("#dv-business-filters input")) + appendToDashboardURL($("#dv-date-from")) + appendToDashboardURL($("#dv-date-to")) + appendToDashboardURL($("input[name=areaType]")) + appendToDashboardURL($("input[name=datepicker-day-offset-select-dv-date-from_input]")) + $('select[name="dateTime.timezone"]').serialize();
	loc = loc.replace(/&/g, '$') + '$dashboard=true';
	return loc;
}

function appendToDashboardURL(element) {
	return (element.size() > 0) ? element.serialize() + "$" : "";
}

function getDataToDashboard(url, dataView, title) {
	var type;
	switch (dataViewType) {
		case "MAP":
			type = "map";
			break;
		case "GRAPH":
			type = "chart";
			break;
	}
	return "url=" + url + "&type=" + type + "&dataView=" + dataView + "&title=" + title;
}

// Entry Point for Show Data.
// Based on nr. of argument, detail is loaded either from Mongo or from Model
// Use either [dimensions, dataItem, timestamp, timeZone] or [className, id, timestamp, fieldName, timeZone] as input parameters
function showDetail(a, b, c, d, e, f) {
	if (typeof mobileView !== "undefined" && mobileView) {
		return;
	}
	if (arguments.length === 5) {
		if (Array.isArray(a)) {
			showStandardDetailByDiPublicationSubapp(a, b, c, d, e);
		} else {
			showDetailByMongoEntity(a, b, c, d, e);
		}
	} else if (arguments.length === 6) {
		showRichDetailByDiPublicationSubapp(a, b, c, d, e, f);
	} else {
		showDetailByModel(a, b, c, d);
	}
}

/**
 * Special method for show Value Detail for Rich DI - id has different processing of content because Value History is Special
 * @param className
 * @param id
 */
function showRichDIDetail(className, id, timestamp, fieldName, timeZone) {
	if(typeof mobileView !== "undefined" && mobileView){
		return;
	}
	var data = { className: className, id: id, timestamp: timestamp, fieldName: fieldName, timeZone: timeZone};
	showDataViewDetail(data, afterLoadRichDetailDialogContentProcess);
}

//Fallback option for DataViews, which has not been migrated to showDetail method
function createDetail(dimensions, dataItem, timestamp, timeZone) {
	showDetailByModel(dimensions, dataItem, timestamp, timeZone);
}

//Loads Standard Detail from DiPublication Sub-app.
function showStandardDetailByDiPublicationSubapp(dimensions, dataItem, timestamp, fieldName, timeZone) {
	var data = { dimensions: dimensions, dataItem: dataItem, timestamp: timestamp, fieldName: fieldName, timeZone: timeZone};
	showDataViewDetail(data, afterLoadDetailDialogContentProcess);
}

//Loads Rich Detail from DiPublication Sub-app.
function showRichDetailByDiPublicationSubapp(instanceId, dimensions, dataItem, fieldName, timestamp, timeZone) {
	var data = { id: instanceId, dimensions: dimensions, dataItem: dataItem, fieldName: fieldName, timestamp: timestamp, timeZone: timeZone};
	showDataViewDetail(data, afterLoadDetailDialogContentProcess);
}

//Loads Detail directly from Mongo.
function showDetailByMongoEntity(className, id, timestamp, fieldName, timeZone) {
	var data = { className: className, id: id, timestamp: timestamp, fieldName: fieldName, timeZone: timeZone};
	showDataViewDetail(data, afterLoadDetailDialogContentProcess);
}

//Load Data from model.
function showDetailByModel(dimensions, dataItem, timestamp, timeZone) {
	var data = { dimensions: dimensions, dataItem: dataItem, timestamp: timestamp, timeZone: timeZone};
	showDataViewDetail(data, afterLoadDetailDialogContentProcess);
}

function showDataViewDetail(data, afterCallback) {

	var urlElements = ajaxUrl.match(/^(\/([^\/]*))/);
	var url;
	if (urlElements != null) {
		if (typeof specificDetailUrl === 'undefined') {
			url = urlElements[0] + "/getDetail";
		} else {
			url = urlElements[0] + specificDetailUrl;
		}
	}

	ajaxRequestResponse({
		contentType: "application/json;charset=UTF-8",
		method: "POST",
		async: false,
		url: url,
		data: JSON.stringify(data),
		success: function (detail) {
			$('<div id="dialog-content"></div>').appendTo('body').append(detail).triggerCallback(afterCallback()).initDialog({
				title: dataViewDetailName,
				modal: true,
				width: 850,
				topCloseButton: {text: "Close"},
				close: function () {
					$('#dialog-content').remove()
				}
			});
		}
	})
}

function showEditValueDialog(url) {
	ajaxRequestResponse({
		contentType: "application/json;charset=UTF-8",
		method: "GET",
		async: false,
		url: url,
		success: function (detail) {
			$('#dialog-content').initDialog('close');

			$('<div id="dialog-content"></div>').appendTo('body').append(detail).triggerCallback(initModifyDialog()).initDialog({
				title: 'Add/Modify data',
				modal: true,
				width: 640,
				topCloseButton: {text: "Close without saving"},
				buttons: {
					"Add/Modify": function () {
						$('#attributes-form').submit();
					}
				},
				close: function () {
					$('#dialog-content').remove();
				}
			});
		}
	});
}

function serializeObjectToUrlParameters(object) {
	var str = "";
	for (var key in object) {
		if (str != "") {
			str += "&";
		}
		str += key + "=" + object[key];
	}

	return str;
}

function afterLoadDetailDialogContentProcess() {
	$('.dv-detail-submission, .dv-detail-subarea').append("<div title='Detail' class='pre-table-button operation-detail-expand ui-button-light ui-button ui-widget ui-corner-all ui-button-text-only'></div>");
	$('.dv-detail-submission-edit a.edit').addClass('pre-table-button operation-edit ui-button-light ui-button ui-widget ui-corner-all ui-button-text-only').attr('title', 'Edit Value');
	$('.dv-detail-submission-edit a.history').addClass('pre-table-button operation-history ui-button-light ui-button ui-widget ui-corner-all ui-button-text-only').attr('title', 'Value History');
	$('.dv-detail-submission > div, .dv-detail-subarea > div').on('click', function () {
		$element = $('tr[detail-for="' + $(this).parent().parent().attr('id') + '"]');
		$element.toggle();
		$(this).toggleClass('operation-detail-expand').toggleClass('operation-detail-collapse');
	});

	$('.dv-detail-submission-edit a.history:not(.disabled)').on('click', function () {

		var dataProviderName = $(this).closest('tr').find('.dv-detail-data-provider').html();
		var timeInterval = $(this).closest('tr').find('.dv-detail-time-interval').html().replace(/|&nbsp;/g, '');
		var date = $(this).closest('tr').find('.dv-detail-date').html().replace(/ |&nbsp;/g, '');
		var valueHistoryParams = {};
		valueHistoryParams.dataItemName = encodeURIComponent(dataViewDetailName);
		valueHistoryParams.dataProviderName = dataProviderName;
		valueHistoryParams.timeInterval = timeInterval;
		valueHistoryParams.date = date;
		valueHistoryParams.timeZone = detailTimeZone;
		valueHistoryParams.className = dataViewClassName;
		valueHistoryParams.mongoId = mongoId;
		valueHistoryParams.attributeName = attributeName;
		valueHistoryParams.timestamp = valueTimestamp;
        valueHistoryParams.sourceBusinessDimensions = encodeURIComponent($(this).closest('tr').data('source-business-dimensions'));
		valueHistoryParams.dimensions = dimensions;

        var cacmValueHistory = $(this).hasClass("cacm-value-history");
		var tpr2RichValueHistory = $(this).hasClass("tpr2-rich-value-history");
		var tpr3RichValueHistory = $(this).hasClass("tpr3-rich-value-history");
		var tpr2StandardValueHistory = $(this).hasClass("tpr2-standard-value-history");
		var tpr3StandardValueHistory = $(this).hasClass("tpr3-standard-value-history");

		ajaxRequestResponse({
			url: (tpr3RichValueHistory || tpr2RichValueHistory || cacmValueHistory) ? "/valueHistoryCacm" : "/valueHistory",
			method: "POST",
			success: function (data) {
				$('<div id="value-history-dialog"></div>').appendTo('body').append(data)
					.triggerCallback(afterLoadValueDetailHistoryDialogContentProcess(valueHistoryParams, cacmValueHistory, tpr2RichValueHistory, tpr3RichValueHistory, tpr2StandardValueHistory, tpr3StandardValueHistory))
					.initDialog({
						title: 'Value History',
						modal: true,
						width: 640,
						topCloseButton: {text: "Close"},
						close: function () {
							$('#value-history-dialog').remove();
						}
					});
			}
		});
	});

	$('.dv-detail-submission-edit > a.edit').on('click', function () {

        var url = encodeURI($(this).attr('href'));

		showEditValueDialog(url);

		return false;

	});
}

function afterLoadValueDetailHistoryDialogContentProcess(valueHistoryParams, cacmValueHistory, tpR2richValueHistory, tpr3RichValueHistory, tpr2StandardValueHistory, tpr3StandardValueHistory) {

	$('#value-history-time-interval').html(valueHistoryParams.timeInterval);
	$('#value-history-data-provider').html(valueHistoryParams.dataProviderName);

	var columns = [
		{
			sName: "mainValue"
		},
		{
			sName: 'versionNumber'
		},
		{
			sName: 'uploadDate'
		},
		{
			sName: 'dataFlowInstanceID', mRender: function (cellData) {
				return '<a class="show-dataflow-detail detail-id-' + cellData + ' + ">Data Flow Detail</a>';
			}
		}
	];

	if (cacmValueHistory) {
		columns = [
			{
				sName: 'uploadDate'
			},
			{
				sName: 'dataFlowInstanceID', mRender: function (cellData) {
					return '<a class="show-dataflow-detail detail-id-' + cellData + ' + ">Data Flow Detail</a>';
				}
			}
		];
	} else if (tpR2richValueHistory) {
		columns = [
			{
				sName: 'uploadDate'
			},
			{
				sName: 'dataFlowInstanceID', mRender: function (cellData) {
					return '<a class="show-dfpm-detail detail-id-' + cellData + ' + ">Data Flow and Processing Monitoring Detail</a>';
				}
			}
		];
	} else if (tpr3RichValueHistory) {
		columns = [
			{
				sName: 'uploadDate'
			},
			{
				sName: 'dataFlowInstanceID', mRender: function (cellData) {
					return '<a class="show-dfpm-detail-guig02 detail-id-' + cellData + ' + ">Data Flow and Processing Monitoring Detail</a>';
				}
			}
		];
	} else if (tpr2StandardValueHistory) {
		columns = [
			{
				sName: "mainValue"
			},
			{
				sName: 'versionNumber'
			},
			{
				sName: 'uploadDate'
			},
			{
				sName: 'dataFlowInstanceID', mRender: function (cellData) {
					return '<a class="show-dfpm-detail detail-id-' + cellData + ' + ">Data Flow and Processing Monitoring Detail</a>';
				}
			}
		];
	} else if (tpr3StandardValueHistory) {
		columns = [
			{
				sName: "mainValue"
			},
			{
				sName: 'versionNumber'
			},
			{
				sName: 'uploadDate'
			},
			{
				sName: 'dataFlowInstanceID', mRender: function (cellData) {
					return '<a class="show-dfpm-detail-guig02 detail-id-' + cellData + ' + ">Data Flow and Processing Monitoring Detail</a>';
				}
			}
		];
	}

	var valueHistoryTable = $('#value-history-table').initDataTable({
		"fnServerData": function (sSource, aoData, fnCallback) {

			ajaxRequestResponse({
				dataType: 'json',
				contentType: "application/json;charset=UTF-8",
				method: "POST",
				url: sSource + "/?" + serializeObjectToUrlParameters(valueHistoryParams),
				data: stringify_aoData(aoData),
				success: function (json) {
					for (var i = 0; i < json.aaData.length; i++) {
						json.aaData[i][0] = JSON.stringify(json.aaData[i][0]);
					}
					fnCallback(json);
				}
			})
		},
		"fnRowCallback": function (nRow, aData) {
			$(nRow).attr("id", aData[0]);
			return nRow;
		},
		"bPaginate": true,
		"bLengthChange": true,
		"bFilter": false,
		"bSort": false,
		"bInfo": false,
		"bAutoWidth": false,
		"sDom": 'rt<"newBottom"lip><"clear">',
		"sPaginationType": "full_numbers",
		"aLengthMenu": [
			[10, 25, 50, 100],
			[10, 25, 50, 100]
		],
		"oLanguage": {
			"sEmptyTable": "No data found for criteria selected",
			"sInfoEmpty": "No News to show in the table",
			"sInfo": "_END_ of _TOTAL_ Outages",
			"sLengthMenu": "Versions per page _MENU_",
			"sSearch": "Search all columns:"
		},
		bStateChange: true,
		bStateSource: 'url',
		"bServerSide": true,
		"bProcessing": true,
		"sAjaxSource": "/valueHistoryTable",
		sServerSide: 'POST',
		aoColumns: columns
	});

	var valueHistoryArchivesTable = $('#value-history-archives-table').initDataTable({
		"fnServerData": function (sSource, aoData, fnCallback) {
			ajaxRequestResponse({
				dataType: 'json',
				contentType: "application/json;charset=UTF-8",
				method: "POST",
				url: sSource + "/?" + serializeObjectToUrlParameters(valueHistoryParams),
				data: stringify_aoData(aoData),
				success: function (json) {
					for (var i = 0; i < json.aaData.length; i++) {
						json.aaData[i][0] = JSON.stringify(json.aaData[i][0]);
					}
					fnCallback(json);
				}
			})
		},
		"fnRowCallback": function (nRow, aData) {
			$(nRow).attr("id", aData[0]);
			return nRow;
		},
		"bPaginate": true,
		"bLengthChange": true,
		"bFilter": false,
		"bSort": false,
		"bInfo": false,
		"bAutoWidth": false,
		"sDom": 'rt<"newBottom"lip><"clear">',
		"sPaginationType": "full_numbers",
		"aLengthMenu": [
			[10, 25, 50, 100],
			[10, 25, 50, 100]
		],
		"oLanguage": {
			"sEmptyTable": "No data found for criteria selected",
			"sInfoEmpty": "No News to show in the table",
			"sInfo": "_END_ of _TOTAL_ Outages",
			"sLengthMenu": "Archives per page _MENU_",
			"sSearch": "Search all columns:"
		},
		bStateChange: true,
		bStateSource: 'url',
		"bServerSide": true,
		"bProcessing": true,
		"sAjaxSource": "/valueHistoryArchiveTable",
		sServerSide: 'POST',
		aoColumns: [
			{
				bVisible: false,
				sName: "archiveId"
			},
			{
				sName: "submissionTime"
			},
			{
				sName: 'archiveDownloadLink',
				"mRender": function (column, type, row) {
					var archiveId = row[0].replaceAll(new RegExp('"', 'g'), '');
					return "<a title='Link' href='" + baseUrl + "/archives/" + archiveId + "/download'>Link</a>";
				}
			}
		]
	});
}

/**
 * Special callback for Rich DI Detail to process correct history button
 */
function afterLoadRichDetailDialogContentProcess() {
	$('.dv-detail-submission-history a.history').addClass('pre-table-button operation-history ui-button-light ui-button ui-widget ui-corner-all ui-button-text-only').attr('title', 'Value History');

	$('.dv-detail-submission-history a.history:not(.disabled)').on('click', function () {

		var richId = $(this).data('rich-id');
		var mongoId = $(this).data('mongo-id');

		ajaxRequestResponse({
			// valueHistoryUrl has to be defined on each Rich DI DataView
			url: valueHistoryUrl,
			method: "GET",
			data: {
				mongoId: mongoId,
				richId: richId
			},
			success: function (data) {
				// close value detail dialog
				$('#dialog-content').dialog("close");

				$('<div id="value-history-dialog"></div>').appendTo('body').append(data)
					.triggerCallback(valueHistoryTableInitialization(richId))
					.initDialog({
						title: 'Value History',
						modal: true,
						width: 950,
						topCloseButton: {text: "Close"},
						close: function () {
							$('#value-history-dialog').remove();
						}
					});
			}
		});
	});
}

function fixHorizontalPosition(elements, delta, anchor) {
	// make fix position of elements in horizontal scrollable container (.table-container)
	if (typeof setFullScreen == "boolean" && setFullScreen) return;

	// make fix position of elements in horizontal scrollable container (.table-container)
	var table = $(elements).parents(".table-container");

	elements.each(function () {
		$(this).css("width", $(this).width() + "px");
	});

	var offset = parseInt(table.css("padding-left"));
	var wrapper;

	if (typeof anchor === "undefined")
		wrapper = table.find(".dataTables_wrapper");
	else
		wrapper = $(anchor);

	table.scroll(function () {
		var left = table.position().left - wrapper.position().left + offset + delta;
		elements.css("margin-left", left + "px");
	});
}

var doNotFixFirstColumnDIs = ["Outages", "Explicit Allocations - Intraday", "Explicit Allocations - Day Ahead", "Current Balancing State", "Aggregated Bids"];

function fixFirstColumn(containerSelector) {
    if (doNotFixFirstColumnDIs.indexOf(dataViewName) >= 0) return;
    if (typeof setFullScreen == "boolean" && setFullScreen) return;
	if (!$(containerSelector).hasOverflow()) return;

	var notOverflowingTableOffset = detectBrowser() == "chrome" ? 22 : 21;

	$(containerSelector).each(function (index, container) {
		var sourceTable = $(container).find('table');
		var table = $('<table><thead><tr></tr></thead><tbody></tbody></table>');
		table.find('thead > tr').append($(sourceTable).find('thead > tr > th:first').clone());
		var tbody = table.find('tbody');
		$(sourceTable).find('tbody > tr').each(function (index, element) {
			if (typeof  $(element).find('td').attr('colspan') == "undefined" || $(element).find('td').attr('colspan') == "1") {
				var td = $(element).find('td:first').clone();
				if (td.hasClass('first')) {
					var tr = $('<tr></tr>').attr('class', $(element).attr('class')).append(td);
					if (td.attr('rowspan') == '2') {
						td.addClass('static-column-rowspan');
						tbody.append(tr);
						tr = $('<tr><td class="static-column-rowspan-new-td"></td></tr>');
					}
					tbody.append(tr);
				}
			}
		});
		table.attr('class', $(sourceTable).attr('class'));
        //added class for the later recognize table -zooming table
        sourceTable.addClass('dv-source-table');
        table.addClass('dv-fixed-first-column');
		table.find('th:first').css('height', Math.floor($(sourceTable).find('th:first').height()) + (detectBrowser() == "chrome" ? 1 : 0) + 'px');
		table.css('width', $(sourceTable).find('th:first').width() + ($(container).isChildOverflowing('table') ? 0 : notOverflowingTableOffset) + 'px').css('background-color', 'white');
		var wrapper = $('<div class="dv-fixed-first-column-wrapper"></div>').css({
			position: 'absolute',
			marginLeft: '-10px',
			paddingLeft: '10px',
			backgroundColor: 'white',
			left: '10px'
		}).append(table);
		$(container).prepend(wrapper);

		if (!detectBrowser() == "firefox") {
			fixHorizontalPosition(wrapper, -20, containerSelector);
		}

	});
}

/*
 Pages with horizontal scrollbar has fix first column. Fix height of table header
 Only For Chrome. TPEET-75
 */
jQuery(function ($) {
    $(window).resize(function () {
        if (!$('.table-container').hasOverflow()) return;

        if (detectBrowser() == "chrome") {
            var dataTable = $('.dv-source-table');
            var fixedFirstColumnTable = $('.dv-fixed-first-column-wrapper').find('table');

            var newHeight = Math.round($(dataTable).find('th:first').height()) + 1.5 + 'px';

            fixedFirstColumnTable.find('th:first').css('height', newHeight);
        }
    });
});

/*Change date picker time zone from time zone select box*/
function changeTimeZone() {
	if (typeof setFullScreen == "boolean" && setFullScreen) return;
    if ($('#dv-time-filter').length) {
        var dateFrom = $("#dv-date-from").val();
        var dateTo = $("#dv-date-to").val();
        var timeZone;
        if (typeof hideZoneSelect !== "undefined") {
            if (hideZoneSelect) {
                timeZone = "UTC";
            }
        } else {
            timeZone = $("#dateTime\\.timezone").val().replace(/_.*/, "");
        }
        if (dateFrom) {
            $("#dv-date-from").attr('value', dateFrom.replace(/(UTC)|(WET)|(CET)|(EET)|(GET)|(Asia\/Tbilisi)/, timeZone));
        } else {
            return;
        }
        if (dateTo) {
            $("#dv-date-to").attr('value', dateTo.replace(/(UTC)|(WET)|(CET)|(EET)|(GET)|(Asia\/Tbilisi)/, timeZone));
        }
    }
}

function selectTab() {
	if (typeof selectedAreaType !== "undefined") {
		$(".tabs ul li[name~=" + selectedAreaType + "]").addClass('selected');
	}
	if (dataViewType === "GRAPH") {
		$('#dv-show-fullscreen').css('display', 'none');
	}
}

function showButtonsForBinaryDI() {
	var uploadDialogButton = $("#show-upload-dialog-button");
	uploadDialogButton.appendTo('#dv-heading').button();

	if (typeof uploadButtonEnable !== 'undefined') {
		if (uploadButtonEnable) {
			uploadDialogButton.button('enable')
		} else {
			uploadDialogButton.button('disable');
		}
	}

	if (typeof bindEventToUploadPDFButton === 'function') {
		bindEventToUploadPDFButton();
	}
}

function addCurrency(currencyAttribute, currencyLabelSufix) {
	var currency = null;

	$(this).find('.data-view-detail-link.' + currencyAttribute + ', td.attribute-data.' + currencyAttribute).each(function () {
		var curentCurrency = $(this).html().match(/[A-Z]*$/);
		if (currency == null) {
			currency = curentCurrency[0];
		}
		if (currency != "Currency" && currency != curentCurrency[0]) {
			currency = "Currency";
		}
	});

	if (currency != "Currency") {
		$(this).find('.data-view-detail-link.' + currencyAttribute + ', td.attribute-data.' + currencyAttribute).each(function () {
			$(this).html($(this).html().match(/[-]?[0-9\.]*/));
		});
	}

	if (currency === null || currency.length == 0) {
		currency = "Currency";
	}

	$(this).find('th span.th-new-line.' + currencyAttribute.toLocaleLowerCase()).html('[' + currency + currencyLabelSufix + "]");
}

function addCurrencyForDynamicTable(elementClass, currencyLabel) {
	$("." + elementClass).each(function () {
		this.innerHTML = "[" + currencyLabel + "]";
	});
}

function addValidityPeriodForDynamicTable(elementClass, detailId, validityPeriod) {
	$("." + elementClass + "#validity-period_" + detailId).each(function () {
		this.innerHTML = validityPeriod;
	});
}

var iconDefinition = {
	'A05': {icon: 'Icon_active.png', title: "Active outage"},
	'A09': {icon: 'Icon_cancelled.png', title: "Cancelled outage"},
    'A13': {icon: 'Icon_withdrawn.png', title: "Withdrawn outage"},
	'A53': {icon: 'Icon_Planned-Outage.png', title: "Planned outage"},
	'A54': {icon: 'Icon_Forced-Outage.png', title: "Forced outage"},
	'PRODUCTION_UNIT': {icon: 'Icon_Production-Unit.png', title: "Production unit"},
	'GENERATION_UNIT': {icon: 'Icon_Generation-Unit.png', title: "Generation unit"},
	'B21': {icon: 'Icon_ac-link.png', title: "AC Link"},
	'B22': {icon: 'Icon_dc-link.png', title: "DC Link"},
	'B23': {icon: 'Icon_transformer.png', title: "Transformer"},
	'B24': {icon: 'Icon_substation.png', title: "Substation"},
	'COMMISSIONED': {icon: 'Icon_active.png', title: "Commissioned"},
	'DECOMMISSIONED': {icon: 'Icon_decommissioned.png', title: "Decommissioned"},
	'CANCELLED': {icon: 'Icon_cancelled.png', title: "Cancelled"}
};
/**
 *
 * Function for data table's mRender callback which replaces codes with icon. Icons must be defined in iconDefinition variable.
 * See iconDefinition variable usage somewhere.
 * @param data
 * @returns Icon or original text in case the icon is not defined.
 */
function drawIconCallback(data) {
	if (!iconDefinition || $.isEmptyObject(iconDefinition)) return data;
	if (data == null) return data;
	var result = "<img src='" + baseUrl + "/resources/images/icons/";
	var anIconDefinition = iconDefinition[data];
	if (!anIconDefinition) return data;
	result += anIconDefinition.icon;
	result += "' alt='' title='" + anIconDefinition.title + "'>";
	return result;
}
/**
 * Function for render detail on dataview table
 * @param oObj
 * @returns {string}
 */
function renderDetail(oObj) {
	if (oObj != null) {
		return "<a title='Detail' class='openIcon pre-table-button operation-detail-expand small-button tesst'></a>"
	} else {
		return "";
	}
}

/**
 * Start Angular Subscribe UC
 */
function prepareAngularSubscribeUC() {
	$("#dv-subscribe").click(function () {
		// start angular - load start file
		require(["angular", window.UOP_CONFIG.angularStartFile], function (angular) {
			// get angular scope
			var scope = angular.element($("body")).scope();

			// if angular was loaded before (second click to button)
			if (scope.angularStarted) {
				// HACK - change URL in angular to pretend that nothing happens - otherwise Angular ends in infinite loop and throw exception
				// angular has problem when someone change URL - History.pushState
				scope.location.$$absUrl = window.location.href;
				scope.$apply();
				// HACK end

				// just broadcast event to open subscription - use timeout to start $digest loop
				scope.timeout(function () {
					scope.$broadcast("subscriptionEditDialog.open");
				});
			}
			else {
				// after angular was loaded - SubscriptionFormController send event that it is ready - but we still have to wait until components are initialized (digest)
				// $timeout and $location is sended from angular in this event to allow add some functionality after uc is ready
				scope.$on("subscriptionFormCtrl.ready", function (event, $timeout, $location) {
					scope.timeout = $timeout;
					scope.location = $location;
					$timeout(function () {
						// when UC is realy ready - open window and set flag that Angular is prepared.
						scope.$broadcast("subscriptionEditDialog.open");
						scope.angularStarted = true;
					});
				});
			}
		});

		// prevent default link action.
		return false;
	});
}


function initDataViewMobilePage() {
	// if this not work - please modify all data view filters
	var primaryFiltersCount = $(".dv-business-filter-primary").length;
	var filtersCount = $(".dv-business-filter").length;
	if (primaryFiltersCount < filtersCount) {
		$(".dv-business-filter-primary").last().parent(".dv-business-filter").after('<div class="dv-business-filter-subtitle">Optional Filters</div>');
	}

	$('.dv-business-filter-title').addClass('light-purple-button');

	$(".dv-business-filter-title").click(function() {
		$("#dv-business-filters").slideToggle('fast');
		$(this).find(".hide-filters").toggle();
		$(this).find(".show-filters").toggle();
	})
}