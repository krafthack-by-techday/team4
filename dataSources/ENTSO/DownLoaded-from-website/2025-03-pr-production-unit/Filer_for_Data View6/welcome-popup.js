/**
 Welcome popup window - see TPEET-201 - 141222_Transparency Platform checklist_V2.docx - last page
 */

$(document).ready(function($) {

	// do not how popup on mobile device
	if (typeof mobileView !== 'undefined' && mobileView) {
		return;
	}

	var COOKIE_NAME = "emfip-welcome";
	var exceptionUrl = ["homepageLogin", "content/static_content/Static%20content/terms%20and%20conditions/terms%20and%20conditions.html"];

	// when cookie already exists do nothing
	var cookie = getCookie(COOKIE_NAME);
	if (cookie != "") {
		return;
	}
	// check exception URL
	var i;
	for (i = 0; i < exceptionUrl.length; i++) {
		if (document.URL.indexOf(exceptionUrl[i]) >= 0) {
			return;
		}
	}

	// prepare callback
	var initWelcomePopupContent = function () {
		$("#welcome-popup #close-button").html('I Agree');
		$("#welcome-popup #close-button").button().click(function () {
			setCookie(COOKIE_NAME, true, 1*365);
			$('#welcome-popup').remove();
		});
	};

	// load dialog content
	ajaxRequestResponse({
		method: 'GET',
		url: '/content/static_content/download?path=/Static%20content/welcome popup/welcome popup.html',
		success: function (response) {

			response = '<div class="logo"></div>' + response;
			response += '<div class="center button-wrapper"><div id="close-button">Close this window and go to the<br />ENTSO-E Transparency Platform</div></div>';
			response += '<p class="center">Thank you for your visit.</p>';

			$('<div id="welcome-popup"></div>').appendTo('body').html(response).triggerCallback(initWelcomePopupContent()).initDialog({
				modal: true,
				width: 620,
				closeOnEscape: false,
				topCloseButton: {
					text: "Close"
				}
			});;
			$('.top-close-button-container').css('display', 'none');
		}
	});
});
