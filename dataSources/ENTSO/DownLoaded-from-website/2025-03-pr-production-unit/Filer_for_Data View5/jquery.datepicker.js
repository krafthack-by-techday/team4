/*
 * jQuery UI Monthpicker
 *
 * @licensed MIT <see below>
 * @licensed GPL <see below>
 *
 * @author Luciano Costa
 * http://lucianocosta.info/jquery.mtz.monthpicker/
 *
 * Depends:
 * jquery.ui.core.js
 */

/**
 * MIT License
 * Copyright (c) 2011, Luciano Costa
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * GPL LIcense
 * Copyright (c) 2011, Luciano Costa
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var iconPrevious = '';
var iconNext = '';
var datePickersMap = new Object(); // input-id -> datePicker-id
//TPM-1179 - Offset which say -> start dropdown in year 2014
var startYearOffset = 2014 - new Date().getFullYear();

var timeResolutionToTimeStep = {
    "PT1S": 1,
    "PT4S": 1,
    "PT1M": 1,
    "PT15M": 15,
    "PT30M": 30,
    "PT60M": 60,
    "P1D": 60,
    "P7D": 60,
    "P1M": 60,
    "P1Y": 60
};

var getUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

function datePickersComparator(first, second, callback) {
    var firstValue = viewToServer.call($('input[id$=' + first + '].hasDatepicker'), $('input[id$=' + first + '].hasDatepicker').val(), $('#' + first).data('datepicker-type'));
    var secondValue = viewToServer.call($(second), $(second).val(), $('input[id="' + $(second).attr('id').replace('user-friendly-input-', '') + '"]').data('datepicker-type'));

    // empty datepickers
    if (firstValue != "" && secondValue != "") {
        firstValue = firstValue.match(/((0[0-9])|([1-2][0-9])|(3[0-1])).((0[1-9])|(1[0-2])).([1-2][0-9]{3}) (([0-1][0-9])|(2[0-3])):([0-5][0-9])/)[0]; // extract date and time
        secondValue = secondValue.match(/((0[0-9])|([1-2][0-9])|(3[0-1])).((0[1-9])|(1[0-2])).([1-2][0-9]{3}) (([0-1][0-9])|(2[0-3])):([0-5][0-9])/)[0];

        var firstDate = moment(firstValue, 'DD.MM.YYYY HH:mm');
        var secondDate = moment(secondValue, 'DD.MM.YYYY HH:mm');

        if (callback && typeof(callback) === "function") {
            return callback(firstDate, secondDate);
        }
    }
    return true;
}

function getQuarterInitialMonth(i) {
    switch(i) {
        case(0):
            return 1;
        case(1):
            return 4;
        case(2):
            return 7;
        default:
            return 10;
    }
}

function translateOffset(strOffset) {
    var translationMap = {
        "D": 0,
        "D   1": 1,
        "D   2": 2,
        "D - 1": -1,
        "D - 2": -2
    }
    return translationMap[strOffset];
}

/*
 * formats Date object by input pattern
 * returns string
 */
(function ($) {
    jQuery.fn.buttonToInput = function () {

        var buttonInInput = $('<a class="button-in-input" title="Click to open date picker" href="javascript:"></a>');

        $(this).css({
            'border-width': '0px',
            'outline': 'none'
        }).wrap('<div id="input-button-wrapper-' + $(this).attr('id') + '" class="div-button-in-input"></div>').parent().attr('class', $(this).attr('class') + ' div-button-in-input').append(buttonInInput).append('<span class="button-in-input-span"></span>');
        $(this).click(function(){
            $(this).trigger('opendatepicker');
        });
        buttonInInput.click(function () {
            $(this).css('outline', 'none').siblings('input').trigger('opendatepicker');
        });
    };
})(jQuery);

function serverToView(input, input2) {
    var timeRegexp = /([0-9]{2}):([0-9]{2})/;
    var dateRegexp = /^(([0-9]{2}).){2}[0-9]{4}/;

    input = input.match(/((0[0-9])|([1-2][0-9])|(3[0-1])).((0[1-9])|(1[0-2])).([1-2][0-9]{3}) (([0-1][0-9])|(2[0-3])):([0-5][0-9])\|((CET)|(WET)|(EET)|(GET)|(Asia\/Tbilisi)|(UTC))\|((DAY(TIME)?(RANGE)?)|(WEEK)|(MONTH)|(YEAR)|(QUARTER)|(SEMESTER))/);
    if (input)
        input = input[0];
    else
        return '';

    timeZones = {
        'CET': 'CET / CEST',
        'WET': 'WET / WEST',
        'EET': 'EET / EEST',
        'GET': 'GET',
        'Asia/Tbilisi': 'GET',
        'UTC': 'UTC'
    };

    input = input.toUpperCase();

    var type = input.match(/[A-Z]*$/)[0];

    switch (type) {
        case 'DAYTIME':
        {
            var date = input.match(dateRegexp);
            if (date)
                date = date[0];
            else
                date = new Date().format('dd.MM.yyyy');

            var time = input.match(timeRegexp);
            if (time)
                time = time[0];
            else
                time = '00:00';

            var timeZone = input.match(/([a-zA-Z]{3})(?=\|)/);
            if (timeZone)
                timeZone = timeZones[timeZone[0]];
            else
                timeZone = 'UTC';

            if (time == '24:00') {
                time = '23:59';
            }

            return date + ' ' + time;
        }
        case 'DAY':
        {
            var date = input.match(dateRegexp);
            if (date)
                date = date[0];
            else
                date = new Date.format('dd.MM.yyyy');

            return date;
        }
        case 'WEEK':
        {
            var date = input.match(dateRegexp);
            if (date) {
                date = moment(date, 'DD.MM.YYYY');
            } else {
                date = moment();
            }
            return date.startOf('isoweek').format('W (DD.MM.YYYY - ') + date.endOf('isoweek').format('DD.MM.YYYY)');
        }
        case 'MONTH':
        {
            var date = input.match(dateRegexp);
            if (date) {
                var month = date[0].split('.')[1];
                var year = date[0].split('.')[2];
            } else {
                return new Date().format('MM/yyyy');
            }
            ;
            return month + '/' + year;
        }
        case 'YEAR':
        {
            var date = input.match(dateRegexp);
            if (date) {
                date = date[0].split('.')[2];
            } else {
                date = new Date().format('yyyy');
            }
            ;
            return date;
        }
        case 'QUARTER':
        {
            var date = input.match(dateRegexp);
            var month, year, quarter;
            if (date) {
                var dateParts = date[0].split('.');
                month = dateParts[1] - 1;
                year = dateParts[2] - 0;
            } else {
                var now = new Date();
                month = now.getMonth();
                year = now.getFullYear();
            }
            quarter = Math.floor((month + 3) / 3);
            return year + '/Q' + quarter;
        }
        case 'SEMESTER':
        {
            var date = input.match(dateRegexp);
            var startMonth, endMonth;
            var year;
            if (date) {
                startMonth = date[0].split('.')[1] * 1;
                year = date[0].split('.')[2] * 1;
            } else {
                startMonth = new Date().format('MM') * 1;
                year = new Date().format('yyyy') * 1;
            }
            endMonth = startMonth + 5 > 12 ? startMonth + 5 - 12 : startMonth + 5;
            return (startMonth < 10 ? '0' + startMonth : startMonth) + '-' + (endMonth < 10 ? '0' + endMonth : endMonth) + '/' + year;
        }
        case 'DAYTIMERANGE':
        {
            var date = input.match(dateRegexp);
            if (date) {
                date = date[0];
            } else {
                date = new Date().format('dd.MM.yyyy');
            }
            if (input2 == null) {
                input2 = input;
            }

            var timeFrom = input.match(timeRegexp),
                timeTo = input2.match(timeRegexp);

            if (timeFrom && timeTo) {
                timeFrom = timeFrom[0] == "00:00" ? "" : (timeFrom[0] == "24:00" ? "23:59" : timeFrom[0]);
                timeTo = timeTo[0] == "00:00" ? "" : (timeTo[0] == "23:59" ? "24:00" : timeTo[0]);

                if (timeFrom == "") {
                    return date;
                } else {
                    return date + " " + timeFrom + " - " + timeTo;
                }
            } else {
                timeFrom = "";
                timeTo = "";

                return date;
            }
        }
    }
};

function viewToServer(input, type, dayOffset) {
    var timeRegexp = /([0-9]{2}):([0-9]{2})/;
    var dateRegexp = /^(([0-9]{2}).){2}[0-9]{4}/;

    if (!input || input == '') {
        return '';
    }

    var date = '',
        time = '',
        timeZone = '',
        defaultTimeZone = '';

    if ($(this).hasClass('hasDatepicker')) {
        defaultTimeZone = $('#' + $(this).attr('id').replace('user-friendly-input-', '')).val();
        if (defaultTimeZone) {
            defaultTimeZone = defaultTimeZone.match(/(UTC)|(CET)|(WET)|(EET)|(GET)|(Asia\/Tbilisi)/);
            if (defaultTimeZone) {
                defaultTimeZone = defaultTimeZone[0];
            } else {
                defaultTimeZone = 'UTC';
            }
        } else {
            defaultTimeZone = 'UTC';
        }
    } else {
        defaultTimeZone = 'UTC';
    }

    switch (type) {
        case 'DAYTIME':
            date = input.match(dateRegexp);
            if (date)
                date = date[0];
            else
                date = new Date().format('dd.MM.yyyy');

            time = input.match(timeRegexp);
            if (time)
                time = time[0] == '24:00' ? '23:59' : time[0];
            else
                time = '00:00';

            timeZone = input.match(/[a-zA-Z \/]*$/);
            if (timeZone && timeZone[0] != '')
                timeZone = timeZone[0].replace(' ', '').substring(0, 3);
            else
                timeZone = defaultTimeZone;
            break;

        case 'DAY':
            date = input.match(dateRegexp);
            if (date)
                date = date[0];
            else
                new Date().format('dd.MM.yyyy');
            timeZone = defaultTimeZone;
            time = '00:00';
            break;
	    case 'WEEK':
		    date = input.match(/^[0-9]{1,2}\(([0-9]{2}\.){2}[0-9]{4}-([0-9]{2}\.){2}[0-9]{4}\)$/);
		    time = '00:00';
		    timeZone = defaultTimeZone;
			if(date){
			    date = date[0].match(/([0-9]{2}\.){2}[0-9]{4}/)[0];
		    } else {
				date = moment().locale('en-gb').startOf('week').format('DD.MM.YYYY');
			}
		    break;
        case 'MONTH':
            time = '00:00';
            timeZone = defaultTimeZone;
            date = input.match(/^((0[1-9])|(1[0-2]))\/([0-9]{4})$/);
            if (date) {
                var year = date[0].split('/')[1];
                var month = date[0].split('/')[0];
                date = new Date(year * 1, (month * 1) - 1).format('dd.MM.yyyy');
            } else {
                date = new Date().format('dd.MM.yyyy');
            }
            break;
        case 'YEAR':
            time = '00:00';
            timeZone = defaultTimeZone;
            date = '01.01.' + input;
            break;
        case 'QUARTER':
            time = '00:00';
            timeZone = defaultTimeZone;
            date = input.match(/^([0-9]{4})\/Q[1-4]$/);
            if (date) {
                var year = date[0].split('/')[0];
                var quarter = date[0].split('/')[1].replace('Q','');
                var month = getQuarterInitialMonth(quarter-1);
                date = new Date(year * 1, (month * 1) - 1).format('dd.MM.yyyy');
            } else {
                date = new Date().format('dd.MM.yyyy');
            }
            break;
        case 'SEMESTER':
            time = '00:00';
            timeZone = defaultTimeZone;
            var month = input.match(/^[0-9]{2}(?=-)/);
            var year = input.match(/[0-9]{4}$/);
            if (month && year) {
                month = month[0];
                year = year[0];
                date = '01.' + month + '.' + year;
            } else {
                date = new Date().format('dd.MM.yyyy');
            }
            break;
        case 'DAYTIMERANGE':
            var timeFrom, timeTo;

            date = input.match(dateRegexp);
            if (date) {
                date = date[0];
            } else {
                date = new Date().format('dd.MM.yyyy');
            }

            time = input.match(/([0-9]{2}):([0-9]{2})/g);
            if (time) {
                timeFrom = time[0];

                if (time.length > 1) {
                    timeTo = time[1];
                } else {
                    timeTo = '00:00';
                }
            } else {
                timeFrom = timeTo = '00:00';
            }

            timeFrom = timeFrom === '24:00' ? '23:00' : timeFrom;
            timeTo = timeTo === '24:00' ? '23:59' : timeTo;

            timeZone = input.match(/[a-zA-Z \/]*$/);
            if (timeZone && timeZone[0] != '')
                timeZone = timeZone[0].replace(' ', '').substring(0, 3);
            else
                timeZone = defaultTimeZone;

            var result = {};
            result.from = date + " " + timeFrom + "|" + timeZone + "|" + type;

            if (dayOffset) {
                date = moment(date, 'DD.MM.YYYY').add('days', dayOffset * 1).format('DD.MM.YYYY');
            }
            result.to = date + " " + timeTo + "|" + timeZone + "|" + type;

            return result;
            break;
    }

    return date + ' ' + time + '|' + timeZone + '|' + type;
}

/*
 * formats Date object by input pattern
 * returns string
 */
Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    };

    if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return format;
};


// get number of week in year
Date.prototype.getWeek = function () {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
};

// returns count of miliseconds in week

function weeksToMilliseconds(weeks) {
    return 1000 * 60 * 60 * 24 * 7 * (weeks - 1);
}

