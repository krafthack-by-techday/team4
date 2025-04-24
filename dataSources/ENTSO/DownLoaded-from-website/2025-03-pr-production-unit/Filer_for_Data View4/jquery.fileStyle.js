/*
 * Style File - jQuery plugin for styling file input elements
 *  
 * Copyright (c) 2007-2008 Mika Tuupola
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Based on work by Shaun Inman
 *   http://www.shauninman.com/archive/2007/09/10/styling_file_inputs_with_css_and_the_dom
 *
 * Revision: $Id$
 *
 */

(function($) {

    $.fn.filestyle = function(options) {

        var settings = {
            width : 250
        };

        if(options) {
            $.extend(settings, options);
        };

        return this.each(function() {

            var self = this;
            var wrapper = $("<div>")
                .css({
                    "width": settings.imagewidth + "px",
                    "height": settings.imageheight + "px",
                    "background": "url(" + settings.image + ") 0 0 no-repeat",
                    "background-position": "right",
                    "display": "inline",
                    "position": "absolute",
                    "visibility": "hidden"
                });

            var filename = $('<input class="file">')
                .addClass($(self).attr("class"))
                .attr("name", $(self).attr("name") + "_overlay")
                .css({
                    "display": "inline",
                    "width": settings.width + "px",
                    "margin-right" : "5px"
                })
                .click(function () { $(self).click();$(this).blur(); });

            var button = $("<button>")
                .html('Browse File')
                .attr("id", $(self).attr("name") + "_button")
                .click(function (e) {e.preventDefault();$(self).click(); })
                .button();

            $(self).before(filename).after(button);
            $(self).wrap(wrapper);

            $(self).css({
                "position": "relative",
                "height": settings.imageheight + "px",
                "width": settings.width + "px",
                "display": "inline",
                "cursor": "pointer",
                "opacity": "0.0"
            });

            if ($.browser.mozilla) {
                if (/Win/.test(navigator.platform)) {
                    $(self).css("margin-left", "-142px");
                } else {
                    $(self).css("margin-left", "-168px");
                };
            } else {
                $(self).css("margin-left", settings.imagewidth - settings.width + "px");
            };

            $(self).bind("change", function() {
                filename.val($(self).val());
            });
        });


    };

    $.fn.enableFileInput = function() {
        $(this).parent().siblings("input,button").removeProp("disabled");
    };

    $.fn.disableFileInput = function() {
        $(this).parent().siblings("input,button").prop("disabled", true);
    };
})(jQuery);