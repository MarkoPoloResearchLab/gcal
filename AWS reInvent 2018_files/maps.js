var mapJson, mapHash, typeHash, companyHash, itemHash, tabs, paper, mapImg, exhibitorJson;
var paperWidth = paperHeight = 0;
var opWidth = opHeight = 0;
var zoom = .1;
var zoomCt = 0;
var defaultItemColor = "#ccc";
var itemAlpha = 0;
var itemColor = null;
var selectedItemAlpha = 1;
var selectedItemStrokeColor = "#17df20";
var selectedItemStrokeWidth = 1;
var textAlpha = 1;
var resizeTimeout;
var selectRequestItem = false;
var mapLoading = false;

function mapsOnload(){
	mapHash = new Object();
	if(isIE() && isIE().version === 8) $('body').addClass('ie8');
	$("#loadingSpinner").show();
	getMapData(setupMapView);
}

function setupMapView(json){
	$("#loadingSpinner").hide();
	$("#mapBody nav, #tabFilter, #toggleNav").show();
	mapJson = json;
	if($("body.simple").length){
		$("#mapBody nav, #mapScroll").css("height", $(window).height() - $("#mapBody header").outerHeight() - 5);
	}
	else{
		$("#mapBody nav, #mapScroll").css("height", $("#mapPopup").innerHeight() - 10);
	}
	tabs = $("#mapBody nav").tabs({
		activate: function(event, ui){
			toggleTabFilter(ui);
		}
	});
	setupMapsTab();
	setupMapPageEvents();
	if(mapId) $("#map_" + mapId).click();
	if(itemId) selectRequestItem = true;
}

function setupMapPageEvents(){
	$("#tabFilter input").keyup(filterTabList).click(filterTabList);
	$("#mapsTab ul").on("click", "a", function(){
		if(!mapLoading){
			mapLoading = true;
			clearMapTabs();
			$("#loadingSpinner").show();
			$("#mapTooltip").hide();
			$("#mapContent").html("");
			$("#mapsTab .ui-state-highlight").removeClass("ui-state-highlight");
			$(this).addClass("ui-state-highlight");
			if($("#mapPopup").length){
				$("#mapPopup").dialog("option", "title", $(this).html());
			}
			else{
				$("header").html($(this).html());
			}
			var map = mapHash[$(this).data("id")];
			mapId = map.mapfileId;
		
			mapImg = new Image();
			mapImg.onload = function(){
				$("#mapContent").html("");
				paperWidth = opWidth = mapImg.width;
				paperHeight = opHeight = mapImg.height;
				paper = Raphael(document.getElementById("mapContent"), mapImg.width, mapImg.height);
				paper.image(mapImg.src, 0, 0, mapImg.width, mapImg.height);
				if(map.type == "boothmap"){ setupBooths(map); }
				else{ setupRooms(map); }
				if(selectRequestItem){
					$("#mapBody nav").tabs("option", "active", 1);
					$("#itemsTab a[data-id='" + itemId + "']").click();
					mapItemMouseOver(itemId);
					selectRequestItem = null;
				}
				$("#loadingSpinner").hide();
				mapLoading = false;
			}
			mapImg.onerror = function(){
				messageDialog($("#mapImageNoLoad").html());
				$("#loadingSpinner").hide();
				mapLoading = false;
			}
			mapImg.src = map.dynamicImageUrl;
		}
	});
	$("#toggleNav").click(toggleNav).mouseover(function(){ $(this).addClass("ui-state-hover"); }).mouseout(function(){ $(this).removeClass("ui-state-hover"); });

	$(window).resize(function(){
		if($("body.simple").length){
			if(resizeTimeout) clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(function(){
				$("#mapBody nav, #mapScroll").css("height", $(window).height() - $("#mapBody header").outerHeight() - 5);
			}, 500);
		}
	});

	$("#mapScroll").scroll(function(){
		if($("#mapTooltip").data("itemId")) mapItemMouseOver($("#mapTooltip").data("itemId"));
	});

	$("#zoomIn").click(zoomMapIn);
	$("#zoomOut").click(zoomMapOut);
	$("#printMap").click(printMap);
	$("#closeTooltip").click(function(){ $("#mapTooltip").fadeOut("fast"); });
}

