// Configuration
var showUnexpectedErrors = true;
var fireAlertDialogs = false;

//TODO (Petr Chudoba): Formalize message
var fatalErrorMessage = "<p class='common-error-message'>An error has occurred while performing user action. Please contact the system administrator for further assistance.</p>";

/*
 * Shows modal dialog informing about fatal error
 */
function showRequestFailedErrorDialog(errorCode, errorMessage)
{
	// common message
	var dialogDiv = $('<div id="fatalErrorDialog" title="Error occurred"></div>');
	dialogDiv.html(fatalErrorMessage);
	// display error code
	if (errorCode != undefined && errorCode != null)
	{
		dialogDiv.append("<label>Error code:</label>");
		dialogDiv.append(new String("<p class='errorCode'>").concat(errorCode,"</p>"));
	}
	// display error message
	if (errorMessage != undefined && errorMessage != null)
	{
		dialogDiv.append("<label>Error description:</label>");
		dialogDiv.append(new String("<p class='errorMessage'>").concat(errorMessage,"</p>"));
	}
	// show error dialog
	var fatalErrorDialogOptions = { 
									draggable: false, 
									modal: true, 
									resizable: false, 
									width: "600px", 
									heigth: "200px",  
									buttons: {
										"OK": function() {
											$(this).dialog( "close" );
											$("#fatalErrorDialog").remove();
										}
									}};
	dialogDiv.dialog(fatalErrorDialogOptions);
}

function showDisplayedValueHasBeenUpdatedDialog(errorMessage)
{
	// common message
	var dialogDiv = $('<div id="fatalErrorDialog" title="Value has been updated"></div>');
	// display error message
	if (errorMessage != undefined && errorMessage != null)
	{
		dialogDiv.append(new String("<p class='errorMessage'>").concat(errorMessage,"</p>"));
	}
	// show error dialog
	var fatalErrorDialogOptions = {
		draggable: false,
		modal: true,
		resizable: false,
		width: "600px",
		heigth: "200px",
		buttons: {
			"OK": function() {
				$(this).dialog( "close" );
				$("#fatalErrorDialog").remove();
			}
		}};
	dialogDiv.dialog(fatalErrorDialogOptions);
}

function showCannotRevalidateInfoMessage(errorMessage) {
	$(	'<div id="success-message" style="text-align: center;">' +
			'<img class="left" style="padding-right: 0;" src="/resources/images/icons/Icon_Big_Information.png"/>' +
			'<div class="message-content" style="margin-right: 40px">' + errorMessage + '</div>' +
		'</div>').appendTo('body').initDialog({
			title: 'Information',
			modal: true,
			width: 500,
			buttons: [{text: 'OK', click: function(){
					$('#success-message').dialog('close');
				}}],
			close: function(){
				$('#success-message').remove();
			}
		});
}

/*
 * Shows modal dialog informing about Access denied
 */
function showAccessDeniedDialog(errorCode, errorMessage)
{
    // common message
    var dialogDiv = $('<div id="fatalErrorDialog" title="Forbidden"></div>');
    // display error message
    if (errorMessage != undefined && errorMessage != null)
    {
        dialogDiv.append(new String("<p class='errorMessage'>").concat(errorMessage,"</p>"));
    }
    // show error dialog
    var fatalErrorDialogOptions = {
        draggable: false,
        modal: true,
        resizable: false,
        width: "250px",
        heigth: "150px",
        buttons: {
            "OK": function() {
                $(this).dialog( "close" );
                $("#fatalErrorDialog").remove();
            }
        }};
    dialogDiv.dialog(fatalErrorDialogOptions);
}

/*
 * JavaScript unexpected error handling
 */
function handleJavaScriptError(message, url, lineNumber, colNumber, error)
{
    var errorCode = null;

    var errorMessagePrefix = url == 'undefined'
        ? new String()
        : new String("Error in ").concat(url," (line ",lineNumber,"): <br>");
    var errorMessage = errorMessagePrefix.concat(message);
	if (showUnexpectedErrors)
	{
		showRequestFailedErrorDialog(errorCode, errorMessage);
	}
    $("body").attr("JSError",errorMessage);
	return false;
}

/*
 * Default window.alert override 
 */
function uopAlert(message)
{
	message = new String("UOP alert suppressed. Original message: ").concat(message);
	initConsole();
	console.log(message);
}

/*
 * Initializes console object if it is not provided by browser
 */
function initConsole()
{
	// preventing javascript errors when browser console is undefined
	if (!window.console) {
		console = {};
		console.log = function(){};
		console.warn = function(){};
		console.error = function(){};
		console.info = function(){};
	}
}

// register error event handler
window.onerror = handleJavaScriptError;
// overriding window.alert using proxy design pattern
(function() {
	var proxied = window.alert;
	window.alert = function(msg) {
		uopAlert(msg);
		if (fireAlertDialogs)
			return proxied.apply(this, arguments);
		};
	})();