// returns first week of specified year in Date object

function firstWeekOfYear(year) {
    var date = new Date();
    date = firstDayOfYear(date, year);
    date = firstWeekday(date);
    return date;
}

// returns firs day of specified year as Date object

function firstDayOfYear(date, year) {
    date.setYear(year);
    date.setDate(1);
    date.setMonth(0);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}

// Sets the given date as the first day of week of the first week of year.

function firstWeekday(firstOfJanuaryDate) {
    var FIRST_DAY_OF_WEEK = 1; // Monday, according to iso8601
    var WEEK_LENGTH = 7; // 7 days per week
    var day = firstOfJanuaryDate.getDay();
    day = (day === 0) ? 7 : day; // make the days monday-sunday equals to 1-7 instead of 0-6
    var dayOffset = -day + FIRST_DAY_OF_WEEK; // dayOffset will correct the date in order to get a Monday
    if (WEEK_LENGTH - day + 1 < 4) {
        // the current week has not the minimum 4 days required by iso 8601 => add one week
        dayOffset += WEEK_LENGTH;
    }
    return new Date(firstOfJanuaryDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
}

// returns firs day of specified week and year as Date object

function firstDayOfWeek(week, year) {
    if (year == null) {
        year = (new Date()).getFullYear();
    }
    var date = firstWeekOfYear(year),
        weekTime = weeksToMilliseconds(week),
        targetTime = date.getTime() + weekTime;

    return date.setTime(targetTime);
}

// returns last day of week
Date.prototype.endWeek = function () {
    return new Date(this.getFullYear(), this.getMonth(), (7 - this.getDay()) + this.getDate());
};

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function getDateOfISOWeek(w, y) {
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    if (dow <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
}
// callback on afterShow event
$(function () {
    $.datepicker._updateDatepicker_original = $.datepicker._updateDatepicker;
    $.datepicker._updateDatepicker = function (inst) {
        $.datepicker._updateDatepicker_original(inst);
        var afterShow = this._get(inst, 'afterShow');
        if (afterShow) afterShow.apply((inst.input ? inst.input[0] : null)); // trigger custom callback
    };
});

//zabraneni zavreni pickeru pri kliknuti na datum
$(function () {
    $.datepicker._selectDateOverload = $.datepicker._selectDate;
    $.datepicker._selectDate = function (id, dateStr) {
        var target = $(id);
        var inst = this._getInst(target[0]);
        inst.inline = true;
        $.datepicker._selectDateOverload(id, dateStr);
        inst.inline = false;
        this._updateDatepicker(inst);
    };
});

/*
 * show weekPicker
 * options:
 *    arrows: true|false - show arrows around input
 */
(function ($) {

    jQuery.fn.weekPicker = function (options) {
        var startDate = '';
        var endDate = '';
        var weekNumber = '';
        var strStartDate = '',
            strEndDate = '';
        var arrows = options && options.arrows;

        var $originalInput = $(this);
        $originalInput.data('datepicker-type', 'WEEK');
        var $input = $('<input type="text" id="user-friendly-input-' + $originalInput.attr('id') + '">').css('left', $originalInput.position().left + 'px').css('top', $originalInput.position().top + 'px').insertAfter(this);
        $originalInput.css('display', 'none');

        var selectCurrentWeek = function () {
            window.setTimeout(function () {
                $input.find('.ui-datepicker-current-day a').addClass('ui-state-active');
            }, 1);
        };
        // duplicita kodu,  z hlediska usetreni casu neoptimalizovano...
        var initialDate = $originalInput.val().match(/^(([0-9]{2}.){2})[0-9]{4}/);
        if (initialDate) {
            initialDate = new Date(initialDate[0].split('.')[2] * 1, initialDate[0].split('.')[1] * 1 - 1, initialDate[0].split('.')[0] * 1); // yyyy, MM, dd
            $input.datepicker('setDate', initialDate);
            // Do not use moment.js week()
            var weekNumber = parseInt(moment(initialDate).format("W"));
            $input.val((weekNumber < 10 ? '0' + weekNumber : weekNumber) + '(' + initialDate.format('dd.MM.yyyy') + '-' + initialDate.endWeek().format('dd.MM.yyyy') + ')');
        }
        ;

        $input.attr('readonly', 'readonly');

        if (arrows) {
            $input.wrap('<div class="originalinput-wrapper" id="originalinput-wrapper-' + $input.attr('id') + '"></div>');
            $input.before('<div title="Previous" id="date-arrow-left-' + $input.attr('id') + '" class="datepicker-arrow-left">');
            $input.after('<div title="Next" id="date-arrow-right-' + $input.attr('id') + '" class="datepicker-arrow-right">');
            $input.siblings('div').on('click', function () {
                var startDate = $input.val().match(/([0-3][0-9]\.){2}([1-2][0-9]{3})(?=\-)/);
                var increment = $(this).hasClass('datepicker-arrow-right') ? 1 : -1;
                var sYear, sMonth, sDay;
                if (startDate) {
                    sYear = startDate[0].split('.')[2] * 1;
                    sMonth = startDate[0].split('.')[1] * 1;
                    sDay = startDate[0].split('.')[0] * 1;
                } else {
                    var today = new Date();
                    sDay = today.getDate();
                    sMonth = today.getMonth() + 1;
                    sYear = today.getFullYear();
                }
                startDate = new Date(sYear, sMonth - 1, sDay);
                var newStartDate;
                if (increment == 1) {
                    newStartDate = getDateOfISOWeek(getWeekNumber(startDate) + 1, sYear);
                } else {
                    newStartDate = getDateOfISOWeek(getWeekNumber(startDate) - 1, sYear);
                }
                // Do not use moment.js week()
                var newWeekNumber = getWeekNumber(newStartDate);
                var newEndDate = newStartDate.endWeek();
                var output = (newWeekNumber < 10 ? '0' + newWeekNumber : newWeekNumber) + '(' + newStartDate.format('dd.MM.yyyy') + "-" + newEndDate.format('dd.MM.yyyy') + ')';
                $input.val(output);
                $originalInput.val(newStartDate.format('dd.MM.yyyy') + ' 00:00|UTC|WEEK');
                $originalInput.trigger("change");
            });
        }

        $input.buttonToInput();

        $input.on('opendatepicker', function () {
            initialDate = $originalInput.val().match(/^(([0-9]{2}.){2})[0-9]{4}/);
            if (initialDate) {
                initialDate = new Date(initialDate[0].split('.')[2] * 1, initialDate[0].split('.')[1] * 1 - 1, initialDate[0].split('.')[0] * 1); // yyyy, MM, dd
            } else {
                initialDate = new Date();
            }
            ;
            $input.datepicker('setDate', initialDate);
            $input.datepicker("show");
            $input.val(getWeekNumber(initialDate) + '(' + initialDate.format('dd.MM.yyyy') + '-' + initialDate.endWeek().format('dd.MM.yyyy') + ')');
        });

        $input.datepicker({
            showOn: 'button',
            buttonImage: null,
            buttonImageOnly: true,
            showWeek: true,
            firstDay: 1,
            showButtonPanel: true,
            dateFormat: 'dd.mm.yy',
            showOtherMonths: true,
            selectOtherMonths: true,
            changeYear: true,
            changeMonth: true,
            yearRange: startYearOffset+":+90",
            monthNamesShort: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
            onSelect: function (dateText, inst) {
                var date = $(this).datepicker('getDate');
                //TPM-2051 - When clicked on Sunday bad week was showing, because sunday is 0 from getDay()
                var dayInWeek = date.getDay();
                if(dayInWeek==0){
                    dayInWeek=7;
                }
                startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1 - dayInWeek);
                endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1 - dayInWeek + 6);
                var dateFormat = inst.settings.dateFormat || $.datepicker._defaults.dateFormat;
                strStartDate = $.datepicker.formatDate(dateFormat, startDate, inst.settings);
                strEndDate = $.datepicker.formatDate(dateFormat, endDate, inst.settings);

                selectCurrentWeek();
                $input.datepicker('hide');
            },
            beforeShowDay: function (date) {
                var cssClass = '';
                if (date >= startDate && date <= endDate) cssClass = 'ui-datepicker-current-day';
                return [true, cssClass];
            },
            onChangeMonthYear: function (year, month, inst) {
                selectCurrentWeek();
            },
            afterShow: function () {
                // pripraveno pro pouziti, zatim nevim poradne, kam to dat...
                // var initialDate = $originalInput.val().match(/^(([0-9]{2}.){2})[0-9]{4}/);
                // if(initialDate){
                // 	initialDate = new Date(initialDate[0].split('.')[2] * 1, initialDate[0].split('.')[1] * 1 - 1, initialDate[0].split('.')[0] * 1); // yyyy, MM, dd
                // } else {
                // 	initialDate = new Date();
                // };

                $('.ui-datepicker-close').css('display', 'none');
                $('.ui-datepicker-current').css('display', 'none');
                $('.ui-datepicker-buttonpane').append('<span class="ui-datepicker-current" id="set-week-button">This week</span>');
                $('#set-week-button').on('click', function () {
                    $('#ui-datepicker-div').fadeOut('fast');
                    $input.datepicker('setDate', new Date());
                    $('.ui-datepicker-today > a').trigger('click');
                });
                //
                $('th.ui-datepicker-week-col').html('Week');
                $('td.ui-datepicker-week-col').on('click', function () {
                    $(this).siblings('td:has(a):first').children('a').trigger('click');
                });
                //
                $('table.ui-datepicker-calendar tr:has(td)').on('mousemove', function () {
                    $(this).find('td a').addClass('ui-state-hover');
                });
                $('table.ui-datepicker-calendar tr:has(td)').on('mouseleave', function () {
                    $(this).find('td a').removeClass('ui-state-hover');
                });
                $('tr > td:has(a):nth-child(2) > a').each(function () {
                    $(this).css('margin-left', '5px');
                });
                //
                $('tr:has(td) > td > a').on('click', function () {
                    weekNumber = $(this).parent().siblings('td:first').html().match(/[0-9]*/);
                });

                // fix IE8 appearance of closing dialog
                if (typeof(fixIE8Appearance) != "undefined") {
                    fixIE8Appearance($('.ui-datepicker'));
                }
            },
            onClose: function () {
                if (strStartDate && strEndDate) {
                    $input.val(weekNumber + '(' + strStartDate + '-' + strEndDate + ')');
                    $originalInput.val(strStartDate + ' 00:00|UTC|WEEK');
                    $originalInput.trigger("change");
                }
                ;
            }
        });

    };
})(jQuery);