function setupMapEvents(){
	$("#mapBody .ui-tabs-panel:not(#mapsTab) ul").on("click", "li a", function(){
		var tab = $(this).closest(".ui-tabs-panel").attr("id")
		$(this).toggleClass("ui-state-highlight");
		if($(".ui-state-highlight").length){
			removeMapItemHighlighting();
		}
		else{
			addMapItemHighlighting();
		}

		// remove other tab's selected items
		$("#mapBody .ui-tabs-panel:not(#" + tab + ") .ui-state-highlight").removeClass("ui-state-highlight");

		// get hash
		var hash = null;
		switch(tab){
			case "itemsTab": hash = itemHash; break;
			case "typesTab": hash = typeHash; break;
			case "companyTab": hash = companyHash; break;
		}

		$("#" + tab + " .ui-state-highlight").each(function(){
			var hashObj = hash[$(this).data("id")];
			if(hashObj.items){ // types, company
				for(var i = 0; i < hashObj.items.length; i++){
					highlightMapItem(hashObj.items[i].id);
				}
			}
			else{ // item
				highlightMapItem(hashObj.item.id);
			}
		});
	});
}

function toggleNav(){
	var $anchor = $(this);
	var $nav = $("#mapBody nav");
	var $filter = $("#tabFilter");
	var $map = $("#mapScroll");
	var $tooltip = $("#mapTooltip");
	var toolTipId = ($("#mapTooltip:visible").length) ? $("#mapTooltip").data("itemId") : 0;

	$("#mapTooltip").hide();
	if(!$("#mapBody nav:hidden").length){
		$nav.animate({
			left: "-310px"
		}, 250, "linear", function(){
			$(this).hide();
			if(toolTipId) mapItemMouseOver(toolTipId);
		});

		$anchor.animate({
			left: "-37px"
		}, 250, "linear", function(){
			$(this).html($(this).data("show"));
		});

		$filter.animate({
			left: "-310px"
		}, 250, "linear", function(){
			$(this).hide();
		});

		$map.animate({
			"margin-left": "0px"
		}, 250, "linear");
	}
	else{
		$nav.show();
		$nav.animate({
			left: "0px"
		}, 250, "linear", function(){
			if(toolTipId) mapItemMouseOver(toolTipId);
		});

		$anchor.animate({
			left: "275px"
		}, 250, "linear", function(){
			$(this).html($(this).data("hide"));
		});

		$filter.show();
		$filter.animate({
			left: "0px"
		}, 250, "linear");

		$map.animate({
			"margin-left": "315px"
		}, 250, "linear");
	}
}

function filterTabList(){
	var currVal = $("#tabFilter input").val().toLowerCase();
	var currTab = $("#mapBody nav").tabs("option", "active");
	var $currPanel = $(".ui-tabs-panel:eq(" + currTab + ")");
	$currPanel.find("li").hide();
	$currPanel.find("ul li").each(function(){
		if($(this).find("a").html().toLowerCase().indexOf(currVal) != -1){
			$(this).show();
		}
	});
}

function toggleTabFilter(ui){
	var $input = $("#tabFilter input");

	// store previous tab's filter
	var prevId = ui.oldPanel[0].id;
	$input.data(prevId, $input.val());

	// populate new tab's filter
	var currId = ui.newPanel[0].id;
	if($input.data(currId)){ $input.val($input.data(currId)); }
	else{ $input.val(""); }

	// fire filter
	filterTabList();
}

function clearMapTabs(){
	$("nav .ui-tabs-nav li:gt(0), nav .ui-tabs-panel:gt(0)").remove();
}

function addMapTab(id, text, content){
	tabs.find(".ui-tabs-nav").append('<li><a href="#' + id + '">' + text+ '</a></li>');
	tabs.append('<div id="' + id + '">' + content + '</div>');
	$("#" + id).css("height", $("#mapBody nav").height() - $("#mapBody nav .ui-tabs-nav").outerHeight() - 35);
	tabs.tabs("refresh");
}

function setupMapsTab(){
	var mapListHtml = "";
	for(var i = 0; i < mapJson.length; i++){
		var map = mapJson[i];
		if(map.publishConnect){
			mapHash[map.mapfileId] = map;
			mapListHtml += '<li><a id="map_' + map.mapfileId + '" data-id="' + map.mapfileId + '" href="javascript:void(0);">' + map.name + '</a></li>';
		}
	}
	$("#mapsTab ul").html(mapListHtml);
}

