/*
 * Navigation panel handlers
 */
var activeDomain = '';

function highlightMenuitem() {
	// highlighting of primary navigation menu items
	if (typeof dataViewName !== "undefined") {
		$('#' + dataViewsToDomain[dataViewName]).addClass('selected');
	} else if (typeof widgets !== "undefined") {
		$('#home-nav').addClass('selected');
	} else if ($('#administration-nav-content li').hasClass('selected') || location.pathname.match(/(\/mnt\/)|(\/cm\/)/)) {
		$('#administration-nav').addClass('selected');
	} else if (location.pathname.match(/(\/legacy%20data\/)/)) {
        $('#legacy-data').addClass('selected');
    }
}

function unhighlightPreviouslySelected() {
	// unhighlight previously selected
	$("div #primary-navigation li.selected").each(function () {
		$(this).removeClass("selected");
	});
}

function collapsePrimaryNavigation(collapse) {
	var primaryNavigationElement = $("#primary-navigation");
	var collapseClass = "collapsed";

	if (collapse) {
		primaryNavigationElement.addClass(collapseClass);
	} else {
		primaryNavigationElement.removeClass(collapseClass);
	}
}

function getDomainHighlightedElement() {
	return $("div #primary-navigation li.selected:not(#administration-nav, #home-nav)");
}

function showTertiaryNavigation(highlightedDomain) {
	var differentDomain = highlightedDomain.length === 0 || highlightedDomain.attr('id') !== $(this).attr('id');

	var _selectedDomain = $(this).attr('id').match(/^[a-zA-Z]*/)[0];

	buildTertiaryNavigation(_selectedDomain);

	collapsePrimaryNavigation(false);
	$('#primary-navigation li.selected').removeClass('selected');
	$(this).addClass('selected');
	activeDomain = $(this).attr('id');

	$('.recently-used-dv-item').on('click', function () {
		addDataViewToLocalStorage.call(this, _selectedDomain);
	});

	$(document).off('click', '.dv-menu-item').on('click', '.dv-menu-item', function () {
		addDataViewToLocalStorage.call(this, _selectedDomain);
	});

	if (!differentDomain && $('#tertiary-navigation').is(':visible')) {
		$('#tertiary-navigation').slideUp('fast');
		$(this).removeClass("selected");
		highlightMenuitem();
		collapsePrimaryNavigation(true);
	}

	if (differentDomain || $('#tertiary-navigation').is(':hidden')) {
		$('#tertiary-navigation').slideDown('fast');
		unhighlightPreviouslySelected();
		$(this).addClass("selected");
		hideDomainDVMenu();
	}
	$('#domain-dv-menu').fadeOut(50);
}

function buildTertiaryNavigation(_selectedDomain) {
	$('.recently-used-dv-content').empty();
	if (_loggedUser != null) {
		$('#tertiary-navigation').removeClass('without-menu');
		for(var i = 0; i < 8; i++){
			var dataViewFromLocalStorage = localStorage['emfip.' + _loggedUser + '.' + _selectedDomain + '.' + i];

			if (dataViewFromLocalStorage === undefined) {
                break;
            }

			var element = $('<div class="recently-used-dv-item"></div>');
			if (dataViewFromLocalStorage !== undefined) {
				var dataViewLink = dataViewFromLocalStorage.split('|')[0];
				var _dataViewName = dataViewFromLocalStorage.split('|')[1];

				if(dataViewLink === '/balancing/r2/balancingVolumesReservationPriceLegacy/show'
					|| dataViewLink === '/balancing/r2/balancingVolumesReservationLegacy/show') {
					continue;
				}

				var a = $('<a href="' + dataViewLink + '">' + _dataViewName + '</a>');
				if (_dataViewName.length > 50) {
					a.css('font-size', '12px');
				}
				$(element).append('<div class="recently-used-dv-item-wrapper">' + $('<span></span>').append(a).html() + '</div>');
				element.appendTo('.recently-used-dv-content');
			}
		}
	} else {
		var recentlyUsedDataViewLinks = $('#' + _selectedDomain + '-domain-dataviews > a');
		var count = 8;
		$('#tertiary-navigation').removeClass('without-menu');

		count = Math.min(count, recentlyUsedDataViewLinks.length);

		for (var i = 0; i < count; i++) {
			var element = $('<div class="recently-used-dv-item"></div>');
			$(recentlyUsedDataViewLinks[i]).clone().appendTo(element).wrap('<div class="recently-used-dv-item-wrapper"></div>');
			element.appendTo('.recently-used-dv-content');
		}
	}

	if (typeof(dataViewName) !== 'undefined') {
		$('.recently-used-dv-item a:contains("' + dataViewName + '")').filter(function(index, element){
			return $(element).html() === dataViewName;
		}).parents('.recently-used-dv-item').addClass('highlight');
	} else {
		$('.recently-used-dv-item.highlight').removeClass('highlight');
	}
}

