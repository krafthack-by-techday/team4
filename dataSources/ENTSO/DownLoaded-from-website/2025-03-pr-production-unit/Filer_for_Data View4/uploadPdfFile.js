function bindEventToUploadPDFButton() {
    $("#show-upload-dialog-button").off('click').on("click", function () {
        if (!$(this).button('option', 'disabled')) {
            var url = $('input[name=bdi-url]').val();
            showEditValuePDFDialog(url);
        }
    });
}

var uploading = false;
var success = false;
var sizeValid = true;
var twoRegistersHaveBeenSelected = false;

function showEditValuePDFDialog(url) {
    ajaxRequestResponse({
        contentType: "application/json;charset=UTF-8",
        method: "GET",
        enctype: 'multipart/form-data',
        async: false,
        url: url,
        data: $("#upload-pdf-domain").serialize(),
        success: function (detail) {
            $('<div id="dialog-content"></div>').appendTo('body').append(detail).triggerCallback(initPDFUploadDialog()).initDialog({
                title: 'PDF Upload',
                modal: true,
                width: 640,
                topCloseButton: {text: "Close"},
                buttons: {
                    "Upload": function () {
                        var shuttleBoxRight = $('select.shuttlebox-right');
                        if (shuttleBoxRight.length > 0) {
                            var errorReason = $('#error-reason');
                            var selectedOptions = shuttleBoxRight.find("option");
                            if (selectedOptions.length < 2) {
                                var pdfAreaType = $("#pdf-area-type").val();
                                var areaType = (pdfAreaType === undefined) ? 'Control' : pdfAreaType;
                                errorReason.text('At least two ' + areaType + ' Areas must be specified.');
                                shuttleBoxRight.showError('', null, 'error-message uploading-error-message');
                                twoRegistersHaveBeenSelected = false;
                            } else {
                                $('form-legend').hideError(null);
                                shuttleBoxRight.hideError(null);
                                errorReason.empty();
                                twoRegistersHaveBeenSelected = true;
                            }
                        } else {
                            twoRegistersHaveBeenSelected = true;
                        }
                        if (sizeValid && twoRegistersHaveBeenSelected) {
                            $("#infoMessage").css('opacity', '0');
                            uploading = true;
                            uploadingProgress();
                            $('#upload-form').submit();
                        }
                    }
                },
                close: function () {
                    $('#dialog-content').remove();
                    uploading = false;
                }
            });
        }
    });

}

function initFileInput() {
    var fileInput = $('#file');
    var textInput = $('#file-text');
    var browseButton = $('#browse-button').button();

    textInput.click(function () {
        $(fileInput).click();
        $(this).blur();
    });
    browseButton.click(function (e) {
        e.preventDefault();
        $(fileInput).click();
    });
    $(fileInput).on("change", function () {
        textInput.val($(fileInput).val());
    });
}

function initPDFUploadDialog() {
    initFileInput();
    initShuttleBox();
    $('#publicationDate').showDatePicker({
        range: false,
        type: 'dayTime',
        arrows: false,
        showTimeZone: false
    });
    $('#intervalStart').each(function() {
        $(this).showDatePicker({
            range: false,
            type: 'day',
            arrows: false,
            showTimeZone: false
        });
    });
    $('#intervalEnd').each(function () {
        $(this).showDatePicker({
            range: false,
            type: 'day',
            arrows: false,
            showTimeZone: false
        });
    });
    $('#year').each(function () {
        $(this).showDatePicker({
            range: false,
            type: 'year',
            arrows: false,
            showTimeZone: false
        });
    });
    $('#quarterDate').each(function() {
        $(this).showDatePicker({
            range: false,
            type: 'quarter',
            arrows: false,
            showTimeZone: false
        });
    });
    if (typeof dataViewName !== 'undefined') {
        $('#formDataItemName').html(dataViewName);
    }
    if (typeof areaName !== 'undefined') {
        $('#areaName').html(areaName);
    }
    if (typeof areaTypeName !== 'undefined') {
        $('#areaTypeName').html(areaTypeName);
    }
    if (typeof registerItemCode !== 'undefined') {
        $('#registerItemCode').val(registerItemCode);
    }
    if (typeof registerItemCode !== 'string') {
        $('#registerItemCode').val(areaName);
    }

    var errorClasses = {};
    errorClasses.errorMessageClass = 'error-message uploading-error-message';

    $('#file').on('change', function () {
        if ($(this)[0].files[0] != null) {
            if ($(this)[0].files[0].size > 52428800) {
                $('#file-text').showError('Maximum file size is 50 MB.', null, errorClasses);
                sizeValid = false;
            } else {
                $('#file-text').hideError(null);
                sizeValid = true;
            }
        } else {
            $('#file-text').hideError(null);
            sizeValid = true;
        }
    });
}

function initShuttleBox() {
    var shuttleBoxSelect = $('div.shuttle-boxes > select');
    var pdfAreaType = $("#pdf-area-type").val();
    var areaType = (pdfAreaType === undefined) ? "Control" : pdfAreaType;
    if (shuttleBoxSelect.length === 0) {
        return;
    }
    shuttleBoxSelect.each(function () {
        $(this).shuttleBox({
            leftLabel: "Available " + areaType + " Areas: <span class='required-field'>*</span>",
            rightLabel: "Associated " + areaType + " Areas:"
        });
    });
}

