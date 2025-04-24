function openAbout(){

    // do not how popup on mobile device
    if (typeof mobileView !== 'undefined' && mobileView) {
        return;
    }

    // prepare callback
    var initAboutPopupContent = function () {
       $("#about-popup #close-button").html('Close');
        $("#about-popup #close-button").button().click(function () {
            $('#about-popup').remove();
        });
    };

    // load dialog content
    ajaxRequestResponse({
        method: 'GET',
        url: '/content/static_content/download?path=/Static%20content/about%20ENTSO-E/about popup.html',

        success: function (response) {

            response += '<div class="center button-wrapper"><div id="close-button"></div></div>';

            $('<div id="about-popup"></div>').appendTo('body').html(response).triggerCallback(initAboutPopupContent()).initDialog({
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
}