function showDomainDVMenu() {
	var highlightedDomain = $(this).attr('activeDomain');
	var _selectedDomain = highlightedDomain.match(/^[a-zA-Z]*/)[0];

	var left = $('#all-dv-dropdown')[0].offsetLeft + 40;
	$('#domain-dv-menu').css('left', left);

	if (($("#domain-dv-menu-" + _selectedDomain + "-content")).length === 0) {
		var domainContent = $("<div class='domain-dv-menu-content' id='domain-dv-menu-" + _selectedDomain + "-content'></div>");
		domainContent.appendTo('#domain-dv-menu');
	} else {
		($("#domain-dv-menu-" + _selectedDomain + "-content")).show();
	}

	var $menuItems = $('#' + _selectedDomain + '-domain-dataviews > div');

	var div = 7;
	if($menuItems.length > 6){
		var mod = $menuItems.length % 2;
		div = Math.floor($menuItems.length / 2) + mod;
	}

	for (var i = 0; i < $menuItems.length; i++) {
		if (i % div === 0) {
			$('<ul></ul>').appendTo('#domain-dv-menu-' + _selectedDomain + '-content');
		}
		($($menuItems[i])).appendTo("#domain-dv-menu-" + _selectedDomain + "-content > ul:last-child");
	}

	$('#domain-dv-menu').fadeToggle(50);
}

function hideDomainDVMenu() {
	$('#domain-dv-menu').hide();
	$(".domain-dv-menu-content").each(function () {
		$(this).css("display", "none");
	});
}


function refreshMessageCount() {
	var element = $("#header-user-panel-wrapper .unread-messages .message-count");
	ajaxRequestResponse({
		dataType: 'json',
		contentType: "application/json;charset=UTF-8",
		method: "GET",
		async: true,
		url: "/uop/rest/message-board/unread/count",
		success: function (json) {
			var count = json.unreadCount;
			element.removeClass("new");
			element.text(count);
			if (count > 0) {
				element.addClass("new");
			}
		}
	});
}


$(document).ready(function () {
	highlightMenuitem();
	var highlightedDomain;

	$('nav #primary-navigation').css('behavior', 'url(' + baseUrl + '/resources/javascript/html5shiv/PIE.htc); -pie-background: linear-gradient(#D2D2D7, #F0F0F2)');
	// primary navigation click handler
	$("#primary-navigation li").click(function () {
		highlightedDomain = getDomainHighlightedElement();
		var listItemId = this.id;
		var listItem = $("li#" + this.id);
		var contentContainerSelector = "div#" + this.id + "-content";
		var contentContainer = $(contentContainerSelector);
		var secondaryNav = $("#secondary-navigation");
		// add or remove css classes according to user selection
		if (listItemId !== "" && contentContainer.length > 0 && contentContainer.is(":hidden")) {
			if (secondaryNav.is(":visible")) {
				$("#primary-navigation li").removeClass("selected");
				$("#primary-navigation").addClass("collapsed");
				listItem.addClass("selected");
				$(".sec-nav-content").hide();
				contentContainer.show();
			} else {
				// Hide tertiary
				$("#tertiary-navigation").css("display", "none");
				$(".sec-nav-content").hide();
				contentContainer.show();
				$("#primary-navigation li").removeClass("selected");
				listItem.addClass("selected");
				collapsePrimaryNavigation(false);
				hideDomainDVMenu();
				secondaryNav.slideDown(300);
			}
		} else {
			secondaryNav.slideUp(100);
			$("#primary-navigation li").removeClass("selected");
			collapsePrimaryNavigation(true);
			highlightMenuitem();
		}
	});

	$('#primary-navigation li#home-nav').unbind('click');

	// add collapse class to display border
	collapsePrimaryNavigation(true);
	// expands secondary navigation menu when page is loaded
	// TODO: store somewhere wheter to open it or not
	if (false && $("#secondary-navigation").find("li.selected").length > 0) {
		$(".sec-nav-content").hide();
		$("#secondary-navigation").show();
		var contentDiv = $("#secondary-navigation").find("li.selected").parents(".sec-nav-content");
		contentDiv.show();
		$("li#" + contentDiv.attr("id").replace("-content", "")).addClass('selected');
		collapsePrimaryNavigation(false);
	}

	$('#user-panel-drop-down').on('click', function () {
		var position = $('#header-user-panel').position();
		$('#header-user-panel').css("position", "absolute").css("left", position.left + "px");
		if($('.wrap-helper').length === 0){
			$('<div style="visibility: hidden; width: 100px; height: 36px; float: right" class="wrap-helper"></div>').insertAfter('#header-user-panel');
		}


		$('#header-user-panel').toggleClass('header-user-panel-hover');
		$('#user-preferences').slideToggle("fast");
	});

	$('#primary-navigation > ul > li:not(#administration-nav, #home-nav, #legacy-data)').click(function () {
		showTertiaryNavigation.call(this, highlightedDomain);
	});

	var closeButton = $("<a>").append('<img class="close-button-icon" src="' + baseUrl + '/resources/images/icons/Icon_Close.png">').append('Close')
		.addClass("ui-button-light").button();
	closeButton.appendTo('#domain-dv-menu .close-button').click(function () {
		hideDomainDVMenu();
	});

	$('#all-dv-dropdown').on('click', function () {
		showDomainDVMenu();
	});

	$('#primary-navigation > ul > li#home-nav').click(function () {
		window.location = baseUrl + "/dashboard/show";
	});

	$('#legacy-data').on('click', function () {
		window.location = $(this).data('url');
	});
});