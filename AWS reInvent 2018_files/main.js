var updateMapsTimeout = null;
var updateMapsInterval = 1000 * 60 * 15; // update map data every 15 mins.
var storage = (function() { // check if localStorage is available & assign it to storage variable.
	var uid = new Date, result;
	try {
		localStorage.setItem(uid, uid);
		result = localStorage.getItem(uid) == uid;
		localStorage.removeItem(uid);
		return result && localStorage;
	} catch(e) {}
}());

$(function(){
	var $globalSearch = $('#globalSearch .phraseDiv');
	if($globalSearch.length && typeof $.fn.keywordSearch == "function"){
		$globalSearch.keywordSearch({
			placeholder: $('#globalSearchVal').text()
		}).css('visibility', 'visible');
	}
	
	$('#templateContent').on('click', '#tac', reviewTAC);
	
	$('.formButton, .formButtonRow input, .formButtonRow a').button();
	$('.openLoginDialog').click(function(){
		loginDialog();
		return false;
	});
	checkUnreadCount();
	acceptTermsDialogInit();
	if(!$("#mapBody").length && typeof getMapData !== "undefined") getMapData(setupNavMapList);
	$("#mainNav ul").menu();
});

function isIE(){
	if (navigator.appName === 'Microsoft Internet Explorer'){
		var regEx = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
		if(regEx.exec(navigator.userAgent) != null){
			return {
				isIE: true,
				version: parseFloat(RegExp.$1)
			};
		}
	}
	return false;
}

function setDataAsset(key, data){
	if(typeof data != "string"){
		data = JSON.stringify(data);
	}
	storage.setItem(key, data);
}

function getDataAsset(key){
	var result = storage.getItem(key);
	if(result == null || result == "undefined"){
		return null;
	}
	else{
		// see if result is an object, if not pass back string
		try { result = JSON.parse(result); }catch(e){}
		return result;
	}
}

function removeDataAsset(key){
	storage.removeItem(key);
}

function messageDialog(str, callback){
	var buttonArray = new Object();
	buttonArray[$('#closeButtonText').html()] = function(){
		top.$(this).dialog('close');
		if(callback) callback();
	}

	top.$('<div title="' + $('#systemMessageText').html() + '" class="messageDialog">' + str + '</div>').dialog({
		modal:true,
		buttons: buttonArray,
		open: updateOverlay,
		close: updateOverlay
	});
}

function confirmDialog(str, callback){
	var buttonArray = new Object();
	buttonArray[$('#cancelButtonText').html()] = function(){
		top.$(this).dialog('close');
	}
	buttonArray[$('#okButtonText').html()] = function(){
		top.$(this).dialog('close');
		if(typeof callback != 'undefined') callback();
	}

	top.$('<div title="' + $('#confirmPromptTitle').html() + '" class="confirmDialog">' + str + '</div>').dialog({
		modal: true,
		buttons: buttonArray,
		open: updateOverlay,
		close: updateOverlay
	});
}

function updateOverlay(){
	jQuery('.ui-widget-overlay').css('display', 'none');
	jQuery('.ui-widget-overlay:last').css('display', '');
}

function checkUnreadCount(){
	var toShow = ($("#unreadCount").text() != "0");
	$("#unreadCount").toggle(toShow);
}

var userInSesssion = false;
function checkLogin(){
	if(userInSession === false){
	//UI todo: decide if user is logged in
	//loginDialog(doDynamicLogin);
	}
	return userInSesssion;
}
function loginDialog(callback){
	var width = 400;
	if(createAccountEnabled === true) width = 700;
	$('<div title="Please Login" id="loginDialog"></div>').dialog({
		modal: true,
		width: width,
		buttons: [{
			id: 'cancel-btn',
			text: "Cancel",
			click: function(){
				$(this).dialog('close');
			}
		}],
		open: function(){
			$('#loginDialog').load(baseHref+'/loginDialog.ww', function(){
				var url = window.location.href;
				$('#pageUrl').val(url);
				$(".formButton").button();
				$('#loginDialog').find('#loginUsername').focus();
				$('.fbButtonLogin').each(function(){
					if(!$(this).data('hasClick'))
						$(this).click(function (){fbConnectLogin();}).data('hasClick', true);
				});
				if(typeof liLoad !== 'undefined') liLoad();
			});
			$("body").addClass("noScroll");
		},
		position: "top",
		close: function(){
			$('#loginDialog').remove();
			$("body").removeClass("noScroll");
		}
	});
}
function doDynamicLogin(callback){
	//Reload the left and top nav to reflect a logged in user
	callback();
}