function setupRooms(map){
	if(map.items.length){
		itemHash = new Object();

		var listHtml = "";
		for(var i = 0; i < map.items.length; i++){
			var item = map.items[i];
			if(item.mapfileId == mapId){
				item.id = item.ID;
				listHtml += '<li><a data-id="' + item.id + '" href="javascript:void(0);">' + item.name + '</a></li>';
				addItemToMap(item);
			}
		}

		if(listHtml != ""){
			addMapTab("itemsTab", $("#roomsText").html(), "<ul>" + listHtml + "</ul>");
			setupMapEvents();
		}
	}
}

// setup booths tab && map booths
function setupBooths(map){
	if(map.items.length){
		// reset hash maps for type, item, & company
		typeHash = new Object();
		itemHash = new Object();
		companyHash = new Array();

		var hasMapItems = false;
		for(var i = 0; i < map.items.length; i++){
			var item = map.items[i];
			if(item.mapfileId == mapId){
				item.id = item.ID;

				// add exhibitor types for this item to typeHash hash map
				if(item.type && typeHash[item.type]){
					typeHash[item.type].items.push(item);
				}
				else if(item.type && item.typeValue){
					typeHash[item.type] = {value: item.typeValue, items: [item]};
				}

				// add company for this item to companyHash hash map
				if(item.company && companyHash[item.exhibitorId]){
					companyHash[item.exhibitorId].items.push(item);
				}
				else if(item.company){
					companyHash[item.exhibitorId] = {value: item.company, items: [item]};
				}

				// create booth tab & list
                if(item.company){
                    var itemName = (item.company) ? item.company : item.name;
                    addItemToMap(item);
					hasMapItems = true;
                }
			}
		}

		if(hasMapItems){
			setupCompanyTab(map);
			setupTypesTab(map);
			setupMapEvents();
		}
	}
}

function setupTypesTab(map){
	var typeCt = 0;
	var listHtml = '<ul>';
	for(i in typeHash){
		listHtml += '<li><a data-id="' + i + '" href="javascript:void(0);">' + typeHash[i].value + '</a></li>';
		typeCt++;
	}
	listHtml += '</ul>';
	if(typeCt) addMapTab("typesTab", $("#typeText").html(), listHtml);
}

function setupCompanyTab(){
	var companyCt = 0;
	var listHtml = '<ul>';
	for(i in companyHash){
		listHtml += '<li><a data-id="' + i + '" href="javascript:void(0);">' + companyHash[i].value + '</a></li>';
		companyCt++;
	}
	listHtml += '</ul>';
	if(companyCt) addMapTab("companyTab", $("#companyText").html(), listHtml);
}

function addItemToMap(item){
	var shape, text;

	switch(item.shape){
		case "square":
			shape = paper.rect(item.xCoord, item.yCoord, item.width, item.height);
			text = paper.text(shape.attr("x") + (shape.attr("width") / 2), shape.attr("y") + (shape.attr("height") / 2), item.name).attr("cursor", "default");
			break;
		case "circle":
			shape = paper.circle(item.xCoord, item.yCoord, item.radius);
			text = paper.text(shape.attr("cx") + (shape.attr("width") / 2), shape.attr("cy") + (shape.attr("height") / 2), item.name).attr("cursor", "default");
			break;
	}

	var color = defaultItemColor;
	if(item.color || item.typeColor) color = (item.typeColor) ? item.typeColor : item.color;
	shape.attr({ "fill": color, "fill-opacity": selectedItemAlpha, "stroke": 0 }); // start all booths out with full opacity
	shape.data("txt", text).data("id", item.id).mouseover(mapItemMouseOver);
	text.attr({ "fill": "#000000", "fill-opacity": textAlpha });
	text.data("svg", shape).data("id", item.id).mouseover(mapItemMouseOver);
	if(item.rotation) shape.attr("transform", "R" + parseInt(item.rotation));
	itemHash[item.id] = {item: item, svg: shape, txt: text};
}

