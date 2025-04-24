﻿/*
 * Inspired by:
 *
 * File:        jquery.dataTables.columnFilter.js
 * Version:     1.5.0.
 * Author:      Jovan Popovic
 *
 * Copyright 2011-2012 Jovan Popovic, all rights reserved.
 */
(function ($) {
    $.fn.columnFilter = function (options) {

        var FILTER_IMAGE_URL = baseUrl + "/resources/images/icons/Icon_Filter.png";

        var asInitVals, i, label, th;

        //var sTableId = "table";
        var sRangeFormat = "From {from} to {to}";
        //Array of the functions that will override sSearch_ parameters
        var afnSearch_ = new Array();
        var aiCustomSearch_Indexes = new Array();

        var oFunctionTimeout = null;

        var fnOnFiltered = function () {
        };

        function _fnGetColumnValues(oSettings, iColumn, bUnique, bFiltered, bIgnoreEmpty) {

            // check that we have a column id
            if (typeof iColumn == "undefined") return new Array();

            // by default we only wany unique data
            if (typeof bUnique == "undefined") bUnique = true;

            // by default we do want to only look at filtered data
            if (typeof bFiltered == "undefined") bFiltered = true;

            // by default we do not wany to include empty values
            if (typeof bIgnoreEmpty == "undefined") bIgnoreEmpty = true;

            // list of rows which we're going to loop through
            var aiRows;

            // use only filtered rows
            if (bFiltered == true) aiRows = oSettings.aiDisplay;
            // use all rows
            else aiRows = oSettings.aiDisplayMaster; // all row numbers

            // set up data array	
            var asResultData = new Array();

            for (var i = 0, c = aiRows.length; i < c; i++) {
                var iRow = aiRows[i];
                var aData = oTable.fnGetData(iRow);
                var sValue = aData[iColumn];

                // ignore empty values?
                if (bIgnoreEmpty == true && sValue.length == 0) continue;

                // ignore unique values?
                else if (bUnique == true && jQuery.inArray(sValue, asResultData) > -1) continue;

                // else push the value onto the result data array
                else asResultData.push(sValue);
            }

            return asResultData.sort();
        }

        function _fnColumnIndex(iColumnIndex) {
//            if (properties.bUseColVis)
//                return iColumnIndex;
//            else
//                return oTable.fnSettings().oApi._fnVisibleToColumnIndex(oTable.fnSettings(), iColumnIndex);
            return iColumnIndex;
            //return oTable.fnSettings().oApi._fnColumnIndexToVisible(oTable.fnSettings(), iColumnIndex);
        }

        /*
         * Ensures wrapping filter input into div and adds button components
         */
        function fnCustomizeFilterInput(uopColumnId, filterElement, filterClass, headerText) {
            // wraps filter input into div
            filterElement.wrap('<div id="' + uopColumnId + '" class="dt-filter-container ' + ($(filterElement).is('select') ? 'select' : '' ) + ($(filterElement).is('div.date-range-filter') ? 'date-range' : '' )+ ' filter_column ' + filterClass + '" style="display:none;" />');
            // creates filter button
            var showFilterButton = $('<input type="image" />')
                .attr("id", uopColumnId + '-button')
                .attr("src", FILTER_IMAGE_URL)
                .addClass("right")
                .addClass("dt-filter-button");
            // adds filter box handler
            showFilterButton.click(function () {
                $("div.dt-filter-container").hide();
                // positioning
                var buttonPosition = $(this).position();
                var boxLeftPosition;
                // checks if filter button is inside some dialog window
                if ($(this).parents("div.ui-dialog:visible").length == 0) {// if not, position is computed using page dimensions
                    var pageOffset = ($("header").position().left + $("header").width());
                    boxLeftPosition = ((buttonPosition.left + 250) > pageOffset) ? buttonPosition.left - 220 : buttonPosition.left - 20;
                }
                else {// inside a dialog position is computed using dialog dimensions
                    var dialogWidth = $(this).parents("div.ui-dialog:visible").width();
                    boxLeftPosition = ((buttonPosition.left + 250) > dialogWidth) ? buttonPosition.left - 220 : buttonPosition.left - 20;
                }

                $("#" + uopColumnId)
                    .css('left', boxLeftPosition)
                    .fadeIn(200);
                $($(this).siblings('div').find("input.ui-combobox-input, input.dt-input-filter")[0]).select().focus();
            });

            $('.ui-dialog-content').dialog("option", "closeOnEscape", false);

            if (showFilterButton.siblings('div').children('div').children('input[type="text"]').length > 0) {
                showFilterButton.siblings('div').children('div').children('input[type="text"]').focus().on('keypress', function (event) {
                    if (event.keyCode == 13)
                        $(this).parent().siblings('input[type="button"]').trigger('click');
                    else if (event.keyCode == 27) {
                        $(this).parent().parent().fadeOut(200);
                        $('.ui-dialog-content').dialog("option", "closeOnEscape", true);
                        $('.dt-filter-button').focus();
                    }
                })
            } else {
                showFilterButton.siblings('div').children('input.dt-filter').focus().on('keypress', function (event) {
                    if (event.keyCode == 27) {
                        $(this).parent().fadeOut(200);
                        $('.ui-dialog-content').dialog("option", "closeOnEscape", true);
                        $('.dt-filter-button').focus();
                    }
                });
            }

            filterElement.parents("th").find('.dt-filter-container').before(showFilterButton);

            // filter firing button
            var filterButton = $("<input type='button' />")
                .attr("id", uopColumnId + "-filter-button")
                .addClass("dt-filter-trigger-button")
                .val("Filter")
                .button();

            ($(filterElement).is('div.date-range-filter') ? filterButton.addClass("dt-filter-button-date-range") : null);

            filterButton.bind("click", function () {
                $("#" + uopColumnId).fadeOut(100);
            });
            $("#" + uopColumnId).append(filterButton);

            if ($(filterElement).is("select")) {
                filterElement.css("width", "160px");
                filterElement.combobox({ setOriginalWidth: true });
            }


            return filterButton;
        }

        function fnCreateTopBottomInput(oTable) {
            var input = th.find("div.top-bottom-filter:first");

            var elementId = input.attr('id');

            var tableId = $(oTable).attr('id');

            var uopColumnId = new String('data-filter-' + elementId).split(" ").join("");

            var filterButton = fnCustomizeFilterInput(tableId + "-" + uopColumnId, input, 'filter_top_bottom', label);

            $("#"+elementId + " input").off('clearByButton').on('clearByButton', function() {
                $(filterButton).trigger('click');
            });

            var $input1 = $($("#"+elementId+" input")[0]);
            var $input2 = $($("#"+elementId+" input")[1]);

            // if the input has some initial value, table will be filtered
            if ($input1.val() !== "" && $input2.val() !== "") {
                $(input).parents("th").find(".dt-filter-button").addClass("dt-filter-button-active");
            }
        }

        function fnCreateDateRangeInput(oTable) {

            function tog(v) {
                return v ? 'addClass' : 'removeClass';
            }

            var input = th.find("div.dt-filter.date-range-filter:first");

            var elementId = input.attr('id');

            var tableId = $(oTable).attr('id');

            //input.autocomplete({ source: autoCompleteValues });
            var uopColumnId = new String('data-filter-' + label).split(" ").join("");
            var filterButton = fnCustomizeFilterInput(tableId + "-" + elementId, input, 'filter_date_range', label);

            //fields for datePicker
            //$('#' + elementId + ' #date-start').val(actualDate);

            $(null).showDatePicker({
                inputFrom: $('#' + elementId + '-date-start'),
                inputTo: $('#' + elementId + '-date-end'),
                range: true,
                arrows: true,
                type: 'day',
            });

            var $originalInputDateStart = $("#"+elementId+"-date-start");
            var $originalInputDateEnd = $("#"+elementId+"-date-end");

            var $newInputDateStart = $("#user-friendly-input-"+elementId+"-date-start");
            var $newInputDateEnd = $("#user-friendly-input-"+elementId+"-date-end");

            $newInputDateStart.addClass("dt-filter");
            $newInputDateEnd.addClass("dt-filter");

            $originalInputDateStart.off("change").on("change", function() {
                $("#user-friendly-input-"+elementId+"-date-start")[tog(this.value)]('x');
            });
            $originalInputDateEnd.off("change").on("change", function() {
                $("#user-friendly-input-"+elementId+"-date-end")[tog(this.value)]('x');
            });

            $newInputDateStart.off('clearByButton').on('clearByButton', function () {
                $originalInputDateStart.val('');
                $newInputDateStart.val('');
                $("#ui-datepicker-div").hide();
                $(filterButton).trigger('click');
            });

            $newInputDateEnd.off('clearByButton').on('clearByButton', function () {
                $originalInputDateEnd.val('');
                $newInputDateEnd.val('');
                $("#ui-datepicker-div").hide();
                $(filterButton).trigger('click');
            });

            // if the input has some initial value, table will be filtered
            if ($originalInputDateStart.val() !== "" || $originalInputDateEnd.val() !== "") {
                $originalInputDateStart.parents("th").find(".dt-filter-button").addClass("dt-filter-button-active");
            }
        }

        function fnCreateInput(oTable, regex, smart, bIsNumber, iFilterLength, iMaxLenght, autoCompleteValues) {
            var sCSSClass = "text_filter";
            if (bIsNumber)
                sCSSClass = "number_filter";

            label = label.replace(/(^\s*)|(\s*$)/ig, "").replace(/[^-_a-z0-9]*/gi, "");
            var currentFilter = oTable.fnSettings().aoPreSearchCols[i].sSearch;
            var search_init = 'search_init ';
            var inputvalue = '';
            if (currentFilter != '' && currentFilter != '^') {
                if (bIsNumber && currentFilter.charAt(0) == '^')
                    inputvalue = currentFilter.substr(1); //ignore trailing ^
                else
                    inputvalue = currentFilter;
                search_init = '';
            }

            var input = th.find("input.dt-filter:first");

            if (iMaxLenght != undefined && iMaxLenght != -1) {
                input.attr('maxlength', iMaxLenght);
            }

            var tableId = $(oTable).attr('id');

            //input.autocomplete({ source: autoCompleteValues });
            var uopColumnId = new String('data-filter-' + label).split(" ").join("");
            var filterButton = fnCustomizeFilterInput(tableId + "-" + uopColumnId, input, 'filter_text', label);

            asInitVals[i] = label;
            var index = i;

            if (bIsNumber && !oTable.fnSettings().oFeatures.bServerSide) {
                filterButton.click(function () {
                    /* Filter on the column all numbers that starts with the entered value */
                    oTable.fnFilter('^' + $("#" + $(oTable).attr('id') + '-' + uopColumnId + " input[type=text]")[0].value, _fnColumnIndex(index), true, false); //Issue 37
                    fnOnFiltered();
                });
            } else {
                filterButton.click(function () {
                    if (oTable.fnSettings().oFeatures.bServerSide && iFilterLength != 0) {
                        //If filter length is set in the server-side processing mode
                        //Check has the user entered at least iFilterLength new characters

                        var currentFilter = oTable.fnSettings().aoPreSearchCols[index].sSearch;
                        var iLastFilterLength = $("#" + $(oTable).attr('id') + '-' + uopColumnId + " input[type=text]").data("dt-iLastFilterLength");
                        if (typeof iLastFilterLength == "undefined")
                            iLastFilterLength = 0;
                        var iCurrentFilterLength = this.value.length;
                        if (Math.abs(iCurrentFilterLength - iLastFilterLength) < iFilterLength
                        //&& currentFilter.length == 0 //Why this?
                        ) {
                            //Cancel the filtering
                            return;
                        }
                        else {
                            //Remember the current filter length
                            $("#" + $(oTable).attr('id') + '-' + uopColumnId + " input[type=text]").data("dt-iLastFilterLength", iCurrentFilterLength);
                        }
                    }

                    while ($($("#" + $(oTable).attr('id') + '-' + uopColumnId + " input[type=text]")[0]).prop("validity") == false) {
                        //wait for validation of input
                    }

                    /* Filter on the column (the index) of this element */
                    oTable.fnFilter($("#" + $(oTable).attr('id') + '-' + uopColumnId + " input[type=text]")[0].value, _fnColumnIndex(index), regex, smart); //Issue 37
                    fnOnFiltered();
                });
            }

            input.addClass('dt-input-filter');

            input.focus(function () {
                if ($(this).hasClass("search_init")) {
                    $(this).removeClass("search_init");
                    this.value = "";
                }
            });
            input.blur(function () {
                if (this.value == "") {
                    $(this).addClass("search_init");
                }
            });

            $(input).keypress(function (e) {
                if (e.keyCode == '13') {
                    $(filterButton).trigger('click');
                }
            });

            $(input).on('clearByButton', function () {
                $(filterButton).trigger('click');
            });

            // if the input has some initial value, table will be filtered
            if (input.val() != "") {
                $("#" + uopColumnId + "-button").addClass("dt-filter-button-active");
                $(input).parents("th").find(".dt-filter-button").addClass("dt-filter-button-active");
            }

        }

        function fnCreateColumnSelect(oTable, aData, iColumn, nTh, sLabel, bRegex, oSelected) {
            if (aData == null)
                aData = _fnGetColumnValues(oTable.fnSettings(), iColumn, true, false, true);
            var index = iColumn;
            var currentFilter = oTable.fnSettings().aoPreSearchCols[i].sSearch;
            if (currentFilter == null || currentFilter == "")//Issue 81
                currentFilter = oSelected;

            var select = nTh.find("select.dt-filter");

            sLabel = nTh.find("span.header-text").html();

            var tableId = $(oTable).attr('id');

            var uopColumnId = new String('data-filter-' + iColumn).split(" ").join("");
            var filterButton = fnCustomizeFilterInput(tableId + "-" + uopColumnId, select, 'filter_select', sLabel);

            $(filterButton).css('display', 'none');

            //select.change(function () {
            filterButton.click(function () {
                //var val = $(this).val();
                var input = $('input[name="' + $(select).attr('id') + '_input"]');
                input.trigger('showCross');
                input.val("");
                if ($(select).val() != "-1") {
                    input.val($(select).val());
                }
                if ($(select).val() != "") {
                    $(select).removeClass("search_init");
                } else {
                    $(select).addClass("search_init");
                }
                if (bRegex)
                    oTable.fnFilter($(this).val(), iColumn, bRegex); //Issue 41
                else {
                    oTable.fnFilter(unescape($(select).val()), iColumn); //Issue 25
                }
                fnOnFiltered();
            });


//            if (currentFilter != null && currentFilter != "")//Issue 81
//                oTable.fnFilter(unescape(currentFilter), iColumn);

            $('input[name="' + $(select).attr('id') + '_input"]').on('clearByButton', function () {
                $(this).autocomplete('close');
                $(select).val('-1');
                $(filterButton).trigger('click');
            });

            $(select).keypress(function (e) {
                if (e.keyCode == '13') {
                    $(filterButton).trigger('click');
                }
            });

            $('input[name="' + $(select).attr('id') + '_input"]').on('autocompleteselect', function () {
                $(filterButton).trigger('click');
            });

            $(select).on('autocomplete-close', function () {
                $('input[name="' + $(select).attr('id') + '_input"]').trigger('showCross');
                if ($(select).val() != "") {
                    $(select).removeClass("search_init");
                } else {
                    $(select).addClass("search_init");
                }
            });

            if ($(select).find("option:selected").text() != "") {
                $("#" + uopColumnId + "-button").addClass("dt-filter-button-active");
                $(select).parents("th").find(".dt-filter-button").addClass("dt-filter-button-active");
            }
        }

        function fnCreateSelect(oTable, aData, bRegex, oSelected) {
            var oSettings = oTable.fnSettings();
            if (aData == null && oSettings.sAjaxSource != "" && !oSettings.oFeatures.bServerSide) {
                // Add a function to the draw callback, which will check for the Ajax data having
                // been loaded. Use a closure for the individual column elements that are used to
                // built the column filter, since 'i' and 'th' (etc) are locally "global".
                oSettings.aoDrawCallback.push({
                    "fn": (function (iColumn, nTh, sLabel) {
                        return function () {
                            // Only rebuild the select on the second draw - i.e. when the Ajax
                            // data has been loaded.
                            if (oSettings.iDraw == 2 && oSettings.sAjaxSource != null && oSettings.sAjaxSource != "" && !oSettings.oFeatures.bServerSide) {
                                return fnCreateColumnSelect(oTable, null, _fnColumnIndex(iColumn), nTh, sLabel, bRegex, oSelected); //Issue 37
                            }
                        };
                    })(i, th, label),
                    "sName": "column_filter_" + i
                });
            }
            // Regardless of the Ajax state, build the select on first pass
            fnCreateColumnSelect(oTable, aData, _fnColumnIndex(i), th, label, bRegex, oSelected); //Issue 37

        }

        function _fnRangeLabelPart(iPlace) {
            switch (iPlace) {
                case 0:
                    return sRangeFormat.substring(0, sRangeFormat.indexOf("{from}"));
                case 1:
                    return sRangeFormat.substring(sRangeFormat.indexOf("{from}") + 6, sRangeFormat.indexOf("{to}"));
                default:
                    return sRangeFormat.substring(sRangeFormat.indexOf("{to}") + 4);
            }
        }

        var oTable = this;

        var defaults = {
            sPlaceHolder: "head:before",
            sRangeSeparator: "~",
            iFilteringDelay: 500,
            aoColumns: null,
            sRangeFormat: "From {from} to {to}",
            sDateFromToken: "from",
            sDateToToken: "to"
        };

        var properties = $.extend(defaults, options);

        return this.each(function () {

            if (!oTable.fnSettings().oFeatures.bFilter)
                return;
            asInitVals = new Array();

            var aoFilterCells = oTable.fnSettings().aoFooter[0];

            var oHost = oTable.fnSettings().nTFoot; //Before fix for ColVis
            var sFilterRow = "tr"; //Before fix for ColVis

            if (properties.sPlaceHolder == "head:after") {
                var tr = $("tr:first", oTable.fnSettings().nTHead).detach();
                //tr.appendTo($(oTable.fnSettings().nTHead));
                if (oTable.fnSettings().bSortCellsTop) {
                    tr.prependTo($(oTable.fnSettings().nTHead));
                    //tr.appendTo($("thead", oTable));
                    aoFilterCells = oTable.fnSettings().aoHeader[1];
                }
                else {
                    tr.appendTo($(oTable.fnSettings().nTHead));
                    //tr.prependTo($("thead", oTable));
                    aoFilterCells = oTable.fnSettings().aoHeader[0];
                }

                sFilterRow = "tr:last";
                oHost = oTable.fnSettings().nTHead;

            } else if (properties.sPlaceHolder == "head:before") {

                if (oTable.fnSettings().bSortCellsTop) {
                    var tr = $("tr:first", oTable.fnSettings().nTHead).detach();
                    tr.appendTo($(oTable.fnSettings().nTHead));
                    aoFilterCells = oTable.fnSettings().aoHeader[1];
                } else {
                    aoFilterCells = oTable.fnSettings().aoHeader[0];
                }
                /*else {
                 //tr.prependTo($("thead", oTable));
                 sFilterRow = "tr:first";
                 }*/

                sFilterRow = "tr:first";

                oHost = oTable.fnSettings().nTHead;


            }

            //$(sFilterRow + " th", oHost).each(function (index) {//bug with ColVis
            $(aoFilterCells).each(function (index) {//fix for ColVis
                i = index;
                var aoColumn = { type: "text",
                    bRegex: false,
                    bSmart: true,
                    iMaxLenght: -1,
                    iFilterLength: 0
                };
                if (properties.aoColumns != null) {
                    if (properties.aoColumns.length < i || properties.aoColumns[i] == null)
                        return;
                    aoColumn = properties.aoColumns[i];
                }
                //label = $(this).text(); //Before fix for ColVis
                label = $($(this)[0].cell).text(); //Fix for ColVis
                if (aoColumn.sSelector == null) {
                    //th = $($(this)[0]);//Before fix for ColVis
                    th = $($(this)[0].cell); //Fix for ColVis
                }
                else {
                    th = $(aoColumn.sSelector);
                    if (th.length == 0)
                        th = $($(this)[0].cell);
                }

                if (aoColumn != null) {
                    if (aoColumn.sRangeFormat != null)
                        sRangeFormat = aoColumn.sRangeFormat;
                    else
                        sRangeFormat = properties.sRangeFormat;
                    switch (aoColumn.type) {
                        case "null":
                            break;
                        case "select":
                            if (aoColumn.bRegex != true)
                                aoColumn.bRegex = false;
                            fnCreateSelect(oTable, aoColumn.values, aoColumn.bRegex, aoColumn.selected);
                            break;
                        case "date-range":
                            fnCreateDateRangeInput(oTable);
                            break;
                        case "top-bottom":
                            fnCreateTopBottomInput(oTable);
                            break;
                        case "text":
                        default:
                            bRegex = (aoColumn.bRegex == null ? false : aoColumn.bRegex);
                            bSmart = (aoColumn.bSmart == null ? false : aoColumn.bSmart);
                            fnCreateInput(oTable, bRegex, bSmart, false, aoColumn.iFilterLength, aoColumn.iMaxLenght, aoColumn.values);
                            break;

                    }
                }
            });

            for (var j = 0; j < aiCustomSearch_Indexes.length; j++) {
                //var index = aiCustomSearch_Indexes[j];
                var fnSearch_ = function () {
                    var id = oTable.attr("id");
                    return $("#" + id + "_range_from_" + aiCustomSearch_Indexes[j]).val() + properties.sRangeSeparator + $("#" + id + "_range_to_" + aiCustomSearch_Indexes[j]).val();
                };
                afnSearch_.push(fnSearch_);
            }

            if (oTable.fnSettings().oFeatures.bServerSide) {

                var fnServerDataOriginal = oTable.fnSettings().fnServerData;

                oTable.fnSettings().fnServerData = function (sSource, aoData, fnCallback) {

                    for (var j = 0; j < aiCustomSearch_Indexes.length; j++) {
                        var index = aiCustomSearch_Indexes[j];

                        for (var k = 0; k < aoData.length; k++) {
                            if (aoData[k].name == "sSearch_" + index)
                                aoData[k].value = afnSearch_[j]();
                        }
                    }
                    aoData.push({ "name": "sRangeSeparator", "value": properties.sRangeSeparator });

                    if (fnServerDataOriginal != null) {
                        try {
                            fnServerDataOriginal(sSource, aoData, fnCallback, oTable.fnSettings()); //TODO: See Issue 18
                        } catch (ex) {
                            fnServerDataOriginal(sSource, aoData, fnCallback);
                        }
                    }
                    else {
                        $.getJSON(sSource, aoData, function (json) {
                            fnCallback(json);
                        });
                    }
                };

            }

        });
    };
})(jQuery);

