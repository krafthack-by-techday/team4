/*
 * UOP jQuery dialog extender 
 */
(function($) {
	$.fn.initDialog = function(dialogOptions) {
		// disable dragging and resizing
		dialogOptions.draggable = false;
		dialogOptions.resizable = false;
		// TODO: implement dialog type to set default width
        dialogOptions.width = dialogOptions.width - 30;
        dialogOptions.closeDivClasses = dialogOptions.closeDivClasses || [];

		// vigw91 - Fix TPI-1661
		this.on("dialogopen", function (event, ui) { 
			window.setTimeout(function() {
				$(".ui-widget-overlay").unbind();
				$(document).unbind("focusin");    
	        }, 0);
		});
        
		// creates basic jquery dialog
		var result = this.dialog(dialogOptions);
		// adds close button on top
		if (dialogOptions.topCloseButton !== null && dialogOptions.topCloseButton !== undefined)
		{
			// top close button defined without text
			if (dialogOptions.topCloseButton.text == null || dialogOptions.topCloseButton.text == undefined)
			{
				dialogOptions.topCloseButton.text = "Close";
			}
			// creating html
			var closeDiv = $("<div>");
			closeDiv.addClass("top-close-button-container");
			dialogOptions.closeDivClasses.forEach(className => closeDiv.addClass(className));

			var closeButton = $("<a>").html(dialogOptions.topCloseButton.text).addClass("ui-button-light").button();
			closeDiv.append(closeButton);
			result.on( "dialogclose", function( event, ui ) { closeDiv.empty().remove(); } );
			
			closeButton.click(function () { result.dialog('close'); });
			this.parents(".ui-dialog").before(closeDiv);
			// positioning
			closeDiv.css("top", this.parents(".ui-dialog").position().top + "px")
					.css("left", Math.ceil(this.parents(".ui-dialog").position().left + (this.parents(".ui-dialog").outerWidth() - closeDiv.outerWidth())) + "px");
			
			this.parents(".ui-dialog").css("top", (this.parents(".ui-dialog").position().top + 50) + "px");
			
			// fix IE8 appearance of closing dialog
			if (typeof(fixIE8Appearance) != "undefined") {
				fixIE8Appearance(closeDiv);
			}
		}
		// removes rounded corners
		this.parents(".ui-dialog").removeClass("ui-corner-all");
		
		return result;
	};
	
	$("html").on("dialogopen", function(event, ui) {
		// fix IE8 appearance in dialog
		if (typeof(fixIE8Appearance) != "undefined") {
			fixIE8Appearance($(event.target).parents(".ui-dialog"));
		}
	});
	
})(jQuery);