function toggleInterest(el, type){
	var id = $(el).closest("div.resultRow").prop("id").split("_")[1];
	toggleInterestById(el, id, type);
}
function toggleInterestById(el, id, type){
	ConnectAjax.addRemoveInterestListItem(id, type, function(result){
		toggleInterestCallback(el,result);
	});
}

function toggleInterestCallback(el, result){
	//toggle interest immediately
	$(el).toggleClass('interested');
	if($(el).hasClass('interested')) $(el).html($('#removeInterestTxt').html());
	else $(el).html($('#addInterestTxt').html());
	if(result == 'login'){
		loginDialog();
		//user not logged in, toggle interest back
		$(el).toggleClass('interested');
		if($(el).hasClass('interested')) $(el).html($('#removeInterestTxt').html());
		else $(el).html($('#addInterestTxt').html());
	}
	else{
		var ajaxResult = checkAjaxResult(result);
		if(!ajaxResult){
			//result was unsuccessful, toggle interest back
			$(el).toggleClass('interested');
			if($(el).hasClass('interested')) $(el).html($('#removeInterestTxt').html());
			else $(el).html($('#addInterestTxt').html());
		}
	}
}

function toggleExpand(){
	$(this).closest('li').toggleClass('expanded');
	
}

function sessionTooltip(){
	var tooltipOptions = {
		position:{
			my: 'left center',
			at: 'right center',
			viewport: $(window)
		},
		style:{
			classes: 'ui-tooltip-shadow',
			widget: true
		}
	}
	
	if($('.conflict').length){
		$('.conflict').qtip($.extend(true, {}, tooltipOptions, { 
			position: {
				adjust: { x: -20 }
			},
			content:{
				title:{
					text:'Conflict Found'
				},
				text: function(api){
					return $(this).siblings('.tooltip').html();
				}			
			}
		}));
	}
	if($('.sessionScheduling').length){
		$('.sessionScheduling').qtip($.extend(true, {}, tooltipOptions, { 
			position: {
				adjust: { x: -20 }
			},
			content:{
				text: function(api){
					return $(this).siblings('.tooltip').html();
				}			
			}
		}));
	}
}
function showConflictDialog(addSession, conflicts, callback){
	var removeArray = [];
	var maxAbstractLength = 150;
	var startTimeDateFormat = "DD, M d";

	var dialogTitle = $('#conflictFound').html();
	top.$('<div id="conflictDialog" title="'+ dialogTitle +'"></div>').dialog({
		modal: true,
		buttons:{
			"Yes": function(){
				top.$(this).data('confirmed', true).dialog('close');
			},
			"No": function(){
				top.$(this).dialog('close');
			}
		},
		width: 750,
		close: function(){
			callback(top.$(this).data('confirmed'));
			top.$(this).remove();
		},
		open: function(){
            top.$(this).load(baseHref+'/resolveConflict.ww', function(){
                if (conflicts == undefined) {
                    top.$('#conflictMessage').hide();
                    top.$('#removeColumn').hide();
                    top.$('#addColumn').hide();
                }
                else {
                    top.$('#roomVenueWarning').hide();
                    if(addSession.sessionID === conflicts[0].sessionID && conflicts.length === 1){
                        var message = $('#alreadyScheduled').html();
                        top.$(this).find('#conflictMessage').html(message);
                    }

                    var $addItem = $('<li></li>').html('<span class="title">' + truncateStr(addSession.title, {removeHtml:true}) + '</span>\n');
                    if(addSession.className !== "scheduled"){
                        $addItem.append(' <span class="status">(' + addSession.status + ')</span>\n');
                    }
                    try{
                        var startTime = new Date(addSession.slot.startTime.time);
                        var startStr = $.datepicker.formatDate(startTimeDateFormat, startTime);
                        startStr += ", " + addSession.slot.slotTime.timeString;
                        $addItem.append('<span class="startTime"> - ' + startStr + '</span>\n');
                    }
                    catch(e){}

                    if(addSession.abstract){
                        var abstract = truncateStr(addSession.abstract, {maxLength: maxAbstractLength, postfix:'...'});
                        $addItem.append('<span class="abstract">' + abstract + '</span>');
                    }
                    top.$('#addList').append($addItem);

                    for(var i in conflicts){
                        var $removeItem = $('<li></li>').html('<span class="title">' + truncateStr(conflicts[i].title, {removeHtml:true}) + '</span>\n');
                        if(conflicts[i].type !== "Enrolled"){
                            $removeItem.append('<span class="status">(' + conflicts[i].type + ')</span>\n');
                        }
                        try{
                            var startTime = new Date(conflicts[i].slot.startTime.time);
                            var startStr = $.datepicker.formatDate(startTimeDateFormat, startTime);
                            startStr += ", " + conflicts[i].slot.slotTime.timeString;
                            $removeItem.append('<span class="startTime"> - ' + startStr + '</span>\n');
                        }
                        catch(e){}


                        if(conflicts[i].abstract){
                            var abstract = truncateStr(conflicts[i].abstract, {maxLength: maxAbstractLength, postfix:'...'});
                            $removeItem.append('<span class="abstract">' + abstract + '</span>');
                        }
                        top.$('#removeList').append($removeItem);
                    }
                }
            });
            top.$(this).data('confirmed', false);
		}
	});
}
function truncateStr(str, opts){
	var defaults = {
		maxLength: 100,
		trimToWord: true,
		removeHtml: true,
		postfix: '',
		forcePostfix: false
	};
	opts = $.extend({}, defaults, opts);
	if(opts.removeHtml != false){
		var tmp = document.createElement("DIV");
		tmp.innerHTML = str;
		str = tmp.textContent || tmp.innerText;
	}
	if(typeof str === "string" && str.length > opts.maxLength){
		str = $.trim(str).substr(0, opts.maxLength);
		if(opts.trimToWord != false) str = str.split(" ").slice(0, -1).join(" ");
		if(opts.postfix) str += opts.postfix;
	}
	else if(opts.postfix && opts.forcePostfix == true) str += opts.postfix;
	return str;
}

