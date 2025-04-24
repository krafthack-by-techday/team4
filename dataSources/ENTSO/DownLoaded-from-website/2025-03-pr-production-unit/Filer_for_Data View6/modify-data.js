function initModifyDialog() {
    serverErrorCodeMapping.FAILED_TO_CONTACT_SERVER = ':message:';

    var val = $('#is-outage').val();
    if (val !== undefined && val != null && val === 'true') {
        initOutageModifyDialog();
    } else {
        initCommonModifyDialog();
    }
}

function initCommonModifyDialog() {
    serverErrorCodeMapping.CAPACITY_PRODUCT_DOES_NOT_EXIST = ':message:';
    serverErrorCodeMapping.MISSING_MANDATORY_ATTRIBUTE = ['#master-error-message'];

    $('.attribute-select').combobox({ noSorting: true });

    $(".attribute-select").on("change", function() {
        if(this.value === "null"){
            $(".cross_border_capacity_limits_reason_text").prop('disabled', true).removeAttr('value');
        }else{
            $(".cross_border_capacity_limits_reason_text").prop('disabled', false);
        }
    });

    $('form#attributes-form').validation({

        submitHandler: function (form) {

            var canceled = $('form#attributes-form').hasClass("canceled");
            if (canceled) {
                $('label.error-message').show();
                return false;
            }

            var submitResult = $('#submitted').val();
            if (submitResult === undefined || submitResult === 'true') {
                return false;
            }

            var data = new Array();

            $('.attribute-input')
                    .filter('input, select')
                    .each(function (index) {
                var attributeId = $(this).attr('id');
                var attributeValue = $(this).val();
                if (attributeValue === "NIL" && $(this).is("select")) {
                    attributeValue = "";
                }
                data.push('"' + attributeId + '": "' + attributeValue + '"');
            });

            data = '{' + data + '}';
            $('#target-values').val(data);
            ajaxRequestResponse({
                method: 'post',
                url: '/modifyData/saveValues',
                data: $('#attributes-form').serialize(),

                success: function (data) {
                    $('#submitted').val('true');
                    $('#dialog-content').dialog('close');
                }
            });
        }
    });

    $('#DAILY_IMPL_AUCTION_ALLOC_CAP\\;PRICE').keyup(function() {
        if($('#DAILY_IMPL_AUCTION_ALLOC_CAP\\;PRICE').val() !== ""){
            $('#DAILY_IMPL_AUCTION_ALLOC_CAP\\;SPOT_PRICE_DIFFERENCE').attr('disabled','disabled');
        }else{
            $('#DAILY_IMPL_AUCTION_ALLOC_CAP\\;SPOT_PRICE_DIFFERENCE').removeAttr('disabled');
        }
    });

    $('#DAILY_IMPL_AUCTION_ALLOC_CAP\\;SPOT_PRICE_DIFFERENCE').keyup(function() {
        if($('#DAILY_IMPL_AUCTION_ALLOC_CAP\\;SPOT_PRICE_DIFFERENCE').val() !== ""){
            $('#DAILY_IMPL_AUCTION_ALLOC_CAP\\;PRICE').attr('disabled','disabled');
        } else{
            $('#DAILY_IMPL_AUCTION_ALLOC_CAP\\;PRICE').removeAttr('disabled');
        }
    });
}

var subjectsArray;
function initOutageModifyDialog() {
    serverErrorCodeMapping.DATE_NOT_VALID = ['#error-message'];
    serverErrorCodeMapping.INTERVAL_NOT_VALID = ['#error-message'];
    serverErrorCodeMapping.PLANNED_OUTAGE_MUST_HAVE_END = ['#outage-end'];
    serverErrorCodeMapping.OUTAGE_SUBJECT_REQUIRED = ['#error-message'];
    serverErrorCodeMapping.REASON_CODE_MUST_BE_SUPPLIED = ['#reason-code'];
    serverErrorCodeMapping.REASON_TEXT_IS_REQUIRED = ['#reason'];


    $('#outage-start').showDatePicker({type: 'dayTime', showTimeZone: true});
    $('#outage-end').showDatePicker({type: 'dayTime', showTimeZone: true});

    $('#status').combobox();
    $('#asset-type').combobox();
    $('#outageType').combobox();

    $('form#attributes-form').validation({
        submitHandler: function (form) {

            $('#outage-subjects').val(subjectsArray.toString());

            ajaxRequestResponse({
                method: 'post',
                url: '/modifyData/saveOutageValues',
                data: $('#attributes-form').serialize(),

                success: function (data) {
                    $('#dialog-content').dialog('close');
                }
            });
        }
    });

    var subjects = $('#outage-subjects').val();
    if (subjects) {
        subjectsArray = subjects.split(",")
    } else {
        subjectsArray = new Array();
    }

    bindAddEvent();
    bindRemoveEvent();

    initOutageDatatable();
}