(function ($) {

    jQuery.fn.dateTimeRangePicker = function (options) {

        var timeFrom = '',
            timeTo = ''; // original time
        var checkedTime = ''; // boolean variable for #time-checkbox
        var isValidFrom = true,
            isValidTo = true; // validation of time inputs
        var closeByButton = false;
        var renderTimeZone = options && options.showTimeZone === true;
        var originalTimeZone = '';
        var arrows = options && options.arrows;
        var mandatoryTime = options && options.mandatoryTime;


        var $inputFrom = $(options.inputFrom);
        var $inputTo = $(options.inputTo);
        var $input = $('<input type="text" id="user-friendly-input-' + $inputFrom.attr('id') + '">').css('left', $inputFrom.position().left + 'px').insertBefore($inputFrom);

        var timeZones = ['CET / CEST', 'WET / WEST', 'EET / EEST', 'GET', 'UTC']; // temporary values

        $input.attr('readonly', 'readonly');

        $inputFrom.css('display', 'none');
        $inputTo.css('display', 'none');

        var getMinutesFromTime = function (time) { // calculate minutes from text time
            var r = time.match(/[^:]*/g);
            var min = r[2] * 1;
            var hr = r[0] * 1;
            return hr * 60 + min;
        };

        $('#user-friendly-input-' + $inputFrom.attr('id')).nextUntil('#' + $inputTo.attr('id')).add('#' + $inputTo.attr('id') + ', #user-friendly-input-' + $inputFrom.attr('id')).wrapAll('<div class="originalinput-wrapper" id="originalinput-wrapper-' + $inputFrom.attr('id') + '"></div>');

        if (arrows) {
            $input.before('<div title="Previous" id="date-arrow-left-' + $input.attr('id') + '" class="datepicker-arrow-left">');
            $input.after('<div title="Next" id="date-arrow-right-' + $input.attr('id') + '" class="datepicker-arrow-right">');
            $input.siblings('.datepicker-arrow-left, .datepicker-arrow-right').on('click', function () {
                var date = $input.val().match(/^(([0-9]{2}).){2}[0-9]{4}/);
                var time = $input.val().match(/(([0-9]{2}):([0-9]{2})) - (([0-9]{2}):([0-9]{2}))$/);
                var timeZone = $input.val().match(/([a-zA-Z]{3})$/);
                var increment = $(this).hasClass('datepicker-arrow-right') ? 1 : -1;

                if (date) {
                    date = date[0];
                } else {
                    date = new Date().format('dd.MM.yyyy');
                }

                var momentDate = moment(date, 'DD.MM.YYYY').add('days', increment);

                var resultString = momentDate.format('DD.MM.YYYY');

                if (time && time[0] != "00:00 - 00:00") {
                    resultString += ' ' + time[0];
                }

                if (timeZone) {
                    resultString += ' ' + timeZone[0];
                }

                $input.val(resultString);

                resultString = viewToServer.call($input, resultString, 'DAYTIMERANGE', $('#datepicker-day-offset-select-' + $inputFrom.attr('id')).val());

                $inputTo.val(resultString.to);
                $inputFrom.val(resultString.from).trigger('change');
            });
        }

        if (options.dayOffset) {
            var $selectElement = $('<select id="datepicker-day-offset-select-' + $inputFrom.attr('id') + '"></select>');

            var dayOffsetRange = options.dayOffsetValue ? options.dayOffsetValue : 2;

            if (options.dayOffsetNegative) {
                for (var i = 0; i >= dayOffsetRange * -1; i--) {
                    $('<option value="' + i + '"' + (i == 0 ? 'selected="selected"' : '') + '>D' + (i == 0 ? '' : ' - ' + Math.abs(i)) + '</option>').appendTo($selectElement);
                }
            } else {
                for (var i = 0; i <= dayOffsetRange; i++) {
                    $('<option value="' + i + '"' + (i == 0 ? 'selected="selected"' : '') + '>D' + (i == 0 ? '' : ' + ' + i) + '</option>').appendTo($selectElement);
                }
            }

            $selectElement.css('width', '50px').insertAfter($input);

            if (options.dayOffsetCurrentValue) {
                $selectElement.val(options.dayOffsetCurrentValue);
            }

            $selectElement.combobox({
                noSorting: true
            });

            $('.ui-combobox-input').css('width', '40px');
            if (options.dayOffsetNegative) {
                $('.ui-combobox').css('float', 'left');
            }

            $selectElement.on('change', function () {
                var unifiedTime = viewToServer.call($input, $input.val(), 'DAYTIMERANGE', $('#datepicker-day-offset-select-' + $inputFrom.attr('id')).val());
                $inputTo.removeAttr('value').val(unifiedTime.to);
                $inputFrom.removeAttr('value').val(unifiedTime.from).trigger('change');
            });
        }

        var showPicker = function () {
            closeByButton = false;
            if (/^(([0-2][0-9])|3[0-1]).((0[0-9])|(1[0-2])).(19)|(20)\d\d/.test($inputFrom.val() + "")) { // if original input contains date
                checkedTime = /(([0-1][0-9])|(2[0-3])):([0-5][0-9])/.test($inputFrom.val()) && /(([0-1][0-9])|(2[0-3])):([0-5][0-9])/.test($inputTo.val()); // if original contains time range
                if (checkedTime) {
                    var rf = $inputFrom.val().match(/[[0-9^.]*:[0-9^.]*]*/g); // match time
                    var rt = $inputTo.val().match(/[[0-9^.]*:[0-9^.]*]*/g); // match time
                    timeFrom = rf[0];
                    timeTo = rt[0];

                    if (timeFrom == "00:00" && timeTo == "00:00") {
                        checkedTime = false;
                    }
                } else {
                    timeFrom = timeTo = '00:00';
                }
                var originalDate = $inputFrom.val().match(/[0-9.]*/)[0]; // match only date
                if (options && options.showTimeZone) {
                    var x = $inputFrom.val().match(/[a-zA-Z \/]{1,}/); // match only time zone value
                    if (x) {
                        originalTimeZone = x[0];
                    } else {
                        originalTimeZone = "UTC";
                    }
                }
                $input.datepicker('setDate', originalDate);
            } else {
                timeFrom = timeTo = '00:00';
                $input.datepicker('setDate', new Date());
            }
            $input.datepicker("show");
            updateOriginalInput();
        };

        $input.buttonToInput();

        $input.on('opendatepicker', function () {
            showPicker();
        });

        // format time from only minutes to HH:mm
        var formatTime = function (value) {
            var hours = Math.floor(value / 60) + "";
            var minutes = value - (hours * 60) + "";
            return (hours.length < 2 ? '0' : '') + hours + ':' + (minutes.length < 2 ? '0' : '') + minutes;
        };

        var updateOriginalInput = function () {
            // format time to dd.mm.yy HH:mm - HH:mm TZ
            $('#time-input-to').val($('#time-input-to').val() == '23:59' ? '24:00' : $('#time-input-to').val());
            $input.val($.datepicker.formatDate('dd.mm.yy', $input.datepicker('getDate')) + ($('#time-checkbox').is(':checked') ? ' ' + $('#time-input-from').val() + ' - ' + $('#time-input-to').val() : '') + (renderTimeZone ? ' ' + $('#time-timezone').val() : ''));
            timeFrom = $('#time-input-from').val();
            timeTo = $('#time-input-to').val();
        };

        $input.datepicker({
            firstDay: 1, // first day is Monday
            showButtonPanel: true,
            dateFormat: 'dd.mm.yy',
            showOtherMonths: true,
            selectOtherMonths: true,
            changeYear: true,
            changeMonth: true,
            yearRange: startYearOffset+":+90",
            monthNamesShort: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
            afterShow: function () {
                //generate HTML
                $('.ui-datepicker-buttonpane').css('border-top', 'none').prepend('<div id="time-picker-wrapper"></div>');
                $('#time-picker-wrapper').append('<div id="time-checkbox-wrapper" class="time-checkbox-wrapper"><input type="checkbox" id="time-checkbox"' + (checkedTime ? ' checked="checked"' : '') + '/><label for="time-checkbox">Time</label></div>');
                $('#time-checkbox-wrapper').append('<div id="time-inputs-wrapper"><input type="text" id="time-input-from" value="' + timeFrom + '">-<input type="text" id="time-input-to" value="' + timeTo + '"></div><div class="clear"></div>');
                $('#time-picker-wrapper').append('<div id="time-slider-wrapper"><div id="time-slider-row-from" class="time-slider-row"></div><div class="cleaner"></div><div id="time-slider-row-to" class="time-slider-row"></div></div>');
                $('#time-slider-row-from').append('<div class="time-slider-label">Start time:</div><div class="time-slider-range-content"><div id="time-slider-from"></div></div>');
                $('#time-slider-row-to').append('<div class="time-slider-label">End time:</div><div class="time-slider-range-content"><div id="time-slider-to"></div></div>'); //
                //$('.ui-datepicker-current').css('display', 'none'); // schovani tlacitka NOW
                // nove tlacitko NOW
                $('.ui-datepicker-buttonpane').append('<span class="ui-datepicker-current">Today</span>');
                if (renderTimeZone) {
                    $('#time-picker-wrapper').append('<div id="time-timezone-wrapper"><div class="time-slider-label">Time Zone: </div><div class="time-slider-range-content"><select id="time-timezone"></select></div></div>');
                    $.each(timeZones, function (index, element) {
                        $('#time-timezone').append('<option value="' + element + '"' + (element == originalTimeZone ? ' selected="selected"' : '') + '>' + element + '</option>');
                    });
                    $('#time-timezone').val(originalTimeZone);
                }
                //
                if (mandatoryTime) {
                    $('#time-checkbox').prop('checked', true);
                }
                var timeCheckBox = $('#time-checkbox').prettyCheckable();
                if (mandatoryTime) {
                    timeCheckBox[0].disableInput(false);
                }
                //if publication resolution is changed -> propagate to datepicker
                if (typeof timeResolution !== 'undefined') {
                    var changedTimeStep = timeResolutionToTimeStep[timeResolution];
                    options.timeStep = changedTimeStep;
                }
                if (!options.timeStep) {
                    options.timeStep = 1;
                }
                $('#time-slider-from').slider({
                    min: 0,
                    max: 1440 - options.timeStep,
                    value: getMinutesFromTime(timeFrom),
                    step: options.timeStep
                }); // initialize first slider
                $('#time-slider-to').slider({
                    min: 0,
                    max: 1439,
                    value: getMinutesFromTime(timeTo === '24:00' ? '23:59' : timeTo),
                    step: options.timeStep
                }); // initialize second slider
                //
                //unbind all events handled to "Done" button and handle new event
                $('button.ui-datepicker-close').unbind('click').on('click', function () {
                    if (isValidFrom & isValidTo) {
                        updateOriginalInput();
                        closeByButton = true;
                        $input.datepicker('hide');
                    }
                });
                // handle click event to "Now" button
                $('#set-now-button').on('click', function () {
                    $('.ui-datepicker-today > a').trigger('click'); // manually select today
                    var timeNow = new Date(); // get current time
                    // format current time
                    var time = (timeNow.getHours() < 10 ? '0' : '') + timeNow.getHours() + ':' + (timeNow.getMinutes() < 10 ? '0' : '') + timeNow.getMinutes();
                    $('#time-input-from').val(time);
                    $('#time-input-to').val(time);
                    // manually trigger click on the "Done" button
                    $('button.ui-datepicker-close').trigger('click');
                });
                // enable/disable time support
                $('#time-checkbox').on('change', function () {
                    checkedTime = $(this).is(':checked');
                    $('#time-slider-from, #time-slider-to').slider("option", "disabled", !checkedTime);
                    updateOriginalInput();
                });
                //
                $('#time-slider-from').on('slide', function (e, ui) {
                    $('#time-input-from').val(formatTime(ui.value));
                    $('#time-input-from, #time-input-to').removeClass('time-error');
                    isValidTo = isValidFrom = true;
                    var valueTo = $('#time-slider-to').slider('option', 'value');
                    if (valueTo < ui.value) {
                        $('#time-slider-to').slider('option', 'value', ui.value);
                    }
                    $('#time-input-to').val(formatTime($('#time-slider-to').slider('option', 'value')));
                    updateOriginalInput();
                });

                $('#time-slider-to').on('slide', function (e, ui) {
                    $('#time-input-to').val(formatTime(ui.value) == '23:59' ? '24:00' : formatTime(ui.value));
                    $('#time-input-from, #time-input-to').removeClass('time-error');
                    isValidTo = isValidFrom = true;
                    var valueFrom = $('#time-slider-from').slider('option', 'value');
                    if (valueFrom > ui.value) {
                        $('#time-slider-from').slider('option', 'value', ui.value);
                    }
                    $('#time-input-from').val(formatTime($('#time-slider-from').slider('option', 'value')));
                    updateOriginalInput();
                });
                // update enable state of time support (depends on original input value)
                $('#time-checkbox').trigger('change');
                // TPEET-247 manual edit of time readonly (it messes up MTU)
                $('#time-input-from, #time-input-to').attr('readonly', 'readonly');
                // mask time inputs and handle new event
                $('#time-input-from, #time-input-to').mask('99:99').on('change', function () {
                    // simple validation
                    if ($(this).val().length != 5) {
                        if ($(this).attr('id') == 'time-input-from') {
                            isValidFrom = false;
                        } else {
                            isValidTo = false;
                        }
                        $(this).addClass('time-error');
                        return;
                    }
                    var hr = $(this).val().split(':')[0] * 1;
                    var min = $(this).val().split(':')[1] * 1;
                    if (hr > 23 || hr < 0 || min > 59 || min < 0) {
                        $(this).addClass('time-error');
                        if ($(this).attr('id') == 'time-input-from') {
                            isValidFrom = false;
                        } else {
                            isValidTo = false;
                        }
                    } else {
                        $(this).removeClass('time-error');
                        updateOriginalInput();
                        $('#time-slider-from').slider({
                            min: 0,
                            max: 1440 - options.timeStep,
                            value: getMinutesFromTime(timeFrom)
                        });
                        $('#time-slider-to').slider({
                            min: 0,
                            max: 1439,
                            value: getMinutesFromTime(timeTo)
                        });
                        if ($(this).attr('id') == 'time-input-from') {
                            isValidFrom = true;
                        } else {
                            isValidTo = true;
                        }
                    }
                });

                $('#time-timezone').on('change', function () {
                    updateOriginalInput();
                });

                // fix IE8 appearance of closing dialog
                if (typeof(fixIE8Appearance) != "undefined") {
                    fixIE8Appearance($('.ui-datepicker'));
                }

                $('span.ui-datepicker-current').on('click', function () {
                    $('button.ui-datepicker-current').trigger('click');
                    $('.ui-datepicker-today a').trigger('click');
                });
            },
            onSelect: function () {
                updateOriginalInput();
            },
            onClose: function () {
                // if dialog is closed by "Done" button, copy temporarily dateTime value to original input and close dialog
                if (closeByButton) {
                    //correct the time zone from date picker
                    var timeZone = $inputFrom.val().replace(/\d{2}.\d{2}.\d{4} \d{2}:\d{2}\|/, "").replace(/\|.*/, "");
                    var unifiedTime = viewToServer.call($input, $input.val() + " " + timeZone, 'DAYTIMERANGE', $('#datepicker-day-offset-select-' + $inputFrom.attr('id')).val());
                    $inputTo.val(unifiedTime.to);
                    $inputFrom.val(unifiedTime.from).trigger('change');
                } else {
                    $input.val(serverToView($inputFrom.val(), $inputTo.val()));
                }
            }
        });

        $input.val(serverToView($inputFrom.val(), $inputTo.val()));

    };
})(jQuery);