var dtSaveState = true;
var dtPushState = false;
var dtStateSource = undefined;

/*
 * DataTable with filter initialization
 */
(function ($) {
    $.fn.initDataTable = function (dataTablesOptions) {

        function tog(v) {
            return v ? 'addClass' : 'removeClass';
        }

        $(document).on('input', 'input.dt-input-filter',function () {
            $(this)[tog(this.value)]('x');
        }).on('mousemove', '.x',function (e) {
            $(this)[tog(this.offsetWidth - 18 < e.clientX - this.getBoundingClientRect().left)]('onX');
        }).on('click', '.onX', function () {
            $(this).removeClass('x onX').val('').trigger('keyup').trigger('clearByButton');
        });


        // State source is sent via datatables options
        // TODO: Determinate why is this option not set in datatables impl
        dtStateSource = dataTablesOptions.bStateSource;

        if (typeof(dataTablesOptions.getCustomFilterData) !== "undefined") {
            var originalServerData = dataTablesOptions.fnServerData;
            // additional filter
            dataTablesOptions.fnServerData = function (sSource, aoData, fnCallback) {
                // call filter function which gets objects with key and value attributes
                var additionalFilter = dataTablesOptions.getCustomFilterData();
                if (additionalFilter != undefined && additionalFilter != null) {
                    // creates new filter object
                    var filter = new Object();
                    for (var i = 0; i < additionalFilter.length; i++) {
                        filter[additionalFilter[i].key] = additionalFilter[i].value;
                    }

                    var filterColumnsObject = { "name": "filteredColumns", "value": filter };

                    for (i = 0; i < aoData.length; i++) {
                        if (aoData[i].name != undefined && aoData[i].name == "filteredColumns") {
                            filterColumnsObject = null;
                            aoData[i].value = filter;
                        }
                    }
                    if (filterColumnsObject != null) aoData.push(filterColumnsObject);
                }

                if (originalServerData != null) {
                    try {
                        originalServerData(sSource, aoData, fnCallback, oTable.fnSettings()); //TODO: See Issue 18
                    } catch (ex) {
                        originalServerData(sSource, aoData, fnCallback);
                    }
                }
                else {
                    $.getJSON(sSource, aoData, function (json) {
                        fnCallback(json);
                    });
                }
            };
        }
        // table draw event handler
        this.bind("draw", function (eventArgs) {
            if (dataTablesOptions.bPaginate != false) {
                // create custom pager
                createPager(this);
            }
            redrawButtons(this);
            // border styling
            $(this).find("tr").each(function () {
                //        $(this).find("td:first").css("border-left", "none"); //HotFix TPI-1480
                //        $(this).find("td:last").css("border-right", "none");
            });
            // redraw filter button
            $(this).find("th").each(function (index) {

                var topInputValue = $($(this).find("input.dt-filter")[1]).val();

                if(topInputValue != undefined) {
                    var bottomInputValue = $($(this).find("input.dt-filter")[0]).val();
                    if(bottomInputValue !== "" || topInputValue !== "" ) {
                        $(this).find(".dt-filter-button").addClass("dt-filter-button-active");
                    } else {
                        $(this).find(".dt-filter-button").removeClass("dt-filter-button-active");
                    }
                } else {
                    var inputValue = $(this).find("input.dt-filter").val();
                    if (inputValue == undefined)
                        inputValue = $(this).find("select.dt-filter option:selected").text();

                    if (inputValue != "")
                        $(this).find(".dt-filter-button").addClass("dt-filter-button-active");
                    else $(this).find(".dt-filter-button").removeClass("dt-filter-button-active");
                }
            });
            // show / hide page size select
            var pageSizeSelect = $(this).parent().find("div.dataTables_length select[name=" + $(this).attr("id") + "_length]");

            if ($(this).find("td.dataTables_empty").length > 0) {
                pageSizeSelect.parents("div.dataTables_length").hide();
            }
            else {
                pageSizeSelect.parents("div.dataTables_length").show();
            }

            if (typeof(fixIE8Appearance) != "undefined") {
                fixIE8Appearance($(this).parent());
            }
        });

        dtSaveState = false;
        // calls filter plugin
        var filterOptions = createFilterOptions(this);
        var ret = this.dataTable(dataTablesOptions).columnFilter({
            aoColumns: filterOptions
        });
        dtSaveState = true;

        ret.resetAllFilters = function () {
            resetFilter(ret);
        };

        // create page length select
        createPageSizeSelect(this);
        // unbind all events in header (sorting and filtering is accessible only via controls)
        this.find("th").unbind();
        // additional styling
        //this.find("th:first").css("border-left", "none"); //HotFix TPI-1480
        //this.find("th:last").css("border-right", "none");
        this.find("tr").each(function () {
            //$(this).find("td:first").css("border-left", "none"); //HotFix TPI-1480
            //$(this).find("td:last").css("border-right", "none");
        });
        // create sort inputs
        createSorter(this, ret);

        return ret;


        /*
         * Creates filter plugin options object
         */
        function createFilterOptions(tableElement) {

            // Store the filter into hiddenfield so the column filter plugin can read it
            if ($("#" + tableElement.attr("id") + "_settings").length == 0) {
                var urlParam = new String(getUrlParameterByName('tableSettings'));
                $("<input type='hidden' id='" + tableElement.attr("id") + "_settings' />").val(urlParam).appendTo($("#" + tableElement.attr("id")).parent());
            }

            // variables
            var _filterOptions = new Array();
            var filterAdded = false;
            var hiddenInputID = tableElement.attr("id") + "_settings";
            var filterSettings = new Array();
            // reads table settings from hidden input
            var settingsObject = null, settingsString = $("#" + hiddenInputID).val();
            if (settingsString != "" && settingsString != "undefined" && settingsString != undefined) {
                // if some settings found, extract filter settings into array
              try {
                settingsObject = JSON.parse(settingsString);

                for (var i = 0; i < settingsObject.aoSearchCols.length; i++) {
                    var splitter = settingsObject.aoSearchCols[i].split('|');
                    filterSettings[splitter[0] * 1] = splitter.slice(1).join("|");
                }
              } catch (e) {
              }
            }
            // creates filter plug-in options
            tableElement.find("th").each(function (index) {
                if ($(this).children('select.dt-filter').length > 0) {
                    _filterOptions[index] = {
                        type: "select"
                    };
                    filterAdded = true;
                    // sets default value from filter settings
                    if (filterSettings[index] != undefined) {
                        $(this).children('select.dt-filter').val(filterSettings[index]);
                    }
                } else if ($(this).children('div.dt-filter.top-bottom-filter').length > 0) {
                    _filterOptions[index] = {
                        type: "top-bottom"
                    };
                    filterAdded = true;
                } else if ($(this).children('div.dt-filter.date-range-filter').length > 0) {
                    _filterOptions[index] = {
                        type: "date-range"
                    };
                    filterAdded = true;
                    /*// sets default value from filter settings
                    if (filterSettings[index] != undefined) {
                        $(this).children('input.dt-filter').val(filterSettings[index]);
                    }*/
                } else if ($(this).children('input.dt-filter').length > 0) {
                    _filterOptions[index] = {
                        type: "text"
                    };
                    filterAdded = true;
                    // sets default value from filter settings
                    if (filterSettings[index] != undefined) {
                        $(this).children('input.dt-filter').val(filterSettings[index]);
                    }
                }
                else {
                    _filterOptions[index] = null;
                }
            });

            if (filterAdded) {
                // dispose filter box when clicked somewhere out of it
                $(document).click(function (event) {
                    // hide only if target is out of filter container
                    // -AND- target is not combobox item
                    // -AND- target is not the filter triggering button
                    if ($(event.target).parents(".dt-filter-container").length == 0
                        && $(event.target).parents("ul.ui-combobox-active").length == 0
                        && !$(event.target).hasClass("dt-filter-button"))
                        $(".dt-filter-container").hide();
                });
            }

            return _filterOptions;
        }

        /*
         * Creates custom pager with own styles
         */
        function createPager(tableElement) {
            // original pager div id
            var pagerId = tableElement.id + "_paginate";
            // id for cloned pager
            var newPagerId = pagerId + "-custom";
            // remove previous
            $("#" + newPagerId).remove();
            // clone with event handlers
            var pager = $("#" + pagerId).clone(true, true);
            // recreate id
            pager.attr("id", pagerId + "-custom");
            // recreate child ids
            pager.find("*").each(function () {
                var id = $(this).attr("id");
                if (id !== undefined)
                    $(this).attr("id", id + "-custom");
            });
            // show if hidden
            pager.css("display", "");
            // append to page
            $(tableElement).siblings(".newBottom").append(pager);
            // hide original pager
            $("#" + pagerId).hide();
            // button styling - first, previous
            $("#" + newPagerId + " > a.paginate_button:first").button({
                icons: {
                    primary: "ui-icon-first-page",
                    secondary: null
                },
                text: false
            }).next("a.paginate_button").button({
                icons: {
                    primary: "ui-icon-previous-page",
                    secondary: null
                },
                text: false
            });
            // button styling - next, last
            $("#" + newPagerId + " > a.paginate_button:last").button({
                icons: {
                    primary: "ui-icon-last-page",
                    secondary: null
                },
                text: false
            }).prev("a.paginate_button").button({
                icons: {
                    primary: "ui-icon-next-page",
                    secondary: null
                },
                text: false
            });
            // number buttons
            $("#" + newPagerId + " > span > a.paginate_button").addClass('ui-button-light').button();

            if (typeof(fixIE8Appearance) != "undefined") {
                fixIE8Appearance(pager);
            }
        }

        /*
         * Creates page size buttons
         */
        function createPageSizeSelect(tableElement) {
            // select page length
            var pageSizeSelect = tableElement.parent().find("div.dataTables_length select[name=" + tableElement.attr("id") + "_length]");

            // creates button elements
            pageSizeSelect.find("option").each(
                function (index) {
                    // link
                    var anchor = $("<a></a>")
                        .html($(this).val())
                        .attr("value", $(this).val())
                        .addClass('dt-length-select');
                    if ($(this).attr('selected') == 'selected')
                        anchor.addClass("ui-button-light-selected");
                    // link handler
                    anchor.click(function () {
                        pageSizeSelect.val($(this).attr('value'));
                        pageSizeSelect.trigger("change.DT");
                        $(this).parents("div.dataTables_length").find(".dt-length-select").removeClass("ui-button-light-selected");
                        $(this).addClass("ui-button-light-selected");
                    });
                    // add to page
                    anchor.addClass('ui-button-light').button();
                    pageSizeSelect.parents("div.dataTables_length").append(anchor);
                    pageSizeSelect.hide();
                });
            // remove hover actions
            pageSizeSelect.find(".ui-button-light").removeClass("ui-state-default").unbind('mouseenter mouseleave');

            if (tableElement.find("td.dataTables_empty").length > 0) {
                pageSizeSelect.parents("div.dataTables_length").hide();
            }
            else {
                pageSizeSelect.parents("div.dataTables_length").show();
                if (typeof(fixIE8Appearance) != "undefined") {
                    fixIE8Appearance(pageSizeSelect.parents("div.dataTables_length"));
                }
            }
        }

        /*
         * Creates sorting images into table header
         */
        function createSorter(tableElement, dataTable) {
            // consts
            // default images
            var defaultSortImageAsc = baseUrl + '/resources/images/icons/Icon_Filter-Down.png';
            var defaultSortImageDesc = baseUrl + '/resources/images/icons/Icon_Filter-Up.png';
            // active images
            var activeSortImageAsc = baseUrl + '/resources/images/icons/Icon_Filter-Down_Active.png';
            var activeSortImageDesc = baseUrl + '/resources/images/icons/Icon_Filter-Up_Active.png';
            // click handlers
            tableElement.find("th").each(function (index) {
                if ($(this).hasClass("sorting")) {
                    // get index included non-visible columns
                    var realIndex = dataTable.fnSettings().oApi._fnVisibleToColumnIndex(dataTable.fnSettings(), index);

                    // asc sorting image
                    var imgAsc;
                    if ($(this).hasClass("sorting_asc"))
                        imgAsc = $("<img class='sort-asc-image dt-sorting-active' src='" + activeSortImageDesc + "' />");
                    else imgAsc = $("<img class='sort-asc-image' src='" + defaultSortImageAsc + "' />");

                    imgAsc.click(function () {
                        $(".sort-asc-image", $(this).parents("table")).removeClass("dt-sorting-active").attr("src", defaultSortImageAsc);
                        $(".sort-desc-image", $(this).parents("table")).removeClass("dt-sorting-active").attr("src", defaultSortImageDesc);
                        ret.fnSort([
                            [realIndex, 'asc']
                        ]);
                        $(this).addClass("dt-sorting-active");
                        $(this).attr("src", activeSortImageDesc);
                    });
                    if ($(this).find("div.dt-filter-container").length > 0)
                        $(this).find("div.dt-filter-container").before(imgAsc);
                    else $(this).append(imgAsc);
                    // desc sorting image
                    var imgDesc;

                    if ($(this).hasClass("sorting_desc"))
                        imgDesc = $("<img class='sort-desc-image dt-sorting-active' src='" + activeSortImageAsc + "' />");
                    else imgDesc = $("<img class='sort-desc-image' src='" + defaultSortImageDesc + "' />");

                    imgDesc.click(function () {
                        $(".sort-asc-image", $(this).parents("table")).removeClass("dt-sorting-active").attr("src", defaultSortImageAsc);
                        $(".sort-desc-image", $(this).parents("table")).removeClass("dt-sorting-active").attr("src", defaultSortImageDesc);
                        ret.fnSort([
                            [realIndex, 'desc']
                        ]);
                        $(this).addClass("dt-sorting-active");
                        $(this).attr("src", activeSortImageAsc);
                    });
                    if ($(this).find("div.dt-filter-container").length > 0)
                        $(this).find("div.dt-filter-container").before(imgDesc);
                    else $(this).append(imgDesc);
                }
            });
        }

        /*
         * Resets all table header filters
         */
        function resetFilter(aDataTable) {
            if (typeof(aDataTable.fnSettings) != "undefined") {
                aDataTable.find('.dt-filter').val('');

                var originalSettings = aDataTable.fnSettings();
                var search = originalSettings.aoPreSearchCols;

                for (var i = 0; i < search.length; i++) {
                    if (search[i].sSearch != undefined && search[i].sSearch != "")
                        search[i].sSearch = "";
                }

                originalSettings.aoPreSearchCols = search;
                aDataTable.fnSettings = function () {
                    return originalSettings;
                };
            }
        }

        /*
         * Button styling
         */
        function redrawButtons(tableElement) {
            // every button for styling has pre-table-button class
            $(tableElement).find("a.pre-table-button").each(function () {
                var currentAnchor = $(this);
                var disabled = currentAnchor.hasClass('ui-state-disabled');
                // buttons with ui-button-light class should be skipped
                if (!currentAnchor.hasClass("ui-button-light")) {
                    currentAnchor.addClass('ui-button-light').button({text: false, disabled: disabled});
                    currentAnchor.removeClass("ui-state-default").unbind('mouseenter mouseleave');
                }
            });

            if (typeof(fixIE8Appearance) != "undefined") {
                fixIE8Appearance($(tableElement).find("a.pre-table-button"));
            }
        }
    };
})(jQuery);