function initOutageDatatable() {
    definitionTable = $('#a-outage-subjects').initDataTable({
        "bLengthChange": true,
        "bInfo": false,
        "bFiltr": false,
        "bServerSide": true,
        "bProcessing": true,
        "bAutoWidth": false,

        "sAjaxSource": "/table/data/adapter",

        "fnServerData": function (sSource, aoData, fnCallback) {
            ajaxRequestResponse({
                dataType: 'json',
                contentType: "application/json;charset=UTF-8",
                method: 'post',
                url: sSource,
                data: stringify_aoData(aoData),
                success: function (json) {
                    fnCallback(json);
                }
            });
        },
        "fnServerParams": function (aoData) {
            aoData.push({ "name": "serviceName", "value": "outageSubjectsDatatableAdapter" });
        },
        "fnRowCallback": function (nRow, aData) {
            $(nRow).attr("id", aData[0])
            return nRow;
        },
        "sServerMethod": "POST",
        "sDom": 'rt<"newBottom"lip><"clear">',
        "sPaginationType": "full_numbers",
        "aLengthMenu": [
            [10, 25, 50, 100],
            [10, 25, 50, 100]
        ],
        "oLanguage": {
            "sEmptyTable": "No data found for criteria selected",
            "sInfoEmpty": "No News to show in the table",
            "sInfo": "_END_ of _TOTAL_ Auctions",
            "sLengthMenu": "Subjects per page _MENU_",
            "sSearch": "Search all columns:"
        },
        "aoColumns": [
            // must be the first element
            {"sName": "code", "bVisible": false},
            { "sClass": "news-second-column", "bSortable": false, "sName": "code"},
            { "sClass": "news-second-column", "bSortable": false, "sName": "domainIdentifier"},
            { "sClass": "news-second-column", "bSortable": false, "sName": "isoFrom", "sWidth" : "80px"},
            { "sClass": "news-second-column", "bSortable": false, "sName": "isoTo", "sWidth" : "80px"},
            { "sClass": "button-column", "bSortable": false, "fnRender": function (oObj) {
                return "<a title='Add' class='addSubject pre-table-button operation-detail-expand'></a>";
            }
            }
        ],
        "aaSorting": [
            [0, 'desc']
        ]
    });
}

/**
 * Bind events for adding, removing outage subject
 */
function bindAddEvent() {
    $(document).off('click', '#a-outage-subjects tbody td .addSubject');
    $(document).on('click', '#a-outage-subjects tbody td .addSubject', function () {
        var targetTablePos = $('#s-outage-subjects').find("tbody");
        var thisRow = $(this).parent('td').parent('tr');
        var newRow = thisRow.clone();

        var imgClass = 'removeSubject pre-table-button operation-delete ui-button-light ui-button ui-widget ui-corner-all ui-button-text-only';

        newRow.find('td:last').empty().append(
            "<a title='Remove' class='" + imgClass + "'></a>"
        );
        var code = getCode(this);
        if (!isInList(code)) {
            addSubject(code);
            targetTablePos.append(newRow);
            $('#subject-message').empty();
        } else {
            $('#subject-message').empty().append('This Outage subject is already selected.');
        }

        // fix IE8 appearance of closing dialog
        if (typeof(fixIE8Appearance) !== "undefined") {
            var element = $(".ui-dialog-content .table-container");
            fixIE8Appearance(element);
            fixIE8BackgroundPosition(element);
        }
    });
}

/**
 * Unbind
 */
function bindRemoveEvent() {
    $(document).off('click', '#s-outage-subjects tbody td .removeSubject');
    $(document).on('click', '#s-outage-subjects tbody td .removeSubject', function () {
        removeSubject(getCode(this));
        $(this).closest('tr').remove();
        $('#subject-message').empty();

        // fix IE8 appearance of closing dialog
        if (typeof(fixIE8Appearance) !== "undefined") {
            var element = $(".ui-dialog-content .table-container");
            fixIE8Appearance(element);
            fixIE8BackgroundPosition(element);
        }
    });
}

function getCode(source) {
    var nTr = $(source).parents('tr')[0];
    return $(nTr).attr('id');
}

/**
 * Simple set implementation
 *
 * -->
 */
function addSubject(code) {
    subjectsArray.push(code);
}

function isInList(code) {
    for (var i = subjectsArray.length; i--;) {
        if (subjectsArray[i] === code) {
            return true;
        }
    }
    return false;
}

function removeSubject(code) {
    for (var i = subjectsArray.length; i--;) {
        if (subjectsArray[i] === code) {
            subjectsArray.splice(i, 1);
        }
    }
}
/**
 *  <--
 */
