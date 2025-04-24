/**
 * GanttChart
 *
 * options: total - count of total pieces
 *          from
 *          to
 *          width - width of parent div
 *          filledClass - class of filled div's
 *          leftOverflowFilledClass
 *          rightOverflowFilledClass
 *          title - title of inserted div
 */

(function ($) {
    // IE8 detect. If '8' -> IE8, if undefined -> "The Browser"
    var IE8 = document.documentMode;

    $.fn.ganttChart = function (options) {

        /** @namespace options.total */
        if ((options.total === undefined || options.from === undefined || options.to === undefined || options.width === undefined)) {
            return;
        }

        var graphClass;
        var leftOverflow = false, rightOverflow = false;

        if (options.to > options.total) {
            options.to = options.total;
            rightOverflow = true;
        }

        if (options.from < 0) {
            options.from = 0;
            leftOverflow = true;
        }

        if (!options.filledClass) {
            options.filledClass = 'gantt-filled';
        }

        if (!options.leftOverflowClass) {
            options.leftOverflowClass = 'gantt-left-overflow';
        }

        if (!options.rightOverflowClass) {
            options.rightOverflowClass = 'gantt-right-overflow';
        }

        var leftMargin = options.width / options.total * options.from;

        var widthOfGraph = options.width / options.total * (options.to - options.from);


        if (options.prefix) {
            options.filledClass = options.prefix + '-' + options.filledClass;
        }

        if (options.postfix) {
            options.filledClass = options.filledClass + '-' + options.postfix;
        }

        widthOfGraph = widthOfGraph === 0 ? 1 : widthOfGraph;

        /** @namespace options.filledClass */
        var graph = $('<div></div>').addClass(options.filledClass).attr('title', options.title).css({marginLeft: leftMargin, width: widthOfGraph});

        if (rightOverflow) {
            graph.addClass(options.rightOverflowClass);
        }

        if (leftOverflow) {
            graph.addClass(options.leftOverflowClass);
        }

        graph.appendTo(this);
    };
})(jQuery);