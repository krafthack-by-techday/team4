/**
 * jQuery Accordion widget overlay with default settings for UOP
 */
(function($) {
	$.fn.initAccordion = function(accordionOptions) 
	{
		// checks if options were sent
		if (accordionOptions == undefined) accordionOptions = new Object();
		// adds Emfip icons
		accordionOptions.icons = {
			      header: "uop-ui-accordion-header-icon",
			      activeHeader: "uop-ui-accordion-header-active-icon"
			    };
		// sets autoheight
		accordionOptions.heightStyle = "content";
		// sets all panels collapsible
		accordionOptions.collapsible = true;
		// sets all panels collapsed at start
		accordionOptions.active = false;
		// active event handling
		var originalHandler = accordionOptions.activate;
		accordionOptions.activate = function (event, ui)
		{
			// calls original added handler
			if (typeof(originalHandler) == "function")
			{
				originalHandler();
			}
			
			$(".ui-accordion-header").removeClass("ui-corner-top")
									 .removeClass("ui-corner-all");
		};
		// gets the return value
		var result = this.accordion(accordionOptions);
		// initial style fix
		$(".ui-accordion-header").removeClass("ui-corner-top");
		$(".ui-accordion-header").removeClass("ui-corner-all");
		
		return result;
	};
})(jQuery);