function uploadingProgress() {
    $('#dialog-content + .ui-dialog-buttonpane button').button('disable');
    $('.uploading-1, .uploading-2, .uploading-3').css('opacity', '0');
    $('#uploading-wrapper').off('uploading').on('uploading', function () {
        $('#uploading-wrapper .uploading-1').animate({opacity: 1}, function () {
            $('#uploading-wrapper .uploading-1').animate({opacity: 0});
            $('#uploading-wrapper .uploading-2').animate({opacity: 1}, function () {
                $('#uploading-wrapper .uploading-2').animate({opacity: 0});
                $('#uploading-wrapper .uploading-3').animate({opacity: 1}, function () {
                    $('#uploading-wrapper .uploading-3').animate({opacity: 0}, function () {
                        if (uploading) {
                            $('#uploading-wrapper').trigger('uploading');
                        } else {
                            $('#uploading-wrapper').off('uploading').fadeOut(function () {
                                if (success) {
                                    setDatePickerValue('publicationDate', '');
                                    setDatePickerValue('intervalStart', '');
                                    setDatePickerValue('intervalEnd', '');
                                    $('#file, #file-text, #description, #version').val('');
                                }
                                $('input.confirmation').remove();
                                $("#infoMessage").trigger('uploaded').off('uploaded');
                                $('#dialog-content + .ui-dialog-buttonpane button').button('enable');
                            });
                        }
                    });
                });
            });
        });
    }).fadeIn().trigger('uploading');
}

function onFrameLoad() {
    success = false;
    var confirmMsg = $("#upload-frame").contents().find(".confirm-message");
    if ($(confirmMsg).length !== 0) {
        var confirmationDialog = $(confirmMsg).find("#confirmationDiv");
        if ($(confirmationDialog).length !== 0) {
            showConfirmation($(confirmMsg).attr("data-confirmName"), $(confirmationDialog));
        }
    }
    var errorMsg = $("#upload-frame").contents().find(".error-message");
    if ($(errorMsg).length !== 0) {
        var errorMessage = $("#errorMessage");
        if ($(errorMessage).length !== 0) {
            uploading = false;
            $(errorMessage).html($(errorMsg).text());
        }
    }
    var infoMsg = $("#upload-frame").contents().find(".info-message");
    if ($(infoMsg).length !== 0) {
        var infoMessage = $("#infoMessage");
        if ($(infoMessage).length !== 0) {
            if ($(infoMsg).text() == 'File was uploaded.') {
                $(infoMessage).on('uploaded', function () {
                    $(infoMessage).html($(infoMsg).text()).animate({opacity: 1});
                });
                success = true;
                uploading = false;
            }
        }
    }
    $('.uploading-1, .uploading-2, .uploading-3').stop(false, true);
}

function showConfirmation(confirmName, content) {
    $('<div id="confirmation-frame"></div>').appendTo('body').append(content).initDialog({
        title: 'Confirmation',
        modal: true,
        width: 800,
        topCloseButton: {text: "Cancel"},
        buttons: {
            "Confirm upload": function () {
                $("#infoMessage").css('opacity', '0');
                uploading = true;
                uploadingProgress();
                $('#confirmation-frame').trigger('dialogclose').remove();
                $('#upload-form')
                    .append('<input type="hidden" name="' + confirmName + '" class="confirmation" value="true" />');
                $('#upload-form').submit();
            }
        },
        close: function () {
            $('#confirmation-frame').remove();
        }
    });
}

//Set URL and hyperlink for download file of Data Flow
function getPath() {
    initButtons();
    $(".download").empty();
    var links = $(".download-path");
    for (var i in links) {
        var path = links[i];
        var pathLink = $("<a></a>");
        pathLink.attr("href", "javascript:downloadPdf('" + path.value + "');");
        var fileName = $(".file-name").eq(i);
        pathLink.html(fileName.val());
        $(".download").eq(i).append(pathLink);
    }
}
//For download file of Data Flow
function downloadDataFlow(docPath) {
    downloadFile(baseUrl + '/dms_web/show_download', [
        { 'key': 'path', 'value': docPath }
    ]);
}

function downloadPdf(id) {
    var method = 'post';
    var input = new String();
    input = input.concat('<input type="hidden" name="').concat("id").concat('" value="').concat(id).concat('" />');
    var url = baseUrl + downloadUrl;
    jQuery('<form action="' + url + '" method="' + method + '">' + input + '</form>').appendTo('body').submit().remove();

    return false;
}

function deleteFile(deleteFileUrl, id) {
    var nTr = $("#" + id);
    var fileName = nTr.find('input.file-name').val();
    $('<div id="dialog-content"></div> ').appendTo('body').append('<img class="left" style="padding-right: 15px;" src="' + baseUrl + '/resources/images/icons/Icon_Big_Information.png" /><div class="message-content">This operation cannot be undone. Are you sure you want to delete <span class="bold">' + fileName + "</span> ?</div>").initDialog({
        modal: true,
        width: 500,
        title: 'Delete PDF File',
        buttons: [
            {
                text: "Delete",
                click: function () {
                    ajaxRequestResponse({
                        url: deleteFileUrl,
                        method: 'GET',
                        securityTokenCheck: true,
                        data: {
                            id: id
                        },
                        success: function () {
                            changeFilter();
                            $('#dialog-content').dialog('close');
                        }
                    })
                    $('#dialog-content').dialog('close');
                }},
            {
                text: "Cancel",
                click: function () {
                    $('#dialog-content').dialog('close');
                }
            }
        ],
        close: function () {
            $('#dialog-content').remove();
        }
    });
}
function initButtons() {
    var deleteButtons = $(".delete-pdf-file");
    for (var i in deleteButtons) {
        $(".delete-pdf-file").eq(i).button();
    }
}
