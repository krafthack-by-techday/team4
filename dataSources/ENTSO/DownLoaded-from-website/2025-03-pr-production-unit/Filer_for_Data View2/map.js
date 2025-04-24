function removeSelectedInputs() {
	if ($("div.dv-filter-hierarchic-wrapper").hasClass("border")) {
		$("div.dv-filter-hierarchic-wrapper.border").removeClass("border").find('a').removeClass('partially-checked');
		$("div.dv-filter-hierarchic-wrapper > div.dv-filter-checkbox-selected").removeClass("dv-filter-checkbox-selected");
		$("div.dv-filter-hierarchic-wrapper > div.dv-filter-checkbox a").removeClass("checked");
		$("div.dv-sub-filter-hierarchic-wrapper:has")
	}
	$("div.dv-sub-filter-hierarchic-wrapper:has(:visible)").hide();
	$("div.dv-sub-filter-hierarchic-wrapper[style*='block']").hide();
	$("div.dv-filter-hierarchic-wrapper div.dv-filter-checkbox input[type=checkbox]:checked").attr("checked", false);
	$("div.dv-filter-hierarchic-wrapper div.dv-filter-checkbox a[class='checked']").removeClass('checked');
}

function selectAreaFilter(input) {
	input.attr("checked", true);
	input.closest("div.dv-filter-hierarchic-wrapper").addClass("border");
	input.parents("div.dv-filter-hierarchic-wrapper").children('.dv-filter-checkbox').addClass('dv-filter-checkbox-selected');
	input.closest("div.dv-filter-hierarchic-wrapper").find('div.dv-sub-filter-hierarchic-wrapper').show("fast");

	var totalCunt = input.parents('.dv-filter-hierarchic-wrapper').children('.dv-sub-filter-hierarchic-wrapper').find('input[type="checkbox"]').length;
	var checkedCunt = input.parents('.dv-filter-hierarchic-wrapper').children('.dv-sub-filter-hierarchic-wrapper').find('input[type="checkbox"]:checked').length;

	input.parents('.dv-filter-hierarchic-wrapper').children('.dv-filter-checkbox').find('a').removeClass('checked partially-checked');

	if (checkedCunt > 0 && checkedCunt < totalCunt) {
		input.parents('.dv-filter-hierarchic-wrapper').children('.dv-filter-checkbox').find('a').addClass('partially-checked');
	} else if (checkedCunt > 0) {
		input.parents('.dv-filter-hierarchic-wrapper').children('.dv-filter-checkbox').find('a').addClass('checked');
	}
}

function amMapsSelectAreaCallback(area) {
	var selectedArea = area[0];
	if (selectedArea.length > 2) {
		selectedArea = selectedArea.substr(0, 2);
	}
	var input = $("input[value='" + mapAreaCodes[selectedArea] + "']");
	removeSelectedInputs();
	var aHref = $(input.parent().find('a'));
	aHref.addClass('checked');
	selectAreaFilter(input);
}

function amMapsDefaultZoomCallback(area) {

	infoText("home zoom");
}

function amMapsUnselectAreaCallback(area) {

	infoText("unselect: " + area);
}


function amMapsSelectArea(area) {
	callSwf("EmfipMap").amMapsSelectArea(area, true);
}


function amMapsDefaultZoom() {
	callSwf("EmfipMap").amMapsDefaultZoom(true)
}


function infoText(text) {
	//		console.log(text);
	document.getElementById("statusText").innerHTML = text + "\n" + document.getElementById("statusText").innerHTML;

}

/**
 * Check if amMapsSelectArea() function can be called.
 */
function zoomMapToSelectedArea() {
	//Zoom map to selected area in filter
	if (typeof mapZoomCode !== 'undefined' && mapZoomCode !== '') {
		if (typeof dataViewType !== 'undefined' && dataViewType === "MAP") {
			var intervalId = setInterval(function () {
				var mapResult = callSwf("EmfipMap");
				if (typeof mapResult !== 'undefined'
					&& typeof mapResult.amMapsSelectArea !== 'undefined') {
					try {
						amMapsSelectArea(mapZoomCode);
					} catch (e) {
						if (detectBrowser() !== "IE8") {
							console.log(e);
						}
					} finally {
						clearInterval(intervalId);
					}
				}
			}, 2000);
		}
	}
}