function mapItemMouseOver(id){
	try{
		var itemId = (typeof id != "object") ? id : this.data("id");
		var itemObj = itemHash[itemId];
		var item = itemObj.item;
		if(itemObj.svg.attr("fill-opacity")){
			$("#mapTooltip").removeClass("bottom");
			$("#mapTooltip strong").html(((item.company) ? item.company : item.name));
			$("#mapTooltip small").html(((item.typeValue) ? item.typeValue : ""));
			var pageTop = $("#mapBody").offset().top;
			var scrollLeft = $("#mapScroll").scrollLeft();
			var scrollTop = $("#mapScroll").scrollTop();
			var outerHeight = $("#mapTooltip").outerHeight();
			var zoomInWidthDiff = paperWidth / opWidth;
			var zoomInHeightDiff = paperHeight / opHeight;
			var marginLeft = ($("nav:hidden").length) ? -3 : $("#mapBody nav").outerWidth();
            var headerHeight = ($("#mapBody header:visible").length) ? $("#mapBody header").outerHeight() : 0;
			var left = 0
			var top = 0;
			switch(item.shape){
				case "square":
                    top = (item.yCoord * zoomInHeightDiff) + headerHeight - scrollTop - 3;
                    left = ((item.xCoord + (item.width / 2)) * zoomInWidthDiff) + marginLeft - scrollLeft - ($("#mapTooltip").outerWidth() / 2) + 3;
					if((top - outerHeight) < 0){
                        top = ((item.yCoord + item.height) * zoomInHeightDiff) + headerHeight - scrollTop + 4;
						$("#mapTooltip").addClass("bottom");
					}
					break;
				case "circle":
					top = ((item.yCoord - item.radius) * zoomInHeightDiff) + headerHeight - scrollTop - 4;
                    left = (item.xCoord * zoomInWidthDiff) + marginLeft - scrollLeft - ($("#mapTooltip").outerWidth() / 2) + 3;
					if((top - outerHeight) < 0){
						top = ((item.yCoord + item.radius) * zoomInHeightDiff) + headerHeight - scrollTop + 3;
						$("#mapTooltip").addClass("bottom");
					}
					break;
			}
			if(item.company){
				var url = baseHref + "/exhibitorDetail.ww?EXHIBITOR_ID=" + item.exhibitorId;
				$("#mapTooltip #jumpToExhibitor").attr("href", url).show();
			}
			else{
				$("#mapTooltip #jumpToExhibitor").hide();
			}
			$("#mapTooltip").show().css({
				top: ($("#mapTooltip").hasClass("bottom")) ? top : top - $("#mapTooltip").outerHeight(),
				left: left
			});
			$("#mapTooltip").data("itemId", itemId);
		}
	}
	catch(e){}
}

function removeMapItemHighlighting(){
	for(i in itemHash){
		var svg = itemHash[i].svg;
		svg.attr({
			"fill-opacity": itemAlpha,
			"stroke": 0
		});
	}
}

function addMapItemHighlighting(){
	for(i in itemHash){
		var svg = itemHash[i].svg;
		svg.attr({
			"fill-opacity": selectedItemAlpha,
			"stroke": 0
		});
	}
}

function highlightMapItem(id){
	if(itemHash[id] && itemHash[id].svg){
		itemHash[id].svg.attr({
			"fill-opacity": selectedItemAlpha,
			"stroke-width": selectedItemStrokeWidth,
			"stroke": selectedItemStrokeColor
		});
	}
}

/**************** general map functions ****************/
function getMapData(callback){
	if(storage){
		// check if map data exists
		var json = getDataAsset("connectMaps");
		var lastUpdate = getDataAsset("connectMapsUpdated");
		
		// if map data doesn't exist, get it and store it
		if(!json || !lastUpdate){
			updateMapDataAjax(callback);
		}
		else{
			// if map data exists, check last updated time and compare against updateMapsInterval
			if((lastUpdate + updateMapsInterval) <= new Date().getTime()){
				updateMapDataAjax();
				if(callback) callback(json);
			}
			else{
				if(callback) callback(json);
			}
		}
	}
	else{
		updateMapDataAjax(callback);
	}
}

function updateMapDataAjax(callback){
	// get map data first
	var mapDataUrl = baseHref + "/mapFiles.ww";
	$.post(mapDataUrl, {}, function(mResult){
		mResult = JSON.parse(mResult);
		switch(mResult.status){
			case "success":
				if(mResult.data){
					// if map data was grabbed successfully, grab exhibitor data
					var exhibitorDataUrl = baseHref + "/mapExhibitorInfo.ww";
					$.post(exhibitorDataUrl, {}, function(eResult){
						eResult = JSON.parse(eResult);
						switch(eResult.status){
							case "success":
								// bind exhibitor data to map data
								var maps = mResult.data;
								var exhibitors = eResult.data;
	
								// map & exhibitor data could get large, use web worker to avoid slowdown of page load
								var workerUrl = baseHref + "/assets/js/maps/processMapDataWorker.js";
								var params = {"maps": maps, "exhibitors": exhibitors, "status": "start"};
								var worker = createWorker(workerUrl, params, function(e){
									if(e.data.status == "done" && storage){
										setDataAsset("connectMaps", e.data.maps);
										setDataAsset("connectMapsUpdated", new Date().getTime());
										worker.postMessage("stop");
										if(callback) callback(e.data.maps);
									}
								});
	
								if(!worker){
									processMapData(maps, exhibitors, callback);
									if(callback) callback(maps);
								}
								break;
							case "error": if(callback) callback(false, resultJson.message); break;
							case "logout": break;
						}
					});
				}
				else if(callback) callback(false);
				break;
			case "error": if(callback) callback(false, resultJson.message); break;
			case "logout": break;
		}
	});
}

