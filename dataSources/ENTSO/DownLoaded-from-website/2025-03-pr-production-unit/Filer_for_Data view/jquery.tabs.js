/**
 * jQuery Tabs widget overlay with default settings for UOP
 *
 * Additional tabWidth option available for easy width of each tab setting.
 * Example:
 * $("#selector").tabs({
 *                      tabWidth : [
 *                                  { index : 0, value : '120px' },
 *                                  { index : 3, value : '25%' }
 *                                 ]
*                      });
 */
(function($) {
    $.fn.initTabs = function(tabsOptions)
    {
        // checks if options were sent
        if (tabsOptions == undefined) tabsOptions = {};

        if (tabsOptions.tabWidth !== undefined)
        {
            this.each(function() {
                var listItems = $(this).find("li");
                // each tab width is defined via JSON object { index : %i, value: %w }
                for (var i = 0; i < listItems.length; i++) {
                    var widthObject = tabsOptions.tabWidth[i];
                    if (widthObject !== undefined) {
                        if ((listItems.length - 1) >= widthObject.index) {
                            $(listItems[widthObject.index]).css("width", widthObject.value);
                            //$(listItems[widthObject.index]).find("a").css("width", widthObject.value);
                        }
                    }
                }
            });
        }

        return this.tabs(tabsOptions);
    }
})(jQuery);