function checkAjaxResult(result){
	if(typeof result != "string") result = "Invalid or no response received from server.";
	
	switch(result.toLowerCase()){
		case "success":
			return true;
		case "logout":
			top.location.href = (baseHref || "/connect") + "/logout.ww";
			break;
		default:
			messageDialog(result);
	}
	return false;
}
function getJSONResponse(response){
	try{
		var jsonResponse = $.parseJSON(response); //new ajax format
		if(typeof jsonResponse.status === "undefined") throw "This is not JSON";
		else response = jsonResponse;
	}
	catch(e){
		if(response.toLowerCase() === "success" || response.toLowerCase() === "error" || response.toLowerCase() === "logout"){
			response = { "status":response, "message":response, "data":{} };
		}
		else{
			var responseData = $.parseJSON(response);
			response = { "status":"success", "message":"", "data":responseData.data || responseData };
		}
	}

	switch(response.status.toLowerCase()){
		case "success":
		case "custom":
				return response;
		case "logout":
			top.location.href = (baseHref || "/connect") + "/logout.ww";
			break;
		case "error":
				messageDialog(response.message);
			break;
		default:
			throw "Invalid or no response received from server."
	}
	return false;
}
var ajaxTimeout = 2 * 60 * 1000; // 2 minutes
function postTimeout(url, data, success, timeout) {
	return jQuery.ajax({
		type: 'POST',
		cache: false,
		timeout: (timeout) ? timeout : ajaxTimeout,
		url: url,
		data: data,
		success: function(result){
			try{ result = JSON.parse(result); }catch(e){};
			if(success) success(result);
		}
	});
}
function startPopupWorking($dialog){
	var buttonArray = new Object();
	buttonArray[$('#workingText').html()] = function(){};
	if($dialog.hasClass('bigDialog')){
		$dialog.data('buttons', $dialog.bigDialog('option', 'buttons'));
		$dialog.bigDialog('option', 'buttons', buttonArray);
	}
	else{
		$dialog.data('buttons', $dialog.dialog('option', 'buttons'));
		$dialog.dialog('option', 'buttons', buttonArray);
	}
}

function stopPopupWorking($dialog){
	if($dialog.hasClass('bigDialog')){
		$dialog.bigDialog('option', 'buttons', $dialog.data('buttons'));
	}
	else{
		$dialog.dialog('option', 'buttons', $dialog.data('buttons'));
	}
}

function updateLead(el, exhibitorId, leadId){
	if(leadId == '0'){
		leadId = '';
	}
	ConnectAjax.updateLeadOnLoggeduser(exhibitorId, leadId, function(result){
		updateLeadCallback(el, exhibitorId, result);
	});
}

