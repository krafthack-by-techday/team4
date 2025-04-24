downloadDataFlow = function (docPath) {
	this.downloadFile(baseUrl + '/dms_web/show_download', [
		{ 'key': 'path', 'value': docPath }
	]);
};

(function() {

	function DataFlowLogDialog(dataFlowId) {
		this.dataFlowId = dataFlowId;
	}

	DataFlowLogDialog.prototype.getPath = function () {
		var path = $('#download-path').val();
		$('#download').empty();
		var pathLink = $("<a></a>");
		var aPath = path.replace(/\\/g, '/');
		pathLink.attr("href", "javascript:downloadDataFlow('" + aPath + "');");
		pathLink.html(path);
		$('#download').append(pathLink);
	};

	DataFlowLogDialog.prototype.getFileName = function () {
		var filenameColumn = $("td.td-wrap").html();
		var start = filenameColumn.lastIndexOf("/") + 1;
		filenameColumn = filenameColumn.substring(start, filenameColumn.length);
		$("td.td-wrap").html(filenameColumn.replace(/_/g, "_<wbr />"));
	};

	DataFlowLogDialog.prototype.getDateTimeString = function () {
		var m = moment($("td.td-date").html(), 'YYYY-MM-DD HH:mm');
		$("td.td-date").html(m.format('DD.MM.YYYY') + '<br />' + m.format('HH:mm') + " UTC");
	};

	DataFlowLogDialog.prototype.getStatus = function () {
		$("td.td-status").html(getStatusTableColumnBody($("td.td-status").html(), "DATA_ITEM"));
	};

	DataFlowLogDialog.prototype.initializeFlowLogTable = function () {
		var dflsThis = this;
		this.table = $('#table-data-flow-log').initDataTable({
			"getCustomFilterData": function () {
				var filterMap = new Array();
				filterMap.push({"key": "dataFlowInstance.id", "value": dflsThis.dataFlowId + ""});
				return filterMap;
			},
			"bLengthChange": true,
			"bInfo": false,
			"bFiltr": false,
			"bServerSide": true,
			"bProcessing": true,
			"sAjaxSource": "/table/data/adapter",
			"fnServerData": function (sSource, aoData, fnCallback) {
				ajaxRequestResponse({
					dataType: 'json',
					contentType: "application/json;charset=UTF-8",
					method: "POST",
					url: sSource,
					data: stringify_aoData(aoData),
					success: function (json) {
						fnCallback(json);
					}
				});
			},
			"fnServerParams": function (aoData) {
				aoData.push({ "name": "serviceName", "value": "flowLogDatatableAdapter" });
			},
			"fnRowCallback": function (nRow, aData) {
				$(nRow).attr("id", aData[0]);
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
				"sLengthMenu": "Records per page _MENU_",
				"sSearch": "Search all columns:"
			},
			"aoColumns": [
				{"sName": "id", "bVisible": false},
				{ "sClass": "news-second-column", "bSortable": false, "sName": "messageTimestampString" },
				{ "sClass": "news-second-column", "bSortable": false, "sName": "messageLevel.description", mRender: function (columnData) {
					return '<div class="td-item-status data-flow-log-message-type-' + columnData + '">' + columnData + '</div>';
				} },
				{ "sClass": "news-second-column", "bSortable": false, "sName": "messageSubjectText"},
				{ "sClass": "news-second-column", "bSortable": false, "sName": "messageText", mRender: function (data) {
					return '<div class="break-word">' + data + '</div>';
				} }
			],
			"aaSorting": [
				[0, 'desc']
			]
		});

		this.getStatus();
		this.getDateTimeString();
		this.getFileName();
		this.getPath();
	};

	DataFlowLogDialog.prototype.showDataLog = function (fullDataFlowLog, url) {
		this.flowLogIdOptions = new Array();
		this.flowLogIdOptions.push({"key": "dataFlowInstance.id", "value": this.dataFlowId + ""});
		var dflsThis = this;
		ajaxRequestResponse({
			url: url,
			data: {
				id: this.dataFlowId
			},
			success: function (data) {
				var contentClass = '';
				if(typeof fullDataFlowLog !== 'undefined' && fullDataFlowLog === false){
					contentClass = "dataflow-lite"
				}
				$('<div id="flow-dialog-content" class="'+contentClass+'"></div>').appendTo('body').append(data).triggerCallback(dflsThis.initializeFlowLogTable()).initDialog({
					modal: true,
					width: fullDataFlowLog ? 1000 : 800,
					title: 'Data Flow Log',
					topCloseButton: {text: 'Close'},
					closeDivClasses: ["data-flow-dialog-close-button"],
					close: function () {
						$('#flow-dialog-content').remove();
					}
				});
			}

		});
	};

	function CreatedDataFlowDialog(dataFlowId) {
		this.dataFlowId = dataFlowId;
	}

	CreatedDataFlowDialog.prototype.initializeCreatedDataFlowTable = function () {
		var dialogThis = this;
		this.table = $('#table-configuration-link-data-flow').initDataTable({
			"getCustomFilterData": function () {
				var filterMap = new Array();
				filterMap.push({"key": "dataFlowInstance.id", "value": dialogThis.dataFlowId + ""});
				return filterMap;
			},
			"bLengthChange": true,
			"bInfo": false,
			"bFiltr": false,
			"bServerSide": true,
			"bProcessing": true,
			"sAjaxSource": "/table/data/adapter",
			"fnServerData": function (sSource, aoData, fnCallback) {
				ajaxRequestResponse({
					dataType: 'json',
					contentType: "application/json;charset=UTF-8",
					method: "POST",
					url: sSource,
					data: stringify_aoData(aoData),
					success: function (json) {
						fnCallback(json);
					}
				});
			},
			"fnServerParams": function (aoData) {
				aoData.push({ "name": "serviceName", "value": "configurationLinkDataFlowInstanceDatatableAdapter" });
			},
			"fnRowCallback": function (nRow, aData) {
				$(nRow).attr("id", aData[0]);
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
				"sLengthMenu": "Records per page _MENU_",
				"sSearch": "Search all columns:"
			},
			"aoColumns": [
				{ "sClass": "news-second-column", "bSortable": false, "sName": "documentID" },
				{ "sClass": "news-second-column", "bSortable": false, "sName": "submissionTimestamp" },
				{ "sClass": "news-second-column", "bSortable": false, "sName": "id", mRender: function (columnData) {
						return '<a class="show-source-link-complete-dataflow-detail detail-id-' + columnData + '">Data Flow Detail</a>';
					} }
			],
			"aaSorting": [
				[0, 'desc']
			]
		});
	};

	CreatedDataFlowDialog.prototype.showDataFlows = function (url) {
		this.flowLogIdOptions = new Array();
		this.flowLogIdOptions.push({"key": "dataFlowInstance.id", "value": this.dataFlowId + ""});
		var dflsThis = this;
		ajaxRequestResponse({
			url: url,
			data: {
				id: this.dataFlowId
			},
			success: function (data) {
				var contentClass = '';
				$('<div id="created-flow-dialog-content" class="'+contentClass+'"></div>').appendTo('body').append(data).triggerCallback(dflsThis.initializeCreatedDataFlowTable()).initDialog({
					modal: true,
					width:  1000,
					title: 'Created Configuration Links',
					topCloseButton: {text: 'Close'},
					closeDivClasses: ["data-flow-dialog-close-button"],
					close: function () {
						$('#created-flow-dialog-content').remove();
					}
				});
			}

		});
	}

	function closeAllDataFlowDialogs() {
		$('#flow-dialog-content').remove();
		$('#created-flow-dialog-content').remove();
		$('.top-close-button-container.data-flow-dialog-close-button').remove();
	}

	function handleDataFlowDetailLinkClick(event, targetUrl) {

		var classes = $(event.target).attr('class');
		var specificClass = classes.match(/(detail-id-)([0-9]*)/);

		if(typeof specificClass !== 'undefined' && specificClass !== null && typeof specificClass[2] !== 'undefined' && specificClass[2] !== null) {
			var dfi = specificClass[2];
			var dialog;
			if (targetUrl === '/mnt/mnt_configuration_link_data_flow_list') {
				dialog = new CreatedDataFlowDialog(dfi);
				dialog.showDataFlows(targetUrl);
			} else {
				dialog = new DataFlowLogDialog(dfi);
				dialog.showDataLog(!$(event.target).hasClass('dataflow-lite'), targetUrl);
			}
		} else {
			if(typeof console !== 'undefined'){
				console.error("Class defining dataflow ID is incorrect.")
			}
		}
	}

	function handleDFPMLinkClick(event) {

		var classes = $(event.target).attr('class');
		var specificClass = classes.match(/(detail-id-)([0-9a-z._-]*)/);

		if(typeof specificClass !== 'undefined' && specificClass !== null && typeof specificClass[2] !== 'undefined' && specificClass[2] !== null) {
			var dfpmId = specificClass[2];
			var url =  baseUrl + "/mnt/processing/recordEvents?processingMonitoringId=" + dfpmId;
			window.open(url, '_blank');
		} else {
			if(typeof console !== 'undefined'){
				console.error("Class defining dataflow ID is incorrect.")
			}
		}
	}

	function handleDFPMguig02LinkClick(event) {

		var classes = $(event.target).attr('class');
		var specificClass = classes.match(/(detail-id-)([0-9a-z._-]*)/);

		if(typeof specificClass !== 'undefined' && specificClass !== null && typeof specificClass[2] !== 'undefined' && specificClass[2] !== null) {
			var dfpmId = specificClass[2];
			var url =  guig02Url + "dfpm/detail?id=" + dfpmId;
			window.open(url, '_blank');
		} else {
			if(typeof console !== 'undefined'){
				console.error("Class defining dataflow ID is incorrect.")
			}
		}
	}

	$(document).ready(function() {
		$(document).on('click', 'a.show-dataflow-detail', function(event) {
			closeAllDataFlowDialogs();
			handleDataFlowDetailLinkClick(event, '/mnt/mnt_detailed_data_Flow');
		});
		$(document).on('click', 'a.show-dfpm-detail', function(event) {
			closeAllDataFlowDialogs();
			handleDFPMLinkClick(event);
		});
		$(document).on('click', 'a.show-dfpm-detail-guig02', function(event) {
			closeAllDataFlowDialogs();
			handleDFPMguig02LinkClick(event);
		});
		$(document).on('click', 'a.show-source-link-complete-dataflow-detail', function(event) {
			closeAllDataFlowDialogs();
			handleDataFlowDetailLinkClick(event, '/mnt/mnt_detailed_data_Flow');
		});
		$(document).on('click', 'a.show-created-link-complete-dataflow-detail', function(event) {
			closeAllDataFlowDialogs();
			handleDataFlowDetailLinkClick(event, '/mnt/mnt_detailed_data_Flow');
		});
		$(document).on('click', 'a.show-configuration-link-dataflow-list', function(event) {
			closeAllDataFlowDialogs();
			handleDataFlowDetailLinkClick(event, '/mnt/mnt_configuration_link_data_flow_list');
		});
	});

}).call(this);