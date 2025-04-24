function drawChart(target, chartData) {

	var axisColor = "#6b6b6b";
	var axisTextColor = axisColor;

	// fix for IE
	if (!Object.keys) {
		Object.keys = function(obj) {
			var keys = [];

			for (var i in obj) {
				if (obj.hasOwnProperty(i)) {
					keys.push(i);
				}
			}

			return keys;
		};
	}

    var stackType = {"none": "none",
        "regular": "regular",
        "hundredPercent": "100%",
        "threeDimensional": "3d"};

    if (chartData.data === "NO_DATA_NO_LABEL") {
        return "NO_DATA_NO_LABEL";
    } else if ($.isEmptyObject(chartData) || chartData.data === "NO_DATA") {
        $('#' + target).append('<div class="data-view-missing-chart-data-msg">Selected view cannot be displayed with incomplete data.<br />Values for some time intervals are not available.</div>');
        return "NO_DATA";
    }

    if (chartData.data === "CUSTOM_ERROR") {
        $('#' + target).append('<div class="data-view-missing-chart-data-msg">'+chartData.customMessage+'</div>');
        return "CUSTOM_ERROR";
    }

    if (chartData.data === "TOO_MANY_VALUES") {
        $('#' + target).append('<div class="data-view-missing-chart-data-msg">Selected view cannot be displayed because it contains too many values.</div>');
        return "TOO_MANY_VALUES";
    }

    var chart = {};

    if (chartData.chartDesign.chartType === 'serial') {
        chart = new AmCharts.AmSerialChart();  // create new chart
        chart.dataProvider = chartData.chartData;  // set source data for chart
        chart.categoryField = chartData.categoryName;  // set name of category
        chart.startDuration = 0; // animation in ms (currently without animation)
        chart.columnWidth = chartData.chartDesign.columnWidth;
        chart.columnSpacing = chartData.chartDesign.columnSpacing;
	    chart.numberFormatter = {
		    decimalSeparator: '.',
		    thousandsSeparator: '',
		    precision: -1
	    };
	    if (!chartData.chartDesign.autoMargins) {
            chart.autoMargins = chartData.chartDesign.autoMargins;
            chart.marginBottom = chartData.chartDesign.marginBottom;
            chart.marginTop = chartData.chartDesign.marginTop;
            chart.marginLeft = chartData.chartDesign.marginLeft;
            chart.marginRight = chartData.chartDesign.marginRight;
        }

        if(Object.keys(chartData.graphDesign).length === 1){
		    chartData.graphDesign.val1.specificAssignedAxis = undefined;
	    }

        var specificAssignedAxisesDefinition = {};
        var specificValueAxisesInstance = {};

	    $.each(chartData.graphDesign, function (index, element) {
		    if (typeof element.specificAssignedAxis !== 'undefined') {
			    if (typeof specificAssignedAxisesDefinition[element.specificAssignedAxis] === "undefined") {
				    specificAssignedAxisesDefinition[element.specificAssignedAxis] = new Array();
			    }

			    specificAssignedAxisesDefinition[element.specificAssignedAxis].push(index);
		    }
	    });

        var minimumSpecificValueRangePrimaryAxis = Number.MAX_VALUE,
            maximumSpecificValueRangePrimaryAxis = Number.MIN_VALUE,
            minimumSpecificValueRangeSecondaryAxis = Number.MAX_VALUE,
            maximumSpecificValueRangeSecondaryAxis = Number.MIN_VALUE;

        if (!$.isEmptyObject(specificAssignedAxisesDefinition)) {

            $.each(chartData.chartData, function (index, element) {
                $.each(chartData.chartKeys, function (index2, element2) {
                    var number = (element[element2] * 1);
                    if (typeof number === "number" && !Number.isNaN(number)) {
                        if (chartData.graphDesign[element2].assignedAxis === "PRIMARY") {
                            if (number > maximumSpecificValueRangePrimaryAxis) {
                                maximumSpecificValueRangePrimaryAxis = number;
                            }
                            if (number < minimumSpecificValueRangePrimaryAxis) {
                                minimumSpecificValueRangePrimaryAxis = number;
                            }
                        }
                        else {
                            if (number > maximumSpecificValueRangeSecondaryAxis) {
                                maximumSpecificValueRangeSecondaryAxis = number;
                            }
                            if (number < minimumSpecificValueRangeSecondaryAxis) {
                                minimumSpecificValueRangeSecondaryAxis = number;
                            }
                        }
                    }
                });
            });
        }

        //var pi = 0, si = 0;
        $.each(specificAssignedAxisesDefinition, function (index, element) {
            specificValueAxisesInstance[index] = new AmCharts.ValueAxis();
            if (chartData.graphDesign[specificAssignedAxisesDefinition[index][0]].assignedAxis === "PRIMARY") {
                specificValueAxisesInstance[index].title = /*(0 === pi++) ? */chartData.chartDesign.yAxisTitle;// : '';
                specificValueAxisesInstance[index].opacity = 0;
                specificValueAxisesInstance[index].labelsEnabled = false;
                if (chartData.graphDesign[specificAssignedAxisesDefinition[index][0]].serialChartType == "column") {
                    specificValueAxisesInstance[index].stackType = stackType[chartData.graphDesign[chartData.chartKeys[0]].stackType];
                }
                specificValueAxisesInstance[index].minimum = minimumSpecificValueRangePrimaryAxis * 1.1;
                specificValueAxisesInstance[index].maximum = maximumSpecificValueRangePrimaryAxis * 1.1;
            } else {
                specificValueAxisesInstance[index].title = /*(0 === si++) ? */chartData.chartDesign.secondaryYAxisTitle;//' : '';
                specificValueAxisesInstance[index].opacity = 0;
                specificValueAxisesInstance[index].labelsEnabled = false;
                if (chartData.graphDesign[specificAssignedAxisesDefinition[index][0]].serialChartType == "column") {
                    specificValueAxisesInstance[index].stackType = stackType[chartData.graphDesign[chartData.chartKeys[0]].stackType];
                }
                specificValueAxisesInstance[index].minimum = minimumSpecificValueRangeSecondaryAxis * 1.1;
                specificValueAxisesInstance[index].maximum = maximumSpecificValueRangeSecondaryAxis * 1.1;
                specificValueAxisesInstance[index].position = 'right';
            }
	        specificValueAxisesInstance[index].axisColor = axisColor;
	        specificValueAxisesInstance[index].color = axisTextColor;
	        chart.addValueAxis(specificValueAxisesInstance[index]);
        });

        if (chartData.chartDesign.showTitle) {
            chart.addTitle(chartData.chartDesign.title, chartData.chartDesign.titleFontSize);
        }

        if (chartData.chartDesign.showXAxis) {
            var categoryAxis = chart.categoryAxis; // get graph X axis
            categoryAxis.gridPosition = "start";
            categoryAxis.gridAlpha = 0;
            categoryAxis.labelsEnabled = chartData.chartDesign.showXAxisLabels; // labels visibility
            categoryAxis.title = chartData.chartDesign.xAxisTitle; // x axis title
            categoryAxis.labelFrequency = chartData.chartDesign.labelFrequency;
            categoryAxis.axisColor = axisColor;
            categoryAxis.color = axisTextColor;
            categoryAxis.fontSize = 11;
            categoryAxis.labelRotation = 45;
            categoryAxis.position = chartData.chartDesign.xAxisPosition;
        }

        var primaryValueAxis = new AmCharts.ValueAxis(); // create new y axis
        if (chartData.chartDesign.showYAxis) {
            primaryValueAxis.labelsEnabled = chartData.chartDesign.showYAxisLabels;
            primaryValueAxis.title = chartData.chartDesign.yAxisTitle;
            primaryValueAxis.stackType = stackType[chartData.graphDesign[chartData.chartKeys[0]].stackType];
            primaryValueAxis.minimum = chartData.chartDesign.showWholeGraph ? 0 : undefined;
            if (chartData.chartDesign.minimum !== null) {
                primaryValueAxis.minimum = chartData.chartDesign.minimum;
            }
            if (chartData.chartDesign.maximum !== null) {
                primaryValueAxis.maximum = chartData.chartDesign.maximum;
            }
            primaryValueAxis.axisColor = axisColor;
            primaryValueAxis.color = axisTextColor;

            if (chartData.chartDesign.axisAbsoluteValuesLabels) {
                primaryValueAxis.labelFunction = function formatLabel(value, valueString, axis){
                    if (value < 0) { // no minus sign next to negative numbers
                        valueString = valueString.substr(1);
                    }
                    return valueString;
                };
            }

            chart.addValueAxis(primaryValueAxis); // add y axis to chart
        } else {
            var primaryValueAxis = new AmCharts.ValueAxis();
            primaryValueAxis.title = '';
            primaryValueAxis.opacity = 0;
            primaryValueAxis.labelsEnabled = false;
            primaryValueAxis.stackType = stackType[chartData.graphDesign[chartData.chartKeys[0]].stackType];
            primaryValueAxis.minimum = chartData.chartDesign.showWholeGraph ? 0 : undefined;
            if (chartData.chartDesign.minimum !== null) {
                primaryValueAxis.minimum = chartData.chartDesign.minimum;
            }
            if (chartData.chartDesign.maximum !== null) {
                primaryValueAxis.maximum = chartData.chartDesign.maximum;
            }
	        primaryValueAxis.axisColor = axisColor;
	        primaryValueAxis.color = axisTextColor;
	        
            if (chartData.chartDesign.axisAbsoluteValuesLabels) {
                primaryValueAxis.labelFunction = function formatLabel(value, valueString, axis){
                    if (value < 0) { // no minus sign next to negative numbers
                        valueString = valueString.substr(1);
                    }
                    return valueString;
                };
            }
	        chart.addValueAxis(primaryValueAxis);
        }

        var secondaryValueAxis = new AmCharts.ValueAxis();
        if (chartData.chartDesign.showSecondaryYAxis) {
            secondaryValueAxis.labelsEnabled = chartData.chartDesign.showSecondaryYAxisLabels;
            secondaryValueAxis.title = chartData.chartDesign.secondaryYAxisTitle;
            secondaryValueAxis.stackType = stackType[chartData.graphDesign[chartData.chartKeys[0]].stackType];
            secondaryValueAxis.position = 'right';
            secondaryValueAxis.minimum = chartData.chartDesign.showWholeGraph ? 0 : undefined;
	        secondaryValueAxis.axisColor = axisColor;
	        secondaryValueAxis.color = axisTextColor;
	        chart.addValueAxis(secondaryValueAxis);
        }

        if (chartData.chartDesign.showCursor) { // special Joudek feature called "Pojízdník"
            var chartCursor = new AmCharts.ChartCursor(); // create new Pojízdník
            chartCursor.color = chartData.chartDesign.cursorTextColor;
            chartCursor.cursorColor = chartData.chartDesign.cursorColor;
            chartCursor.bulletsEnabled = false;
            chartCursor.bulletSize = 0;
            chart.addChartCursor(chartCursor); // add Pojízdník to graph

        }

        if (chartData.chartDesign.showLegend) {
            var legend = new AmCharts.AmLegend(); // create new legend
            legend.valueText = ''; // text after values (currently none)
            legend.marginLeft = 110;
            legend.fontSize = 8;
            chart.addLegend(legend); // add legend to chart
        }

        // for loop which adds graph to chart with specific graph design
        for (var i = 0; i < chartData.chartsCount; i++) {
            var graph = new AmCharts.AmGraph(); // create new graph
            // get identificator
            var key = chartData.chartKeys[i];

            // set values
            graph.valueField = key;

            // set specific graph design
            graph.type = chartData.graphDesign[key].serialChartType;
            graph.lineAlpha = chartData.graphDesign[key].lineAlpha;
            graph.lineColor = chartData.graphDesign[key].lineColor;

            graph.fillAlphas = chartData.graphDesign[key].fillAlpha;
            graph.fillColors = chartData.graphDesign[key].fillColor;

            graph.lineThickness = chartData.graphDesign[key].lineThickness;
            graph.bullet = chartData.graphDesign[key].bulletType;
            graph.bulletSize = chartData.graphDesign[key].bulletSize;

            graph.title = chartData.graphDesign[key].title;


            if ($.isEmptyObject(specificValueAxisesInstance)) {
                if (chartData.chartDesign.showSecondaryYAxis && chartData.graphDesign[key].assignedAxis == "SECONDARY") {
                    graph.valueAxis = secondaryValueAxis;
                } else {
                    graph.valueAxis = primaryValueAxis;
                }

                var units = "";
                if (chartData.graphDesign[key].assignedAxis == "SECONDARY") {
                    units = chartData.chartDesign.secondaryYAxisTitle.match(/\[.*\]/);
                } else {
                    units = chartData.chartDesign.yAxisTitle.match(/\[.*\]/);
                }

                if (units) {
                    units = units[0];
                } else {
                    units = "";
                }

                units = units.replace(/[\[\]]/g, "");
            } else {
                graph.valueAxis = specificValueAxisesInstance[chartData.graphDesign[key].specificAssignedAxis];
            }

            if (chartData.chartDesign.customBalloonValues) {
                graph.balloonText = chartData.graphDesign[key].title + ": [[POM" + (i + 1) + "]] " + chartData.graphDesign[key].unit;
            } else if (chartData.chartDesign.showGraphTitles) {
                graph.balloonText = chartData.graphDesign[key].title + ": [[value]] " + chartData.graphDesign[key].unit;
            } else {
                graph.balloonText = "[[value]]" + chartData.graphDesign[key].unit;
            }

	        graph.connect = false;
            chart.addGraph(graph); // add graph to chart

        }
    } else if (chartData.chartDesign.chartType === 'gantt') {
        chart = AmCharts.makeChart("chartdiv", {
            type: "gantt",
            theme: "light",
            marginRight: 70,
            period: "DD",
            dataDateFormat: "YYYY-MM-DD HH:NN",
            startDate: "2015-01-01",
            columnWidth: 0.5,
            valueAxis: {
                type: "date"
            },
            brightnessStep: 7,
            graph: {
                fillAlphas: 1,
                lineAlpha: 1,
                lineColor: "#fff",
                balloonText: "<b>[[task]]</b><br />[[open]] -- [[value]]"
            },
            rotate: true,
            categoryField: "category",
            segmentsField: "segments",
            colorField: "color",
            startDateField: "start",
            endDateField: "end",
            dataProvider: chartData.chartData,
            valueScrollbar: {
                autoGridCount: true
            },
            titles: [
                {
                    "text": chartData.chartDesign.title,
                    "size": 15
                }
            ],
            chartCursor: {
                cursorColor: "#55bb76",
                valueBalloonsEnabled: false,
                cursorAlpha: 0,
                valueLineAlpha: 0.5,
                valueLineBalloonEnabled: true,
                valueLineEnabled: true,
                zoomable: false,
                valueZoomable: true
            },
            export: {
                enabled: true
            },
            creditsPosition: "bottom-right"
        });
        // AXES
        // category
        var ganttCategoryAxis = chart.categoryAxis;
        ganttCategoryAxis.gridCount = chartData.chartData.length;
        ganttCategoryAxis.autoGridCount = false;
        ganttCategoryAxis.showAllValueLabels = true;
        // resize drawing area
        $('#dv-data-graph-content').css('height', 400 + Math.round(chartData.chartData.length / 2) * 40 + 'px');
    } else {

        chart = new AmCharts.AmPieChart();

	    chart.numberFormatter = {
		    decimalSeparator: '.',
		    thousandsSeparator: '',
		    precision: -1
	    };

        if (chartData.chartDesign.showTitle) {
            chart.addLabel("0", "10", chartData.chartDesign.title, "center", chartData.chartDesign.titleFontSize);
        }

        if (chartData.chartDesign.showLegend) {
            var legend = new AmCharts.AmLegend(); // create new legend
            legend.valueText = ''; // text after values (currently none)
            legend.align = 'center';
            legend.fontSize = 8;
            chart.addLegend(legend); // add legend to chart
        }

        chart.backgroundAlpha = 0;
        chart.dataProvider = chartData.chartData;
        chart.titleField = chartData.chartDesign.keyIdentifier;
        chart.valueField = chartData.chartDesign.valueIdentifier;
        chart.labelsEnabled = chartData.chartDesign.showLabels;
        chart.labelText = "[[title]]";
        chart.labelRadius = 10;
        chart.colors = chartData.chartDesign.colours;
        chart.startDuration = chartData.chartDesign.animationDuration;

        // resize drawing area
        $('#dv-data-graph-content').css('height', 400 + Math.round(chartData.chartData.length / 2) * 40 + 'px');

    }

    chart.write(target); // write whole chart to HTML
}