function updateLeadCallback(el, exhibitorId, result){
	var data = $.parseJSON(result).data;
	switch(data.result){
		case 'success':
			if(data.leadId == 0){
				$(el).addClass('makeLead').removeClass('leadSelected');
				$(el).html('<span class="ww-icon ww-icon-badge"></span>' + makeLeadTxt);
			}
			else{
				$(el).removeClass('makeLead').addClass('leadSelected');
				$(el).html('<span class="ww-icon ww-icon-badge"></span>' + leadSelectedTxt);
			}
			$(el).attr('onclick', 'updateLead(this, "'+ exhibitorId +'","'+ data.leadId +'");')
			break;
		case 'logout':
			loginDialog();
			break;
		case 'error':
			messageDialog('There was an error with your request, please try again later.');
			break;
	}
	
}

function agreeToTandC(response, callback){
	ConnectAjax.agreeToTermsAndConditions(response, callback)
}

function acceptTermsDialogInit(){
	$('#termsAndConditionsDialog').dialog({
		autoOpen: false,
		width: 700,
		modal: true,
		buttons:{
			'Close': function(){
				$(this).dialog('close');
			}
		}
	});
}

function reviewTAC(){
	var buttonArray = {};
	buttonArray['Cancel'] = function(){
		$(this).dialog('close');
	};
	buttonArray['Decline'] = function(){
		agreeToTandC(false, function(result){
			switch(result){
				case 'noChange':
					$('#termsAndConditionsDialog').dialog('close');
					break;
				case 'success':
					if($('#generalInfo').length){
						updateTermsItem(false);
					}
					notify();
					$('#termsAndConditionsDialog').dialog('close');
					break;
				case 'logout':
					$('#termsAndConditionsDialog').dialog('close');
					loginDialog();
					break;
			}
		});
	};
	buttonArray['Accept'] = function(){
		agreeToTandC(true, function(result){
			switch(result){
				case 'noChange':
				case 'success':
					if($('#generalInfo').length){
						updateTermsItem(true);
					} 
					else if($('#searchContainer').length){
						submitSearch();
					}
					else {
						document.location = document.location;
					}
					notify();
					$('#termsAndConditionsDialog').dialog('close');
					break;
				case 'logout':
					$('#termsAndConditionsDialog').dialog('close');
					loginDialog();
					break;
			}
		});
	};
	$('#termsAndConditionsDialog').dialog('option', 'buttons', buttonArray);
	$('#termsAndConditionsDialog').dialog('open');
}

function createWorker(file, data, callback){
	if(typeof Worker !== "undefined"){
		var worker = new Worker(file);
		worker.addEventListener("message", callback);
		worker.postMessage(data);
		return worker;
	}
	else{
		return false;
	}
}

function truncateElement(parentSelector, selector, maxLength){
	var viewMoreTxt = $('#moreLinkText').html() || "View More";
	maxLength = maxLength || 175;
	$(selector).each(function(){
		if(!$(this).hasClass('truncatedTxt')){
			var fullTxt = $(this).text();
			if(fullTxt.length > maxLength){
				var truncatedTxt = truncateStr(fullTxt, {maxLength: maxLength, postfix: '... <a href="javascript:void(0);" class="moreLink truncated">'+viewMoreTxt+'</a>'});
				$(this)
					.html(truncatedTxt)
					.addClass('truncatedTxt')
					.data('fullTxt', fullTxt);
			}
		}
	});
	if($(parentSelector).data('hasMoreClickEvent') !== 'true'){
		$(parentSelector)
			.on('click.moreLink', '.moreLink, .lessLink', function(ev){ 
				ev.stopPropagation();
				var fullTxt = $(this).closest('.truncatedTxt').data('fullTxt');
				toggleMoreLink(this, fullTxt);
			})
			.data('hasMoreClickEvent', true);
	}
}

function toggleMoreLink(element, fullTxt){
	var viewMoreTxt = $('#moreLinkText').html() || "View More";
	var viewLessTxt = $('#lessLinkText').html() || "View Less";
	var $element = $(element);
	var targetEl = $element.parent();
	if($element.hasClass('truncated')){
		$(targetEl).html(fullTxt).append(' <a href="javascript:void(0);" class="lessLink">'+viewLessTxt+'</a>');
	}
	else{
		var truncatedTxt = truncateStr(fullTxt, {maxLength: 175, postfix: '... <a href="javascript:void(0);" class="moreLink truncated">'+viewMoreTxt+'</a>'});
		$(targetEl).html(truncatedTxt);
	}

	if (typeof highlightSearchString == 'function') highlightSearchString();
}

function mapItemClick(){
	var itemId = $(this).data("id");
	var mapId = $(this).data("mapid");
	if(itemId && mapId){
		top.loadMapView(mapId, itemId);
	}
	else{
		messageDialog($("#mapItemNoClick").html());
	}
	return false;
}