function callSwf(swfName) {
	return document[swfName]
}


/**
 * Utility class for map
 */
var Map = function () {
}


Map.prototype = {
	stickyHours: null,
	shiftDays: 0,

	/**
	 * Adjust moment instance in order to work with the map combobox
	 *
	 * @param t moment instance to be adjusted
	 * @returns adjusted moment
	 */
	adjustMoment: function (t) {
		t.minute(0);
		t.second(0);
		t.millisecond(0);

		return t;
	},

	/**
	 * Method for getting rounded hour date value compatible with map time combobox
	 *
	 * @returns moment instance consisting of current year, month, day and rounded hour
	 */
	getRoundedHourNow: function () {
		return this.adjustMoment(moment());
	},

	/**
	 * Get the moment instance with rounded hour value based on input parameters
	 *
	 * @param timestamp timestamp to be adjusted for map
	 * @param unix true if the input timestamp is in unix format otherwise false
	 * @param hourShift shift the current time by hours (optional)
	 * @returns moment instance with rounded hour value
	 */
	getRoundedHourByTimestamp: function (timestamp, unix) {
		var roundedMom = (unix) ? this.adjustMoment(moment.unix(timestamp / 1000)) : this.adjustMoment(moment(timestamp));
		var adjustment;

		if (this.stickyHours) {
			adjustment = this.stickyHours;
		} else {
			adjustment = moment().hour() + parseInt((arguments.length > 2) ? arguments[2] : 0);
		}
		roundedMom.hours(adjustment);
		return roundedMom;
	},

	/**
	 * Extracts the current map time
	 *
	 * @returns the current map time
	 */
	extractCurrentMapTime: function () {
		return moment(parseInt($("#map-time-combo").val()));
	},

	/**
	 * Extracts the current map hour
	 *
	 * @returns the current map hour
	 */
	extractCurrentMapHour: function () {
		return this.extractCurrentMapTime().hour();
	},

	/**
	 * Set sticky hour (hour value will persist through date changes)
	 */
	makeSticky: function () {
		this.stickyHours = this.extractCurrentMapHour();
	},

	/**
	 *
	 * @returns true if user sets the hour value for map from combobox otherwise false
	 */
	isSticky: function () {
		return this.stickyHours != null;
	},

	createMap: function (baseUrl, mapSettingUrl) {
		var swfVersionStr = "10.2.0";
		var xiSwfUrlStr = "playerProductInstall.swf";

		var flashvars = {};
		flashvars.settingsUrl = mapSettingUrl;

		var params = {};
		params.quality = "high";
		params.bgcolor = "#ffffff";
		params.allowscriptaccess = "always";
		params.allowfullscreen = "true";
		params.wmode = "transparent";

		var attributes = {};
		attributes.id = "EmfipMap";
		attributes.name = "EmfipMap";
		attributes.align = "middle";

		if ($('.dashboard').length === 0) {
			swfobject.embedSWF(
					baseUrl + "/map/EmfipMap.swf", "flashContent",
				"100%", "600",
				swfVersionStr, xiSwfUrlStr,
				flashvars, params, attributes);
		} else {
			swfobject.embedSWF(
					baseUrl + "/map/EmfipMap.swf", "flashContent",
				"100%", "359",
				swfVersionStr, xiSwfUrlStr,
				flashvars, params, attributes);
		}
		// JavaScript enabled so display the flashContent div in case it is not replaced with a swf object.
		swfobject.createCSS("#flashContent", "display:block;text-align:left;");
		zoomMapToSelectedArea();
	},

	reloadMap: function (mapDataUrl) {
		callSwf("EmfipMap").amMapsLoadData(mapDataUrl);

		this.makeSticky();
	}
}

var map = new Map();