(function ($) {
    jQuery.fn.dateTimePicker = function (options) {

        var time = ''; // original time
        var checkedTime = ''; // boolean variable for #time-checkbox
        var originalTime = ''; // full original input value
        var isValid = true; // validation of time inputs
        var closeByButton = false;
        var renderTimeZone = options && options.showTimeZone === true;
        var originalTimeZone = '';
        var arrows = options && options.arrows;
        var timeZone;
        var timeStep = (options && options.timeStep) ? options.timeStep : 1;
        var mandatoryTime = options && options.mandatoryTime;


        var $originalInput = $(this);
        $originalInput.data('datepicker-type', 'DAYTIME');
        var $input = $('<input type="text" id="user-friendly-input-' + $originalInput.attr('id') + '">').css('left', $originalInput.position().left + 'px').css('top', $originalInput.position().top + 'px').insertAfter(this);
        $originalInput.css('display', 'none');

        // Allows to check 'Time' at the time of initialization of date time picker (w/ or w/o range)
        // Use timeChecked: true/false when initializing via js or data-time-checked="true", time-checked="true" in html
        // or angular respectively (the latter one is used in uop-datepicker directive).
        var initialStateOfTimeCheckbox = ($originalInput.attr('data-time-checked') || 'FALSE').toUpperCase() === 'TRUE';
        initialStateOfTimeCheckbox = options.timeChecked || initialStateOfTimeCheckbox;

        var timeZones = ['CET / CEST', 'WET / WEST', 'EET / EEST', 'GET', 'UTC'];

        var getMinutesFromTime = function (time) { // calculale minutes from text time
            var r = time.match(/[^:]*/g);
            var min = r[1] * 1;
            var hr = r[0] * 1;
            return hr * 60 + min;
        };
        $input.attr('readonly', 'readonly');

        if (arrows) {
            $input.wrap('<div class="originalinput-wrapper" id="originalinput-wrapper-' + $input.attr('id') + '"></div>');
            $input.before('<div title="Previous" id="date-arrow-left-' + $input.attr('id') + '" class="datepicker-arrow-left">');
            $input.after('<div title="Next" id="date-arrow-right-' + $input.attr('id') + '" class="datepicker-arrow-right">');
            $input.siblings('div').on('click', function () {
                var day = $input.val().match(/^([0-9]{1,2})/);
                var month = $input.val().match(/([0-9]{1,2})(?=(\.[0-9]{4}))/);
                var year = $input.val().match(/([1-2][0-9]{3})/);
                var hours = $input.val().match(/(([0-9]{2}):([0-9]{2}))$/);
                var increment = $(this).hasClass('datepicker-arrow-right') ? 1 : -1;

                if (day) day = day[0] * 1;
                else day = new Date().getUTCDate();

                if (month) month = month[0] * 1;
                else month = new Date().getMonth() + 1;

                if (year) year = year[0] * 1;
                else year = new Date().getFullYear();

                if (hours) hours = ' ' + hours[0];
                else hours = '';

                // increment = increment * (24 * 3600 * 1000); // pocet milisekund ve dni
                // var newMilis = new Date(year, month - 1, day, 0, 0, 0, 0).getTime() + increment;

                var newMilis = moment(new Date(year, month - 1, day, 0, 0, 0, 0).getTime()).add('days', increment).valueOf();

                var output = new Date(newMilis).format('dd.MM.yyyy') + hours;
                $input.val(output);
                $originalInput.val(viewToServer.call($input, $input.val(), 'DAYTIME'));
                $originalInput.trigger("change");
            });
        }

        var showPicker = function (element) {
            originalTime = $(element).val();
            closeByButton = false;
            if (/^(([0-2][0-9])|3[0-1]).((0[0-9])|(1[0-2])).(19)|(20)\d\d/.test($input.val() + "")) { // if original input contains value
                var r = $input.val().match(/[[0-9^.]*:[0-9^.]*]*/g); // match time
                checkedTime = r != undefined && r != null;
                if (checkedTime) {
                    time = r[0];
                } else {
                    time = '00:00';
                }
                var originalDate = $input.val().match(/[0-9.]*/)[0]; // match only date
                if (options && options.showTimeZone) {
                    r = $input.val().match(/[a-zA-Z]{1,}/); // match only time zone value
                    if (r != null && r[0] != null) {
                        originalTimeZone = r[0];
                    }
                }
                $input.datepicker('setDate', originalDate);
            } else {
                time = '00:00';
                $input.datepicker('setDate', new Date());
            }
            $input.datepicker("show");
        };

        $input.buttonToInput();

        $input.on('opendatepicker', function () {
            showPicker($input);
        });

        // format time from only minutes to HH:mm
        var formatTime = function (value) {
            var hours = Math.floor(value / 60) + "";
            var minutes = value - (hours * 60) + "";
            return (hours.length < 2 ? '0' : '') + hours + ':' + (minutes.length < 2 ? '0' : '') + minutes;
        };

        var updateOriginalInput = function () {
            // format time to dd.mm.yy HH:mm-HH:mm TZ
            $input.val($.datepicker.formatDate('dd.mm.yy', $input.datepicker('getDate')) + ($('#time-checkbox').is(':checked') ? ' ' + $('#time-input').val() : '') + (renderTimeZone ? ' ' + $('#time-timezone').val() : ''));
            time = $('#time-input').val();
        };

        $input.datepicker({
            firstDay: 1, // first day is Monday
            showButtonPanel: true,
            dateFormat: 'dd.mm.yy',
            showOn: 'button',
            buttonImage: null,
            buttonImageOnly: true,
            showOtherMonths: true,
            selectOtherMonths: true,
            changeYear: options.changeYear === undefined ? true : options.changeYear,
            changeMonth: true,
            yearRange: startYearOffset+":+90",
            monthNamesShort: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
            afterShow: function () {
                //generate HTML
                $('.ui-datepicker-buttonpane').css('border-top', 'none').prepend('<div id="time-picker-wrapper" class="time-picker-wrapper"></div>').children('#time-picker-wrapper');
                $('#time-picker-wrapper').append('<div id="time-checkbox-wrapper" class="time-checkbox-wrapper"><input type="checkbox" id="time-checkbox"' + (checkedTime ? ' checked="checked"' : '') + '/><label for="time-checkbox">Time</label></div>');
                $('#time-checkbox-wrapper').append('<div id="time-inputs-wrapper"><input type="text" id="time-input" size="5" value="' + time + '"></div>');
                $('#time-picker-wrapper').append('<div class="clear"></div>').append('<div id="time-slider-wrapper"><div id="time-slider-row" class="time-slider-row"></div><div class="cleaner"></div></div>');
                $('#time-slider-row').append('<div class="time-slider-content"><div id="time-slider-from"></div></div>');
                //
                $('.ui-datepicker-current').css('display', 'none'); // schovani tlacitka NOW
                // nove tlacitko NOW
                $('.ui-datepicker-buttonpane').append('<button class="ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all" id="set-now-button">Now</button>');
                if (renderTimeZone) {
                    $('#time-picker-wrapper').append('<div id="time-timezone-wrapper"><div class="time-slider-label">Time Zone: </div><div class="time-slider-content"><select id="time-timezone"></select></div></div>');
                    var selectedTimeZone = (timeZone) ? timeZone : originalTimeZone;
                    $.each(timeZones, function (index, element) {
                        $('#time-timezone').append('<option value="' + element + '"' + (element == selectedTimeZone ? ' selected="selected"' : '') + '>' + element + '</option>');
                    });
                }
                //
                if (mandatoryTime || initialStateOfTimeCheckbox) {
                    $('#time-checkbox').prop('checked', true);
                }
                var timeCheckBox = $('#time-checkbox').prettyCheckable();
                if (mandatoryTime) {
                    timeCheckBox[0].disableInput(false);
                }
                $('#time-slider-from').slider({
                    min: 0,
                    max: 1439,
                    value: getMinutesFromTime(time),
                    step: timeStep
                }); // initialize first slider
                //
                //unbind all events handled to "Done" button and handle new event
                $('button.ui-datepicker-close').unbind('click').on('click',function () {
                    if (isValid) {
                        updateOriginalInput();
                        closeByButton = true;
                        $input.datepicker('hide');
                    }
                }).wrap('<div class="timepicker-bottom-row-wrapper"></div>').parent().append('<div class="clear"></div>').
                    prepend('<span id="timepicker-today" href="#" class="ui-datepicker-current">Today</span>');
                // handle click event to "Now" button
                $('#timepicker-today').on('click', function () {
                    //$('.ui-datepicker-today > a').trigger('click'); // manually select today
                    $input.datepicker('setDate', new Date());
                    var timeNow = new Date(); // get current time
                    $input.datepicker('setDate', timeNow);
                    var time = timeNow.format('hh:mm');
                    $('#time-input').val(time);
                    // manually trigger click on the "Done" button
                    $('button.ui-datepicker-close').trigger('click');
                });
                // enable/disable time support
                $('#time-checkbox').on('change', function () {
                    checkedTime = $(this).is(':checked');
                    if (checkedTime) {
                        $('#time-input').removeAttr('disabled');
                    } else {
                        $('#time-input').attr('disabled', 'disabled');
                    }
                    $('#time-slider-from').slider("option", "disabled", !checkedTime);
                    updateOriginalInput();
                });
                //
                $('#time-slider-from').on('slide', function (e, ui) {
                    $('#time-input').val(formatTime(ui.value)).removeClass('time-error');
                    isValid = true;

                    updateOriginalInput();
                });
                // update enable state of time support (depends on original input value)
                $('#time-checkbox').trigger('change');
                // mask time inputs and handle new event
                $('#time-input').mask('99:99').on('change', function () {
                    // simple validation
                    if ($(this).val().length != 5) {
                        isValid = false;
                        $(this).addClass('time-error');
                        return;
                    }
                    var hr = $(this).val().split(':')[0] * 1;
                    var min = $(this).val().split(':')[1] * 1;
                    if (hr > 23 || hr < 0 || min > 59 || min < 0) {
                        $(this).addClass('time-error');
                        isValid = false;
                    } else {
                        $(this).removeClass('time-error');
                        updateOriginalInput();
                        $('#time-slider-from').slider({
                            min: 0,
                            max: 1439,
                            value: getMinutesFromTime(time)
                        });
                        isValid = true;
                    }
                });

                $('#time-timezone').on('change', function () {
                    timeZone = $('#time-timezone').val();
                    updateOriginalInput();
                });

                $("#ui-datepicker-div").addClass("ui-front");
                $('#time-timezone').combobox();

                setComboValue('time-timezone', timeZone, true);

                // fix IE8 appearance of closing dialog
                if (typeof(fixIE8Appearance) != "undefined") {
                    fixIE8Appearance($('.ui-datepicker'));
                }
            },
            onSelect: function () {
                updateOriginalInput();
            },
            onClose: function () {
                // if dialog is closed by "Done" button, copy temporarily dateTime value to original input and close dialog
                if (!closeByButton) {
                    $input.val(originalTime);
                    $originalInput.val(originalTime != "" ? viewToServer.call($input, originalTime, 'DAYTIME') : "");
                    $originalInput.trigger("change");
                } else {
                    $originalInput.val(viewToServer.call($input, $input.val(), 'DAYTIME'));
                    $originalInput.trigger("change");
                }
            }
        });

        $input.val(serverToView($originalInput.val()));
    };
})(jQuery);


(function ($) {

    jQuery.fn.datePicker = function (options) {
        var arrows = options && options.arrows;

        var $originalInput = $(this);
        $originalInput.data('datepicker-type', 'DAY');
        var $input = $('<input type="text" id="user-friendly-input-' + $originalInput.attr('id') + '">').css('left', $originalInput.position().left + 'px').css('top', $originalInput.position().top + 'px').insertAfter(this);
        $originalInput.css('display', 'none');

        if (arrows) {
            $input.wrap('<div class="originalinput-wrapper" id="originalinput-wrapper-' + $input.attr('id') + '"></div>');
            $input.before('<div title="Previous" id="date-arrow-left-' + $input.attr('id') + '" class="datepicker-arrow-left">');
            $input.after('<div title="Next" id="date-arrow-right-' + $input.attr('id') + '" class="datepicker-arrow-right">');
            $input.siblings('div').on('click', function () {
                var day = $input.val().match(/^([0-9]{1,2})/);
                var month = $input.val().match(/([0-9]{1,2})(?=(\.[0-9]{4}))/);
                var year = $input.val().match(/([1-2][0-9]{3})$/);
                var increment = $(this).hasClass('datepicker-arrow-right') ? 1 : -1;

                if (day) day = day[0] * 1;
                else day = new Date().getUTCDate();

                if (month) month = month[0] * 1;
                else month = new Date().getMonth() + 1;

                if (year) year = year[0] * 1;
                else year = new Date().getFullYear();

                // wrong calculating next/previous day (bugging in time shift days)
                // increment = increment * (24 * 3600 * 1000); // pocet milisekund ve dni
                // var newMilis = new Date(year, month - 1, day, 0, 0, 0, 0).getTime() + increment;

                var newOutput = moment({year: year, month: month - 1, day: day}).add('days', increment).format('DD.MM.YYYY');

                $input.val(newOutput);
                $originalInput.val(viewToServer.call($input, $input.val(), 'DAY'));
                $originalInput.trigger("change");

            });
        }
        $input.attr('readonly', 'readonly');

        var showPicker = function (element) {
            originalTime = $(element).val();
            closeByButton = false;
            if (/^(([0-2][0-9])|3[0-1]).((0[0-9])|(1[0-2])).(19)|(20)\d\d/.test($input.val() + "")) { // if original input contains value
                var originalDate = $input.val().match(/[0-9.]*/)[0]; // match only date
                $input.datepicker('setDate', originalDate);
            } else {
                $input.datepicker('setDate', new Date());
            }
            $input.datepicker("show");
        };

        $input.buttonToInput();

        $input.on('opendatepicker', function () {
            showPicker($input);
        });

        $input.datepicker({
            firstDay: 1, // first day is Monday
            showButtonPanel: true,
            showOn: 'button',
            buttonImage: null,
            buttonImageOnly: true,
            dateFormat: 'dd.mm.yy',
            showOtherMonths: true,
            selectOtherMonths: true,
            changeYear: true,
            changeMonth: true,
            yearRange: startYearOffset+":+90",
            monthNamesShort: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
            afterShow: function () {
                $('.ui-datepicker table a').each(function (index, element) { // fixing moving datepicker to anchor
                    $(element).wrap('<div></div>');
                    $(element).parent().addClass($(element).attr('class')).append($(element).html());
                    $(element).hide();
                });
                $('.ui-datepicker-current').on('click', function () {
                    $input.datepicker('setDate', new Date());
                    $input.datepicker('hide');
                });
                $('.ui-datepicker-buttonpane').append('<span class="ui-datepicker-current">Today</span>');
                $('span.ui-datepicker-current').on('click', function () {
                    $('button.ui-datepicker-current').trigger('click');
                });
                $('.ui-datepicker-close').css('display', 'none');

                // fix IE8 appearance of closing dialog
                if (typeof(fixIE8Appearance) != "undefined") {
                    fixIE8Appearance($('.ui-datepicker'));
                }
            },
            onClose: function () {
                var isChanged = false;
                if($originalInput.val().length >= 10 && $originalInput.val().substr(0, 10)  != $input.val()
                    || ($originalInput.val() == "" && $originalInput.val() != $input.val())) {
                    isChanged = true;
                }
                $input.val($.datepicker.formatDate('dd.mm.yy', $input.datepicker('getDate')));
                $originalInput.val(viewToServer.call($input, $input.val(), 'DAY'));
                if(isChanged){
                    $originalInput.trigger("change");
                }
            },
            onSelect: function () {
                $input.datepicker('hide');
            }
        });

        $input.val(serverToView($originalInput.val()));

    };
})(jQuery);