/******************************************************************************
******************** remove below once IE10 is lowest supported browser *******
*******************************************************************************/
function processMapData(maps, exhibitors, callback){
	for(var i = 0; i < maps.length; i++){
		var map = maps[i];
		// if map is a booth map, iterate over exhibitors & booths
		if(map.type == "boothmap" && exhibitors){
			for(var j = 0; j < exhibitors.length; j++){
				var exhibitor = exhibitors[j];
				// if exhibitor has booths, iterate over booths & map items and find matches
				if(exhibitor.booths && exhibitor.booths.length){
					for(var k = 0; k < exhibitor.booths.length; k++){
						var booth = exhibitor.booths[k];
						for(var l = 0; l < map.items.length; l++){
							var item = map.items[l];
							// if the item matches the exhibitor booth, add exhibitor data to the item.
							if(item.ID == booth.ID){
								item.exhibitorId = exhibitor.id;
								item.company = exhibitor.name;
								if(exhibitor.exhibitorType.length){
									item.typeValue = exhibitor.exhibitorType[0].displayValue;
								}
							}
						}
					}
				}
			}
		}
	}

	if(storage){
		setDataAsset("connectMaps", maps);
		setDataAsset("connectMapsUpdated", new Date().getTime());
	}
}
/******************************************************************************
******************** remove above once IE10 is lowest supported browser *******
*******************************************************************************/

function setupNavMapList(json){
	var mapListHtml = '';
	for(var i = 0; i < json.length; i++){
		var map = json[i];
		if(map.publishConnect){
			mapListHtml += '<li data-id="' + map.mapfileId + '"><a href="#">' + map.name + '</a></li>';
		}
	}
	if(mapListHtml != ""){
		$("#navMapsLink ul").html(mapListHtml);
		$("#navMapsLink").show();
	}
	$("#navMapsLink li").click(function(){
		var mapId = $(this).data("id");
		loadMapView(mapId);
	});
}

function loadMapView(mapId, itemId){
	var $mapPopup = ($("#mapPopup").length) ? $("#mapPopup") : $('<div id="mapPopup"></div>');
	$mapPopup.html("").dialog({
		modal: true,
		width: $(window).width() - 10,
		height: $(window).height() - 10,
		open: function(){
			var url = baseHref + "/mapView.do?id=" + mapId;
			if(itemId){ url += "&item=" + itemId }
			$(this).load(url);
		}
	});
}

function zoomMapIn(){
	if(zoomCt < 10){
		zoomCt++;
		paperWidth += paperWidth * zoom;
		paperHeight += paperHeight * zoom;
		paper.setSize(paperWidth, paperHeight);
		paper.setViewBox(0, 0, opWidth, opHeight);
		if($("#mapTooltip").data("itemId")) mapItemMouseOver($("#mapTooltip").data("itemId"));
	}
}

function zoomMapOut(){
	if(zoomCt > -10){
		zoomCt--;
		paperWidth -= paperWidth * zoom;
		paperHeight -= paperHeight * zoom;
		paper.setSize(paperWidth, paperHeight);
		paper.setViewBox(0, 0, opWidth, opHeight);
		if($("#mapTooltip").data("itemId")) mapItemMouseOver($("#mapTooltip").data("itemId"));
	}
}

function printMap(){
	if($("body.simple").length){
		// resize window so map fits inside window
		while(paperWidth > $(window).width() || paperHeight > $(window).height()){
			zoomMapOut();
		}
	}
	else{
		$('body').addClass('printMap');
	}
	
	confirmDialog($("#printInstruct").html(), function(){
		// so IE will print the frame & not the entire window
		if($.browser.msie){
			try{document.execCommand('print', false, null);}
			catch(e){window.print();}
		}
		else{
			window.print();
		}
	});
}