(function ($) {
    var methods = {
        monthPickerId: "",
        init: function (options) {
            return this.each(function () {
                var
                    $this = $(this),
                    data = $this.data('monthpicker'),
                    year = (options && options.year) ? options.year : (new Date()).getFullYear(),
                    settings = $.extend({
                        pattern: 'mm/yyyy',
                        selectedMonth: null,
                        selectedMonthName: '',
                        selectedYear: year,
                        startYear: year - 10,
                        finalYear: year + 10,
                        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                        id: "monthpicker_" + (Math.random() * Math.random()).toString().replace('.', ''),
                        openOnFocus: true,
                        disabledMonths: [],
                        inputID: $this.attr('id')
                    }, options);

                settings.dateSeparator = settings.pattern.replace(/(mmm|mm|m|yyyy|yy|y)/ig, '');

                methods.monthPickerId = settings.id;

                // If the plugin hasn't been initialized yet for this element
                if (!data) {
                    $(this).data('monthpicker', {
                        'target': $this,
                        'settings': settings
                    });

                    // bind open picker to focus event on input
                    // if (settings.openOnFocus === true) {
                    // 	$this.bind('focus', function() {

                    // 		$this.monthPicker('show');
                    // 	});
                    // }

                    $this.monthPicker('mountWidget', settings);

                    $this.bind('monthpicker-click-month', function (e, month, year) {
                        $this.monthPicker('setValue', settings);
                        $this.monthPicker('hide');
                    });

                    // hide widget when user clicks elsewhere on page
                    $this.addClass("monthpicker-widgetcontainer");
                    $(document).unbind("mousedown.mtzmonthpicker").bind("mousedown.mtzmonthpicker", function (e) {
                        if (!e.target.className || e.target.className.toString().indexOf('monthpicker') < 0) {
                            $(".monthpicker-widgetcontainer").each(function () {
                                if (typeof($(this).data("monthpicker")) != "undefined") {
                                    $(this).monthPicker('hide');
                                }
                            });
                        }
                        ;
                    });
                }
                ;

            });
        },

        show: function (n) {
            var widget = $('#' + this.data('monthpicker').settings.id);
            var settings = this.data('monthpicker').settings;
            var monthpicker = $('#' + this.data('monthpicker').target.attr("id") + ':eq(0)');
            var month = $(this).val().match(/^[0-9]*/) * 1;
            var year = $(this).val().match(/[0-9]*$/) * 1;
            if (month < 1 | month > 12) month = new Date().getMonth() + 1;
            if (year < 1900 | year > 2199) year = new Date().getFullYear();

            widget.find('#monthpicker-show-year-' + settings.inputID).html(year);
            settings.selectedYear = year;
            widget.find('td[data-month]').removeClass('ui-state-active');
            widget.find('td[data-month="' + month + '"]').addClass('ui-state-active');

            widget.css("top", monthpicker.offset().top + monthpicker.outerHeight());
            widget.css("left", monthpicker.offset().left);
            widget.fadeIn('fast');
            widget.find('select').focus();
            this.trigger('monthpicker-show');
        },

        hide: function () {
            var widget = $('#' + this.data('monthpicker').settings.id);
            if (widget.is(':visible')) {
                widget.fadeOut('fast');
                this.trigger('monthpicker-hide');
            }
        },

        setValue: function (settings) {
            var
                month = settings.selectedMonth,
                year = settings.selectedYear;

            if (settings.pattern.indexOf('mmm') >= 0) {
                month = settings.selectedMonthName;
            } else if (settings.pattern.indexOf('mm') >= 0 && settings.selectedMonth < 10) {
                month = '0' + settings.selectedMonth;
            }

            if (settings.pattern.indexOf('yyyy') < 0) {
                year = year.toString().substr(2, 2);
            }

            if (settings.pattern.indexOf('y') > settings.pattern.indexOf(settings.dateSeparator)) {
                this.val(month + settings.dateSeparator + year);
            } else {
                this.val(year + settings.dateSeparator + month);
            }

            this.change();
            $('#' + $(this).attr('id').replace('user-friendly-input-', '')).val(viewToServer.call($(this), $(this).val(), 'MONTH')).trigger("change");
        },

        disableMonths: function (months) {
            var
                settings = this.data('monthpicker').settings,
                container = $('#' + settings.id);

            settings.disabledMonths = months;

            container.find('.monthpicker-month').each(function () {
                var m = parseInt($(this).data('month'));
                if ($.inArray(m, months) >= 0) {
                    $(this).addClass('ui-state-disabled');
                } else {
                    $(this).removeClass('ui-state-disabled');
                }
            });
        },

        mountWidget: function (settings) {
            var
                monthpicker = this,
                container = $('<div id="' + settings.id + '" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" />'),
                header = $('<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix ui-corner-all monthpicker" />'),
                table = $('<table class="monthpicker" />'),
                tbody = $('<tbody class="monthpicker" />'),
                tr = $('<tr class="monthpicker" />'),
                td = '',
                attrSelectedYear = $(this).data('selected-year'),
                attrStartYear = $(this).data('start-year'),
                attrFinalYear = $(this).data('final-year');

            if (attrSelectedYear) {
                settings.selectedYear = attrSelectedYear;
            }

            if (attrStartYear) {
                settings.startYear = attrStartYear;
            }

            if (attrFinalYear) {
                settings.finalYear = attrFinalYear;
            }

            container.css({
                position: 'absolute',
                zIndex: 999999,
                whiteSpace: 'nowrap',
                width: '228px',
                overflow: 'hidden',
                textAlign: 'center',
                display: 'none',
                top: monthpicker.offset().top + monthpicker.outerHeight(),
                left: monthpicker.offset().left
            });

            header.append('<div class="monthpicker-prev-year-button" id="monthpicker-prev-year-' + settings.inputID + '"></div><div class="monthpicker-show-year" id="monthpicker-show-year-' + settings.inputID + '">' + settings.selectedYear + '</div><div class="monthpicker-next-year-button" id="monthpicker-next-year-' + settings.inputID + '"></div>');

            container.append(header);

            // mount months table
            for (var i = 1; i <= 12; i++) {
                td = $('<td class="ui-state-default monthpicker monthpicker-month" />').attr('data-month', i);
                if (i == new Date().getMonth() + 1) td.addClass('ui-state-highlight');
                td.append(settings.monthNames[i - 1]);
                tr.append(td).appendTo(tbody);
                if (i % 3 === 0) {
                    tr = $('<tr class="monthpicker" />');
                }
            }

            table.append(tbody).appendTo(container);

            table.find('.monthpicker-month').on('mouseenter',function () {
                $(this).addClass('ui-state-focus');
            }).on('mouseleave', function () {
                $(this).removeClass('ui-state-focus');
            });

            container.find('.monthpicker-month').bind('click', function () { // nabinduje udalost click na jednotlivou bunku tabulky, obsahujici mesic
                var m = parseInt($(this).data('month'));
                if ($.inArray(m, settings.disabledMonths) < 0) {
                    settings.selectedMonth = $(this).data('month');
                    settings.selectedMonthName = $(this).text();
                    monthpicker.trigger('monthpicker-click-month', $(this).data('month'));
                }
            });

            footer = $('<div class="horizontal-separator"></div><div class="ui-datepicker-footer monthpicker-footer "><span class="monthpicker ui-datepicker-current" id="monthpicker-this-month-button-' + settings.inputID + '">This month</span></div>');

            container.append(footer);

            container.appendTo('body');

            container.find('.monthpicker-month').each(function () {
                $content = $(this).html();
                $(this).empty().append('<div class="monthpicker ui-state-default monthpicker-month-inner">' + $content + '</div>');
            });

            container.find('.monthpicker-prev-year-button, .monthpicker-next-year-button').on('click', function () {
                settings.selectedYear += $(this).attr('id') == 'monthpicker-prev-year-' + settings.inputID ? -1 : 1;
                container.find('#monthpicker-show-year-' + settings.inputID).html(settings.selectedYear);
                monthpicker.trigger('monthpicker-change-year', $(this).val());
            });

            container.find('#monthpicker-this-month-button-' + settings.inputID).on('click', function () {
                var currentMonth = new Date().getMonth() + 1;
                settings.selectedYear = new Date().getFullYear();
                $('td[data-month=' + currentMonth + ']').trigger('click');
            });
        },

        destroy: function () {
            return this.each(function () {
                $(this).removeData('monthpicker');
            });
        }

    };

    $.fn.monthPicker = function (method) {
        var arrows = method && method.arrows;
        var $originalInput, $input;
        $originalInput = $('#' + $(this).attr('id').replace('user-friendly-input-', ''));
        $originalInput.data('datepicker-type', 'MONTH');
        if ($(this).attr('id').indexOf('user-friendly-input') == -1) {
            $input = $('<input type="text" id="user-friendly-input-' + $originalInput.attr('id') + '">').css('left', $originalInput.position().left + 'px').css('top', $originalInput.position().top + 'px').insertAfter($originalInput);
            $originalInput.css('display', 'none');

            if (arrows) {
                $input.wrap('<div class="originalinput-wrapper" id="originalinput-wrapper-' + $input.attr('id') + '"></div>');
                $input.before('<div title="Previous" id="date-arrow-left-' + $input.attr('id') + '" class="datepicker-arrow-left">');
                $input.after('<div title="Next" id="date-arrow-right-' + $input.attr('id') + '" class="datepicker-arrow-right">');
                $input.siblings('div').on('click', function () {
                    $input = $(this).siblings('div').children('input');
                    var monthNumber = $input.val().match(/^([0-9]{1,2})(?=\/)/);
                    var increment = $(this).hasClass('datepicker-arrow-right') ? 1 : -1;
                    var year = $input.val().match(/([1-2][0-9]{3})$/);

                    if (year) year = year[0] * 1;
                    else year = new Date().getFullYear();

                    if (monthNumber) monthNumber = monthNumber[0] * 1;
                    else monthNumber = new Date().getWeek();

                    monthNumber += increment;

                    if (monthNumber > 12) {
                        year++;
                        monthNumber = 1;
                    }

                    if (monthNumber < 1) {
                        year--;
                        monthNumber = 12;
                    }

                    var output = (monthNumber < 10 ? '0' + monthNumber : monthNumber) + '/' + year;
                    $input.val(output);
                    $originalInput.val(viewToServer.call($input, $input.val(), 'MONTH'));
                    $originalInput.trigger("change");
                });
            }
            ;
            $input.buttonToInput();

            var initialDate = $originalInput.val().match(/[0-9]{2}\.[0-9]{4}/);
            if (initialDate) {
                var inputDate = initialDate[0].split('.')[0] + '/' + initialDate[0].split('.')[1];
                $input.val(inputDate);
            }
            ;

            $input.attr('readonly', 'readonly');

            $input.on('opendatepicker', function () {
                $input.monthPicker('show');
            });
            $input.val(serverToView($originalInput.val()));
        } else {
            $input = $('input[id="user-friendly-input-' + $originalInput.attr('id') + '"]');
        }

        $originalInput.val(viewToServer.call($input, $input.val(), 'MONTH'));


        if (methods[method]) {
            return methods[method].apply($input, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            var neco = methods.init.apply($input, arguments);
            datePickersMap[$originalInput.attr('id')] = methods.monthPickerId;
            return neco;
        } else {
            $.error('Method ' + method + ' does not exist on monthpicker');
        }
    };

})(jQuery);

(function ($) {

    var methods = {
        yearPickerId: "",
        init: function (options) {
            return this.each(function () {
                var
                    $this = $(this),
                    data = $this.data('yearpicker'),
                    year = (options && options.year) ? options.year : (new Date()).getFullYear(),
                    settings = $.extend({
                        selectedYear: year,
                        startYear: 0,
                        endYear: 0,
                        id: "yearpicker_" + (Math.random() * Math.random()).toString().replace('.', ''),
                        uuid: getUUID(),
                        openOnFocus: true,
                        inputID: $this.attr('id')
                    }, options);

                methods.yearPickerId = settings.id;

                // If the plugin hasn't been initialized yet for this element
                if (!data) {
                    $(this).data('yearpicker', {
                        'target': $this,
                        'settings': settings
                    });

                    $this.yearPicker('mountWidget', settings);

                    // if year is selected, set input's value & hide
                    $this.bind('yearpicker-click-year', function (e, year) {
                        $this.yearPicker('setValue', settings);
                        $this.yearPicker('hide');
                    });

                    // hide widget when user clicks elsewhere on page
                    $this.addClass("yearpicker-widgetcontainer");
                    $(document).unbind("mousedown.yearpicker").bind("mousedown.yearpicker", function (e) {
                        if (!e.target.className || e.target.className.toString().indexOf('yearpicker') < 0) {
                            $(".yearpicker-widgetcontainer").each(function () {
                                if (typeof($(this).data("yearpicker")) != "undefined") {
                                    $(this).yearPicker('hide');
                                }
                            });
                        }
                    });
                }

            });
        },

        show: function (n) { // rerender years table
            var thiss = $(this); // input
            var widget = $('#' + this.data('yearpicker').settings.id);
            var settings = this.data('yearpicker').settings;
            var yearpicker = $('#' + this.data('yearpicker').target.attr("id") + ':eq(0)');
            var tableWrapper = $('div#yearpicker-table-wrapper-' + settings.inputID);
            var selectedYear = $(this).val().match(/[1-2][0-9]{3}/) * 1; // match selected year

            if (selectedYear < 1900 | selectedYear > 2199) selectedYear = new Date().getFullYear(); // little validation

            var startYear = selectedYear - (selectedYear % 9), // calculate year range
                endYear = startYear + 9;

            settings.startYear = startYear;
            settings.endYear = endYear;
            settings.selectedYear = selectedYear;

            // render years table
            var tr = $('<tr class="yearpicker" />'),
                td = '',
                table = $('<table class="yearpicker" />'),
                tbody = $('<tbody class="yearpicker" />');

            tableWrapper.empty();

            var x = 0;
            for (var i = startYear; i < endYear; i++) { // render table
                x++;
                td = $('<td class="ui-state-default yearpicker yearpicker-year"><div class="yearpicker ui-state-default yearpicker-year-inner">' + i + '</div></td>').attr('data-year', i);

                if (i == new Date().getFullYear()) td.addClass('ui-state-highlight');

                tr.append(td).appendTo(tbody);

                if (x % 3 === 0) {
                    tr = $('<tr class="yearpicker" />');
                }
            }

            table.append(tbody).appendTo(tableWrapper); // append table to widget

            table.find('.yearpicker-year').on('mouseenter',function () { // bind events to each td
                $(this).addClass('ui-state-focus');
            }).on('mouseleave',function () {
                $(this).removeClass('ui-state-focus');
            }).on('click', function () { // nabinduje udalost click na jednotlivou bunku tabulky, obsahujici rok
                settings.selectedYear = $(this).data('year');
                thiss.trigger('yearpicker-click-year', $(this).data('year'));
            });

            widget.find('#yearpicker-show-year-' + settings.inputID).html(settings.startYear + '-' + settings.endYear);
            widget.find('td[data-year]').removeClass('ui-state-active');
            widget.find('td[data-year="' + selectedYear + '"]').addClass('ui-state-active');

            widget.css("top", yearpicker.offset().top + yearpicker.outerHeight());
            widget.css("left", yearpicker.offset().left);
            widget.fadeIn('fast');
            widget.find('select').focus();
            this.trigger('yearpicker-show');
        },

        hide: function () {
            var widget = $('#' + this.data('yearpicker').settings.id);
            if (widget.is(':visible')) {
                widget.fadeOut('fast');
                this.trigger('yearpicker-hide');
            }
        },

        setValue: function (settings) {
            var year = settings.selectedYear;
            this.val(year);
            this.change();
            $('#' + $(this).attr('id').replace('user-friendly-input-', '')).val(viewToServer.call($(this), $(this).val(), 'YEAR')).trigger('change');
        },

        mountWidget: function (settings) { // insert widget to page
            var
                yearpicker = this,
                container = $('<div id="' + settings.id + '" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" />'),
                header = $('<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix ui-corner-all yearpicker" />'),
                attrSelectedYear = $(this).data('selected-year');

            if (attrSelectedYear) {
                settings.selectedYear = attrSelectedYear;
            }

            container.css({
                position: 'absolute',
                zIndex: 999999,
                whiteSpace: 'nowrap',
                width: '228px',
                overflow: 'hidden',
                textAlign: 'center',
                display: 'none',
                top: yearpicker.offset().top + yearpicker.outerHeight(),
                left: yearpicker.offset().left
            });

            header.append('<div class="yearpicker-prev-year-button" id="yearpicker-prev-year-' + settings.inputID + '"></div><div class="yearpicker-show-year" id="yearpicker-show-year-' + settings.inputID + '">' + settings.selectedYear + '</div><div class="yearpicker-next-year-button" id="yearpicker-next-year-' + settings.inputID + '"></div>');

            container.append(header);

            container.append('<div class="yearpicker-table-wrapper" id="yearpicker-table-wrapper-' + settings.inputID + '"></div>');

            footer = $('<div class="horizontal-separator"></div><div class="yearpicker-footer ui-datepicker-footer"><span class="yearpicker ui-datepicker-current this-year-button-' + settings.uuid + '" id="yearpicker-this-year-button-' + settings.inputID + '">This year</span></div>');

            container.append(footer);
            container.appendTo('body');

            var tableWrapper = $('#yearpicker-table-wrapper-' + settings.inputID);

            $('.yearpicker-prev-year-button, .yearpicker-next-year-button').on('click', function () { // tady se meni roky --> upravit na sipecky

                var direction;
                if ($(this).attr('id') == 'yearpicker-prev-year-' + settings.inputID) {
                    settings.startYear -= 9;
                    settings.endYear -= 9;
                    direction = "right";
                } else {
                    settings.startYear += 9;
                    settings.endYear += 9;
                    direction = "left";
                }
                ;

                $('#yearpicker-table-wrapper-' + settings.inputID + ' table').hide('slide', {
                    direction: direction
                }, 'normal', function () {

                    var tr = $('<tr class="yearpicker" />'),
                        td = '',
                        table = $('<table class="yearpicker" />'),
                        tbody = $('<tbody class="yearpicker" />');

                    // mount years table
                    var x = 0;
                    for (var i = settings.startYear; i < settings.endYear; i++) {
                        x++;
                        td = $('<td class="ui-state-default yearpicker yearpicker-year"></td>').attr('data-year', i);
                        td.append('<div class="yearpicker ui-state-default yearpicker-year-inner">' + i + '</div>');

                        if (i == new Date().getFullYear()) td.addClass('ui-state-active');

                        tr.append(td).appendTo(tbody);

                        if (x % 3 === 0) {
                            tr = $('<tr class="yearpicker" />');
                        }
                    }

                    $(this).parent().empty();

                    table.css('display', 'none').append(tbody).appendTo(tableWrapper).show('fade', 'normal');

                    table.find('.yearpicker-year').on('mouseenter',function () {
                        $(this).addClass('ui-state-focus');
                    }).on('mouseleave',function () {
                        $(this).removeClass('ui-state-focus');
                    }).on('click', function () { // nabinduje udalost click na jednotlivou bunku tabulky, obsahujici rok
                        settings.selectedYear = $(this).data('year');
                        $(yearpicker).trigger('yearpicker-click-year', $(this).data('year'));
                    });


                    settings.selectedYear += $(this).attr('id') == 'yearpicker-prev-year-' + settings.inputID ? -1 : 1;
                    $('#yearpicker-show-year-' + settings.inputID).html(settings.startYear + '-' + (settings.endYear - 1));
                    yearpicker.trigger('yearpicker-change-year', $(this).val()); // vyvola se udalost
                });
            });

            $(document).on('click', '.this-year-button-' + settings.uuid, function () {
                settings.selectedYear = new Date().getFullYear();
                $(yearpicker).trigger('yearpicker-click-year');
            });
        },

        destroy: function () {
            return this.each(function () {
                $(this).removeData('yearpicker');
            });
        }

    };
    // main function
    $.fn.yearPicker = function (method) {
        var arrows = method && method.arrows;
        var $originalInput, $input;
        $originalInput = $('#' + $(this).attr('id').replace('user-friendly-input-', ''));
        $originalInput.data('datepicker-type', 'YEAR');
        if ($(this).attr('id').indexOf('user-friendly-input') == -1) {
            $input = $('<input type="text" id="user-friendly-input-' + $originalInput.attr('id') + '">').css('left', $originalInput.position().left + 'px').css('top', $originalInput.position().top + 'px').insertAfter($originalInput);
            $originalInput.css('display', 'none');
            $input.attr('readonly', 'readonly');

            if (arrows) { // insert arrows
                $input.wrap('<div class="originalinput-wrapper" id="originalinput-wrapper-' + $input.attr('id') + '"></div>');
                $input.before('<div title="Previous" id="date-arrow-left-' + $input.attr('id') + '" class="datepicker-arrow-left">');
                $input.after('<div title="Next" id="date-arrow-right-' + $input.attr('id') + '" class="datepicker-arrow-right">');
                $input.siblings('div').on('click', function () {
                    var increment = $(this).hasClass('datepicker-arrow-right') ? 1 : -1;
                    var year = $input.val().match(/^([1-2][0-9]{3})$/);

                    if (year) year = year[0] * 1;
                    else year = new Date().getFullYear();

                    year += increment;

                    var output = year;
                    $input.val(output);
                    $originalInput.val(viewToServer.call($input, $input.val(), 'YEAR'));
                    $originalInput.trigger("change");
                });
            }
            $input.buttonToInput();
            $input.on('opendatepicker', function () {
                $input.yearPicker('show');
            });
            $input.val(serverToView($originalInput.val()));
        } else {
            $input = $('input[id="user-friendly-input-' + $originalInput.attr('id') + '"]');
        }

        $originalInput.val(viewToServer.call($input, $input.val(), 'YEAR'));

        if (methods[method]) {
            return methods[method].apply($input, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            var neco = methods.init.apply($input, arguments);
            datePickersMap[$originalInput.attr('id')] = methods.yearPickerId;
            return neco;
        } else {
            $.error('Method ' + method + ' does not exist on yearpicker');
        }
    };

})(jQuery);


// QUARTER DATE PICKER


(function ($) {
    var methods = {
        quarterPickerId: "",
        init: function (options) {
            return this.each(function () {
                var
                    $this = $(this),
                    data = $this.data('quarterpicker'),
                    year = (options && options.year) ? options.year : (new Date()).getFullYear(),
                    settings = $.extend({
                        pattern: 'mm/yyyy',
                        selectedQuarter: null,
                        selectedMonth: null,
                        selectedYear: year,
                        startYear: year - 10,
                        finalYear: year + 10,
                        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                        id: "quarterpicker_" + (Math.random() * Math.random()).toString().replace('.', ''),
                        openOnFocus: true,
                        disabledMonths: [],
                        inputID: $this.attr('id')
                    }, options);

                settings.dateSeparator = settings.pattern.replace(/(mmm|mm|m|yyyy|yy|y)/ig, '');

                methods.quarterPickerId = settings.id;

                // If the plugin hasn't been initialized yet for this element
                if (!data) {
                    $(this).data('quarterpicker', {
                        'target': $this,
                        'settings': settings
                    });

                    // bind open picker to focus event on input
                    // if (settings.openOnFocus === true) {
                    // 	$this.bind('focus', function() {

                    // 		$this.monthPicker('show');
                    // 	});
                    // }

                    $this.quarterPicker('mountWidget', settings);

                    $this.bind('quarterpicker-click-quarter', function () {
                        $this.quarterPicker('setValue', settings);
                        $this.quarterPicker('hide');
                    });

                    // hide widget when user clicks elsewhere on page
                    $this.addClass("monthpicker-widgetcontainer");
                    $(document).unbind("mousedown.mtzmonthpicker").bind("mousedown.mtzmonthpicker", function (e) {
                        if (!e.target.className || e.target.className.toString().indexOf('quarterpicker') < 0) {
                            $(".quarterpicker-widgetcontainer").each(function () {
                                if (typeof($(this).data("quarterpicker")) != "undefined") {
                                    $(this).quarterPicker('hide');
                                }
                            });
                        }
                        ;
                    });
                }
                ;

            });
        },

        show: function (n) {
            var widget = $('#' + this.data('quarterpicker').settings.id);
            var settings = this.data('quarterpicker').settings;
            var quarterpicker = $('#' + this.data('quarterpicker').target.attr("id") + ':eq(0)');
            var quarter = $(this).val().match(/Q[1-4]$/)
            if(quarter != null) {
                quarter = quarter[0].replace('Q','') * 1;
            }
            var year = $(this).val().match(/^[0-9]{4}/) * 1;
            if (quarter < 1 | quarter > 4) quarter = Math.ceil((new Date().getMonth() + 1)/3);
            if (year < 1900 | year > 2199) year = new Date().getFullYear();

            widget.find('#quarterpicker-show-year-' + settings.inputID).html(year);
            settings.selectedYear = year;
            widget.find('tr[data-quarter]').removeClass('ui-state-active');
            widget.find('tr[data-quarter="' + quarter + '"]').addClass('ui-state-active');

            widget.css("top", quarterpicker.offset().top + quarterpicker.outerHeight());
            widget.css("left", quarterpicker.offset().left);
            widget.fadeIn('fast');
            widget.find('select').focus();
            this.trigger('quarterpicker-show');
        },

        hide: function () {
            var widget = $('#' + this.data('quarterpicker').settings.id);
            if (widget.is(':visible')) {
                widget.fadeOut('fast');
                this.trigger('quarterpicker-hide');
            }
        },

        setValue: function (settings) {
            var
                quarter = 'Q'+settings.selectedQuarter,
                year = settings.selectedYear;

            if (settings.pattern.indexOf('yyyy') < 0) {
                year = year.toString().substr(2, 2);
            }

            this.val(year + settings.dateSeparator + quarter);

            this.change();
            $('#' + $(this).attr('id').replace('user-friendly-input-', '')).val(viewToServer.call($(this), this.val(), 'QUARTER')).trigger("change");
        },

        disableMonths: function (months) {
            var
                settings = this.data('quarterpicker').settings,
                container = $('#' + settings.id);

            settings.disabledMonths = months;

            container.find('.quarterpicker-month').each(function () {
                var m = parseInt($(this).data('month'));
                if ($.inArray(m, months) >= 0) {
                    $(this).addClass('ui-state-disabled');
                } else {
                    $(this).removeClass('ui-state-disabled');
                }
            });
        },

        mountWidget: function (settings) {
            var
                quarterpicker = this,
                container = $('<div id="' + settings.id + '" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" />'),
                header = $('<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix ui-corner-all quarterpicker" />'),
                table = $('<table class="quarterpicker" />'),
                tbody = $('<tbody class="quarterpicker" />'),
                tr = $('<tr class="quarterpicker-quarter" />'),
                td = '',
                attrSelectedYear = $(this).data('selected-year'),
                attrStartYear = $(this).data('start-year'),
                attrFinalYear = $(this).data('final-year');

            if (attrSelectedYear) {
                settings.selectedYear = attrSelectedYear;
            }

            if (attrStartYear) {
                settings.startYear = attrStartYear;
            }

            if (attrFinalYear) {
                settings.finalYear = attrFinalYear;
            }

            container.css({
                position: 'absolute',
                zIndex: 999999,
                whiteSpace: 'nowrap',
                width: '228px',
                overflow: 'hidden',
                textAlign: 'center',
                display: 'none',
                top: quarterpicker.offset().top + quarterpicker.outerHeight(),
                left: quarterpicker.offset().left
            });

            header.append('<div class="quarterpicker-prev-year-button" id="quarterpicker-prev-year-' + settings.inputID + '"></div><div class="quarterpicker-show-year" id="quarterpicker-show-year-' + settings.inputID + '">' + settings.selectedYear + '</div><div class="quarterpicker-next-year-button" id="quarterpicker-next-year-' + settings.inputID + '"></div>');

            container.append(header);

            // mount months table
            for (var i = 1; i <= 12; i++) {
                td = $('<td class="ui-state-default quarterpicker quarterpicker-month" />');
                if (i == new Date().getMonth() + 1) tr.addClass('ui-state-active');
                td.append(settings.monthNames[i - 1]);
                tr.append(td).appendTo(tbody);
                if (i % 3 === 0) {
                    tr = $('<tr class="quarterpicker-quarter" />')
                }
            }

            table.append(tbody).appendTo(container);

            var trs = table.find(".quarterpicker-quarter");
            for(var i=0; i<4; i++) {
                $(trs[i]).attr("data-month", getQuarterInitialMonth(i)).attr("data-quarter", i+1);
            }

            container.find('.quarterpicker-quarter').bind('click', function () { // nabinduje udalost click na jednotlivou bunku tabulky, obsahujici mesic
                var m = parseInt($(this).data('month'));
                if ($.inArray(m, settings.disabledMonths) < 0) {
                    settings. selectedMonth= $(this).data('month');
                    settings. selectedQuarter= $(this).data('quarter');
                    quarterpicker.trigger('quarterpicker-click-quarter');
                }
            });

            footer = $('<div class="horizontal-separator"></div><div class="ui-datepicker-footer quarterpicker-footer "><span class="quarterpicker ui-datepicker-current" id="quarterpicker-this-quarter-button-' + settings.inputID + '">This quarter</span></div>');

            container.append(footer);

            container.appendTo('body');

            container.find('.quarterpicker-month').each(function () {
                $content = $(this).html();
                $(this).empty().append('<div class="quarterpicker ui-state-default quarterpicker-month-inner">' + $content + '</div>');
            });

            container.find('.quarterpicker-prev-year-button, .quarterpicker-next-year-button').on('click', function () {
                settings.selectedYear += $(this).attr('id') == 'quarterpicker-prev-year-' + settings.inputID ? -1 : 1;
                container.find('#quarterpicker-show-year-' + settings.inputID).html(settings.selectedYear);
                quarterpicker.trigger('quarterpicker-change-year', $(this).val());
            });

            container.find('[id^=quarterpicker-this-quarter-button]').on('click', function () {
                var currentQuarter = Math.floor((new Date().getMonth() + 3) / 3);
                settings.selectedYear = new Date().getFullYear();
                $('tr[data-quarter=' + currentQuarter + ']').trigger('click');
            });
        },

        destroy: function () {
            return this.each(function () {
                $(this).removeData('quarterpicker');
            });
        }

    };

    $.fn.quarterPicker = function (method) {
        var arrows = method && method.arrows;
        var $originalInput, $input;
        $originalInput = $('#' + $(this).attr('id').replace('user-friendly-input-', ''));
        $originalInput.data('datepicker-type', 'QUARTER');
        if ($(this).attr('id').indexOf('user-friendly-input') == -1) {
            $input = $('<input type="text" id="user-friendly-input-' + $originalInput.attr('id') + '">').css('left', $originalInput.position().left + 'px').css('top', $originalInput.position().top + 'px').insertAfter($originalInput);
            $originalInput.css('display', 'none');

            if (arrows) {
                $input.wrap('<div class="originalinput-wrapper" id="originalinput-wrapper-' + $input.attr('id') + '"></div>');
                $input.before('<div title="Previous" id="date-arrow-left-' + $input.attr('id') + '" class="datepicker-arrow-left">');
                $input.after('<div title="Next" id="date-arrow-right-' + $input.attr('id') + '" class="datepicker-arrow-right">');
                $input.siblings('div').on('click', function () {
                    $input = $(this).siblings('div').children('input');
                    var date = $input.val().match(/^([0-9]{4})\/Q[1-4]$/);
                    var increment = $(this).hasClass('datepicker-arrow-right') ? 1 : -1;
                    var year, quarter, month;

                    if (date) {
                        year = date[0].split('/')[0];
                        quarter = parseInt(date[0].split('/')[1].replace('Q', ''));
                        month = getQuarterInitialMonth(quarter - 1);
                    } else {
                        year = new Date().getFullYear();
                        month = new Date().getMonth();
                    }

                    quarter += increment;

                    if (quarter > 4) {
                        year++;
                        quarter = 1;
                    }

                    if (quarter < 1) {
                        year--;
                        quarter = 4;
                    }

                    var output = year + '/Q' + quarter
                    $input.val(output);
                    $originalInput.val(viewToServer.call($input, $input.val(), 'QUARTER'));
                    $originalInput.trigger("change");
                });
            }
            ;
            $input.buttonToInput();

            var initialDate = $originalInput.val().match(/[0-9]{2}\.[0-9]{4}/);
            if (initialDate) {
                var inputDate = initialDate[0].split('.')[0] + '/' + initialDate[0].split('.')[1];
                $input.val(inputDate);
            }
            ;

            $input.attr('readonly', 'readonly');

            $input.on('opendatepicker', function () {
                $input.quarterPicker('show');
            });
            $input.val(serverToView($originalInput.val()));
        } else {
            $input = $('input[id="user-friendly-input-' + $originalInput.attr('id') + '"]');
        }

        $originalInput.val(viewToServer.call($input, $input.val(), 'QUARTER'));


        if (methods[method]) {
            return methods[method].apply($input, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            var neco = methods.init.apply($input, arguments);
            datePickersMap[$originalInput.attr('id')] = methods.quarterPickerId;
            return neco;
        } else {
            $.error('Method ' + method + ' does not exist on quarterpicker');
        }
    };

})(jQuery);










































(function ($) {

    var methods = {
        semesterPickerId: "",
        init: function (options) {
            return this.each(function () {
                var
                    $this = $(this),
                    data = $this.data('semesterpicker'),
                    settings = $.extend({
                        id: "semesterpicker_" + (Math.random() * Math.random()).toString().replace('.', ''),
                        selectedYear: new Date().getFullYear(),
                        selectedSemester: new Date().getMonth() + 1,
                        originalValue: '',
                        customSemester: false,
                        openOnFocus: true,
                        inputID: $this.attr('id')
                    }, options);

                methods.semesterPickerId = settings.id;

                // If the plugin hasn't been initialized yet for this element
                if (!data) {
                    $(this).data('semesterpicker', {
                        'target': $this,
                        'settings': settings
                    });

                    $this.semesterPicker('mountWidget', settings);

                    // if semester is selected, set input's value & hide
                    $this.bind('semesterpicker-click-semester', function (e, semester) {
                        $this.semesterPicker('setValue', settings);
                        $this.semesterPicker('hide');
                    });

                    // hide widget when user clicks elsewhere on page
                    $this.addClass("semesterpicker-widgetcontainer");
                    $(document).unbind("mousedown.semesterpicker").bind("mousedown.semesterpicker", function (e) {
                        if (!e.target.className || e.target.className.toString().indexOf('semesterpicker') < 0) {
                            $(".semesterpicker-widgetcontainer").each(function () {
                                if (typeof($(this).data("semesterpicker")) != "undefined") {
                                    $(this).semesterPicker('hide');
                                }
                            });
                        }
                    });
                }

            });
        },

        show: function (n) {
            var thiss = $(this); // input
            var widget = $('#' + this.data('semesterpicker').settings.id);
            var settings = this.data('semesterpicker').settings;
            var semesterpicker = $('#' + this.data('semesterpicker').target.attr("id") + ':eq(0)');
            var startSemester = thiss.val().match(/^((0[1-9])|(1[0-2]))/);
            var year = thiss.val().match(/([1-2][0-9]{3})$/);

            settings.customSemester = (startSemester != undefined) && (startSemester != null) && ((startSemester[0] * 1) != 1) && ((startSemester[0] * 1) != 7);
            if (startSemester != undefined && startSemester != null) {
                settings.selectedSemester = startSemester[0] * 1;
            } else {
                settings.selectedSemester = new Date().getMonth() + 1;
            }

            if (year != undefined && year != null) {
                settings.selectedYear = year[0] * 1;
            } else {
                settings.selectedYear = new Date().getFullYear();
            }

            settings.originalValue = thiss.val();

            if (settings.customSemester) {
                $('#semesterpicker-checkbox-' + settings.inputID).attr('checked', 'checked').trigger('change');
            } else {
                $('#semesterpicker-checkbox-' + settings.inputID).removeAttr('checked').trigger('change');
            }

            $('#semesterpicker-show-year-' + settings.inputID).html(settings.selectedYear);
            widget.css("top", semesterpicker.offset().top + semesterpicker.outerHeight());
            widget.css("left", semesterpicker.offset().left);
            widget.fadeIn('fast');
            widget.find('select').focus();
            this.trigger('semesterpicker-show');
        },

        hide: function () {
            var widget = $('#' + this.data('semesterpicker').settings.id);
            if (widget.is(':visible')) {
                widget.fadeOut('fast');
                this.trigger('semesterpicker-hide');
                $('#' + $(this).attr('id').replace('user-friendly-input-', '')).val(viewToServer.call($(this), $(this).val(), 'SEMESTER'));
            }
        },

        setValue: function (settings) {
            var settings = this.data('semesterpicker').settings;
            var endSemester = settings.selectedSemester > 7 ? settings.selectedSemester + 5 - 12 : settings.selectedSemester + 5;
            formatted = (settings.selectedSemester < 10 ? '0' + settings.selectedSemester : settings.selectedSemester) + '-' + (endSemester < 10 ? '0' + endSemester : endSemester) + '/' + settings.selectedYear;
            if (settings.selectedSemester == 0) {
                this.val(settings.originalValue.replace(/([1-2][0-9]{3})$/, settings.selectedYear));
            } else {
                this.val(formatted);
            }
            this.change();
            $('#' + $(this).attr('id').replace('user-friendly-input-', '')).val(viewToServer.call($(this), $(this).val(), 'SEMESTER'));
        },

        mountWidget: function (settings) {
            var
                monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'November', 'October', 'December'],
                semesterpicker = this,
                container = $('<div id="' + settings.id + '" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all semesterpicker" />'),
                header = $('<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix ui-corner-all semesterpicker" />'),
                selectedSemester = settings.selectedSemester;

            container.css({
                position: 'absolute',
                zIndex: 999999,
                whiteSpace: 'nowrap',
                width: '300px',
                overflow: 'hidden',
                textAlign: 'center',
                display: 'none',
                top: semesterpicker.offset().top + semesterpicker.outerHeight(),
                left: semesterpicker.offset().left
            });

            header.append('<div class="semesterpicker-year-button" id="semesterpicker-prev-year-' + settings.inputID + '">&laquo;</div><div id="semesterpicker-show-year-' + settings.inputID + '" class="semestepicker semesterpicker-show-year">' + settings.selectedYear + '</div><div class="semesterpicker-year-button" id="semesterpicker-next-year-' + settings.inputID + '">&raquo;</div>');

            container.append(header);

            wrapper = $('<div id="semesterpicker-content-wrapper-' + settings.inputID + '" class="semesterpicker"></div>');

            wrapper.append('<div id="semesterpicker-semester-wrapper-' + settings.inputID + '" class="semesterpicker"><div class="semesterpicker-stable-semester semesterpicker" id="semesterpicker-first-semester-' + settings.inputID + '">January - June</div><div class="semesterpicker-stable-semester semesterpicker" id="semesterpicker-second-semester-' + settings.inputID + '">July - December</div></div><div class="cleaner"></div>');
            wrapper.append('<div id="semesterpicker-checkbox-wrapper-' + settings.inputID + '" class="semesterpicker semesterpicker-checkbox-wrapper"><input type="checkbox" id="semesterpicker-checkbox-' + settings.inputID + '" class="semesterpicker"><label for="semesterpicker-checkbox" class="semesterpicker"> Custom semester</label><img src="http://cdn1.iconfinder.com/data/icons/TWG_Retina_Icons/24/help.png" alt="help" width="24" height="24" class="semesterpicker-help-icon"></div>');
            wrapper.append('<div id="semesterpicker-select-wrapper-' + settings.inputID + '" class="semesterpicker">Starting month: <select id="semesterpicker-select-' + settings.inputID + '" class="semesterpicker semesterpicker-select" disabled="disabled"></select></div>');
            $.each(monthNames, function (index, element) {
                wrapper.find('select').append('<option value="' + (index < 9 ? '0' + (index + 1) : (index + 1)) + '" class="semesterpicker">' + element + '</option>');
            });

            container.append(wrapper);

            footer = $('<div class="horizontal-separator"></div><div class="semesterpicker-footer ui-datepicker-footer"><button class="semesterpicker" id="semesterpicker-this-semester-button-' + settings.inputID + '">This semester</button><button class="semesterpicker" id="semesterpicker-done-button-' + settings.inputID + '">Done</button></div>');

            container.append(footer);

            container.appendTo('body');

            // click on the first semester (Jan - Jun)
            $('#semesterpicker-first-semester-' + settings.inputID).on('click', function () {
                settings.selectedSemester = 1;
                semesterpicker.trigger('semesterpicker-click-semester');
            });

            // click on the second semester (Jul - Dec)
            $('#semesterpicker-second-semester-' + settings.inputID).on('click', function () {
                settings.selectedSemester = 7;
                semesterpicker.trigger('semesterpicker-click-semester');
            });

            // click on the custom semester checkbox
            $('#semesterpicker-checkbox-' + settings.inputID).on('change', function () {
                if ($(this).is(':checked')) {
                    $('#semesterpicker-select-' + settings.inputID).removeAttr('disabled');
                } else {
                    $('#semesterpicker-select-' + settings.inputID).attr('disabled', 'disabled');
                }
            });

            // click on the this semester button
            $('button#semesterpicker-this-semester-button-' + settings.inputID).on('click', function () {
                settings.selectedSemester = new Date().getMonth() + 1;
                settings.selectedYear = new Date().getFullYear();
                semesterpicker.trigger('semesterpicker-click-semester');
            });

            // click on the done button
            $('#semesterpicker-done-button-' + settings.inputID).on('click', function () {
                if ($('#semesterpicker-checkbox-' + settings.inputID).is(':checked')) {
                    settings.selectedSemester = $('#semesterpicker-select-' + settings.inputID).val() * 1;
                    semesterpicker.trigger('semesterpicker-click-semester');
                } else {
                    settings.selectedSemester = 0;
                    semesterpicker.trigger('semesterpicker-click-semester');
                }
            });

            // switch years
            $('.semesterpicker-year-button').on('click', function () {
                settings.selectedYear += $(this).attr('id') == 'semesterpicker-prev-year-' + settings.inputID ? -1 : 1;
                $('#semesterpicker-show-year-' + settings.inputID).html(settings.selectedYear);
                semesterpicker.trigger('semesterpicker-change-year', $(this).val());
            });

            $('#semesterpicker-select-' + settings.inputID).val(selectedSemester < 10 ? '0' + selectedSemester : selectedSemester);
        },

        destroy: function () {
            return this.each(function () {
                $(this).removeData('semesterpicker');
            });
        }

    };

    $.fn.semesterPicker = function (method) {
        var $originalInput, $input;
        $originalInput = $('#' + $(this).attr('id').replace('user-friendly-input-', ''));
        $originalInput.data('datepicker-type', 'SEMESTER');
        if ($(this).attr('id').indexOf('user-friendly-input') == -1) {
            $input = $('<input type="text" id="user-friendly-input-' + $originalInput.attr('id') + '">').css('left', $originalInput.position().left + 'px').css('top', $originalInput.position().top + 'px').insertAfter($originalInput);
            $originalInput.css('display', 'none');

            $input.buttonToInput();
            $input.on('opendatepicker', function () {
                $input.semesterPicker('show');
            });
            $input.val(serverToView($originalInput.val()));
        } else {
            $input = $('input[id="user-friendly-input-' + $originalInput.attr('id') + '"]');
        }
        $input.attr('readonly', 'readonly');

        if (methods[method]) {
            return methods[method].apply($input, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            var neco = methods.init.apply($input, arguments);
            datePickersMap[$originalInput.attr('id')] = methods.semesterPickerId;
            return neco;
        } else {
            $.error('Method ' + method + ' does not exist on semesterpicker');
        }
    };
})(jQuery);

/*	options:
 *		showTimeZone: (true|false), default false - no comment
 *		type: (string) - date, dateTime, week, month, year, semester, dateTimeRange
 *		range: if true, inputFrom & inputTo is required; merge two inputs to range and add checkbox
 *		inputFrom, inputTo: (string|jQuery) - IDs of inputs
 *		arrows: (true|false), default false - show/hide arrows at the input
 *
 *      if type == dayTimeRange:
 *      dayOffset: (true|false), default false - render additional select with day offset
 *      dayOffsetValue: (int), default 2
 *      dayOffsetNegative: (true|false), default true - if negative, it generate 0, -1, -2... else 0, 1, 2 (possible only one direction)
 */

(function ($) {

    jQuery.fn.showDatePicker = function (options) {

        var _showTimeZone = options && options.showTimeZone;
        var type = options ? options.type : '';
        var range = options && options.range;
        var inputFrom = options ? options.inputFrom : '';
        var inputTo = options ? options.inputTo : '';
        var showArrows = options && options.arrows;
        var datepickerHelpContent = options && options.helpContent ? options.helpContent : 'Use this option in case that time interval is required';
        var mandatoryTime = options && options.mandatoryTime;
        var timeChecked = options && options.timeChecked;

        if (options == undefined || options.type == undefined) return;


        $.each([this, options.inputFrom, options.inputTo], function (index, element) {
            if (element) {
                if (datePickersMap[$(element).attr('id')]) {
                    $('#' + datePickersMap[$(element).attr('id')]).remove();
                }
            }
        });

	    type = type.toLowerCase();

        function generateRange(from, to) {
            var $from = $(from);
            var $to = $(to);
            var fromID = $from.attr('id');
            var toID = $to.attr('id');

            $('#' + fromID + ', #' + toID).wrapAll('<div class="time-range-input-wrapper" id="time-range-input-wrapper-' + fromID + '" />'); // generate wrapper around inputs
            $('#time-range-input-wrapper-' + fromID).css('width', $from.outerWidth(true)); // set wrapper width
            // generate checkbox input, put on the right place and bing event 'change'
            $('<div class="time-range-checkbox-wrapper"><input type="checkbox" id="datepicker-checkbox-' + fromID + '" /><label for="datepicker-checkbox-' + fromID + '">Set Range</label></div>').insertAfter(from).children('input').on('change', function () {
                var $hiddenToWrapper = showArrows ? $('#originalinput-wrapper-user-friendly-input-' + $to.attr('id')) : $('#input-button-wrapper-user-friendly-input-' + $to.attr('id'));
                if ($(this).is(':checked')) { // testing to check
                    var $hiddenToWrapper = showArrows ? $('#originalinput-wrapper-user-friendly-input-' + $to.attr('id')) : $('#input-button-wrapper-user-friendly-input-' + $to.attr('id')); // get full wrapper of inputTo
                    $hiddenToWrapper.show('fade', 1, function () {
                    });
                } else {
                    $hiddenToWrapper.hide('fade', 1);
                    $hiddenToWrapper.find('input').val('');
                    to.val("");
                }
                ;
            });
            //$('label[for="datepicker-checkbox-' + fromID + '"]').after('<div class="datepicker-help" title="Enables selection of Time interval.">');
            $('<div class="datepicker-help-icon jquery-tooltip" title="Enables selection of Time interval.">').insertAfter('label[for="datepicker-checkbox-' + fromID + '"]');

            $('.datepicker-help-icon.jquery-tooltip').addTooltip();

            $("#datepicker-checkbox-" + fromID).prettyCheckable();

            switch (type) { // switch between types
                case 'day':
                    $(from).datePicker({
                        showTimeZone: _showTimeZone,
                        arrows: showArrows
                    });
                    $(to).datePicker({
                        showTimeZone: _showTimeZone,
                        arrows: showArrows
                    });
                    break;
                case 'daytime':
                    $(from).dateTimePicker({
                        showTimeZone: _showTimeZone,
                        arrows: showArrows,
                        timeStep: (options && options.timeStep) ? options.timeStep : 1,
                        mandatoryTime: mandatoryTime,
                        timeChecked: timeChecked
                    });
                    $(to).css('display', 'none').dateTimePicker({
                        showTimeZone: _showTimeZone,
                        arrows: showArrows,
                        timeStep: (options && options.timeStep) ? options.timeStep : 1,
                        mandatoryTime: mandatoryTime,
                        timeChecked: timeChecked
                    });
                    break;
                case 'week':
                    $(from).weekPicker({
                        arrows: showArrows
                    });
                    $(to).css('display', 'none').weekPicker({
                        arrows: showArrows
                    });
                    break;
                case 'month':
                    $(from).monthPicker({
                        arrows: showArrows
                    });
                    $(to).monthPicker({
                        arrows: showArrows
                    });
                    break;
                case 'year':
                    $(from).yearPicker({
                        arrows: showArrows
                    });
                    $(to).yearPicker({
                        arrows: showArrows
                    });
                    break;
                case 'quarter':
                    $(from).quarterPicker({
                        arrows: showArrows
                    });
                    $(to).quarterPicker({
                        arrows: showArrows
                    });
                    break;
                case 'semester':
                    $(from).semesterPicker();
                    $(to).semesterPicker();
                    break;
            }
            ;

            $(from, to).addClass('has-datepicker');

            (showArrows ? $('#originalinput-wrapper-user-friendly-input-' + $to.attr('id')) : $('#input-button-wrapper-user-friendly-input-' + $to.attr('id'))).css('display', 'none');
        };

        var bindDisableEnableEvents = function ($input) {
            $input.on('disable', function () {
                $('#user-friendly-input-' + $input.attr('id')).attr('disabled', 'disabled').val('').siblings('a').css('display', 'none').siblings('span').css('display', 'inline-block').parent().addClass('disabled');
                $('div[id*="date-from-picker"].datepicker-arrow-left, div[id*="date-from-picker"].datepicker-arrow-right').each(function () {
                    var position = $input.position();
                    var dimensions = {
                        width: $input.width(),
                        height: $input.height()
                    };

                    $('<div class="disable-arrow-' + $input.attr('id') + '"></div>').css({
                        position: 'absolute',
                        left: position.left,
                        top: position.top,
                        width: dimensions.width,
                        height: dimensions.height,
                        background: 'transparent'
                    }).insertAfter(this);
                });
            });
            $input.on('enable', function () {
                $('#user-friendly-input-' + $input.attr('id')).removeAttr('disabled').siblings('span').css('display', 'none').siblings('a').css('display', 'inline-block').parent().removeClass('disabled');
                $('.disable-arrow-' + $input.attr('id')).remove();
            });
        };

        if (type == 'daytimerange') {
            $(null).dateTimeRangePicker({
                inputFrom: inputFrom,
                inputTo: inputTo,
                dayOffset: options.dayOffset,
                dayOffsetValue: options.dayOffsetValue,
                dayOffsetCurrentValue: options.dayOffsetCurrentValue,
                dayOffsetNegative: options.dayOffsetNegative,
                showTimeZone: _showTimeZone,
                arrows: showArrows,
                timeStep: (options && options.timeStep) ? options.timeStep : 1,
                mandatoryTime: mandatoryTime
            });
            return;
        }

        if (range && ((inputFrom == '') || (inputTo == ''))) { // range cannot be true without specification of from & to inputs
            return;
        }

        if (range) {
            generateRange(inputFrom, inputTo);
            bindDisableEnableEvents($(inputFrom));
            bindDisableEnableEvents($(inputTo));
        } else {
            switch (type) {
                case 'day':
                    $(this).datePicker({
                        showTimeZone: _showTimeZone,
                        arrows: showArrows
                    });
                    break;
                case 'daytime':
                    $(this).dateTimePicker({
                        showTimeZone: _showTimeZone,
                        arrows: showArrows,
                        timeStep: (options && options.timeStep) ? options.timeStep : 1,
                        mandatoryTime: mandatoryTime,
                        timeChecked: timeChecked,
                        changeYear: options.changeYear
                    });
                    break;
                case 'week':
                    $(this).weekPicker({
                        arrows: showArrows
                    });
                    break;
                case 'month':
                    $(this).monthPicker({
                        arrows: showArrows
                    });
                    break;
                case 'year':
                    $(this).yearPicker({
                        arrows: showArrows
                    });
                    break;
                case 'quarter':
                    $(this).quarterPicker({
                        arrows: showArrows
                    });
                    break;
                case 'semester':
                    $(this).semesterPicker();
                    break;
            }
            ;
            bindDisableEnableEvents($(this));
            $(this).addClass('has-datepicker');
        }
        ;
    };
})(jQuery);
