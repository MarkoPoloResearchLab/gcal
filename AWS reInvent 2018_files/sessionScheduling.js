$(function(){
	$('#templateContent')
		.on('click', '.imageAdd, .imageRemove, .imageAddWaiting, .imageRemoveWaiting', addRemoveSession);
});

/* Move to another file */
function getAvailableSessions(id, callback){
    var showAvail = false;
    if($('#sessionsNotFull_tr #sessionsNotFullCheckbox').is(':checked')) {
        showAvail = true;
    }
    ConnectAjax.getSchedulingJSON(id, showAvail, callback);
}

function showAvailSessions(el, sessionId){
	if($(el).data('working') == true) return false;

	$(el).data('working', true);
	var $ul = $(el).closest('div.sessionTimes').find('ul.availableSessions');
	//check to see if the ul is populated
	if($ul.html() == ''){
		$(el).addClass('expanded');
		$ul.show('blind', 50).addClass('loading');
		//get available sessions
		getAvailableSessions(sessionId, function(result){
			$ul.removeClass('loading');
			getAvailableSessionsCallback(sessionId, $ul, el, result);
			$(el).data('working', false);
		});
	}
	else{
		//hide the ul and clear it
		$(el).removeClass('expanded').data('working', false);
		$ul.hide('blind', function(){
			$ul.html('');
		});
	}
}

function getScheduleHtml(sessionId, obj){
	var str = "";
	var status = (obj.message.toLowerCase().indexOf('conflict') > -1) ? 'conflict' : 'sessionScheduling'; //ui todo: do something better than a string match to set status
	var isSchedulable = (obj.action && obj.action.length > 0 && obj.action !== 'login');
	var notRegistered = (obj.imageStyle === 'imageAddDisabled' && obj.isRegistered === 'false');
	str += '<div class="tooltip">'+ obj.message +'</div>';
	if(isSchedulable) str += '<a href="javascript:void(0);" data-action="'+ obj.action +'" data-timeid="'+ obj.sessionTimeID +'" data-sessionid="'+ sessionId +'" class="'+ obj.imageStyle + ' ' + status + '">';
	if(isSchedulable) str += '<span class="ww-button ww-button-schedule"></span>';
	if(notRegistered) str += '<div href="javascript:void(0);" class="' + obj.imageStyle + ' ' + status + '">';
	if(notRegistered) str += '<span class="ww-button ww-button-noschedule"></span>';
	str += obj.startTime + ' - ' + obj.endTime;
	if(notRegistered) str += '</div>';
	if(isSchedulable) str += '</a>';
	if(obj.room && obj.mapId) str += '<span class="sessionRoom"> &ndash; <a href="#" data-id="' + obj.roomId + '" data-mapid="' + obj.mapId + '" class="mapItem">' + obj.room + '</a></span>';
	else if(obj.room) str += '<span class="sessionRoom"> &ndash; ' + obj.room + '</span>';
	str += '</li>';
	return str;
}

function getAvailableSessionsCallback(sessionId, $ul, target, result){
	var data = $.parseJSON(result).data;
	// if there are sessions available populate and show the ul
	if(data.length){
		var li = '';
		if($ul.children().length == 1 && $ul.children().length != data.length){
			var timeId = $(target).data('timeid');
			for(var i in data){
				if (isNaN(i) == 0){
					if(timeId === data[i].sessionTimeID){
						li = getScheduleHtml(sessionId, data[i]);
						break;
					}
				}
			}
		}
		else{
			for(var i in data){
				if (isNaN(i) == 0) {
					li += getScheduleHtml(sessionId, data[i]);
				}
			}
		}
		$ul.html(li);

		sessionTooltip();
	}
	else if(data.length == 0){
		var li = '<li><em>' + $('#noAvailSess').html() + '</em></li>';
		$ul.append(li);
	} 
	//there was an error
	else{
		messageDialog($('#generalErrorText').html());
	}
}

function addRemoveSession(){
	var sessionId, timeId, $el = $(this);
	if($el.data('working') == true) return false;

	//disable siblings
	var $ul = $el.closest('ul.availableSessions');
	$ul.addClass('working')
		.find('a').data('working', true);

	//change clicked to loading
	$el.addClass('loading');

	sessionId = $el.data('sessionid');
	timeId = $el.data('timeid');
	if(!timeId){
		messageDialog('Error: Could not get time id.');
		return false;
	}
	
	var action = $el.data('action');
	var removeArray = [];
	var removeSessions = [];
	switch(action){
		case 'add':
			var add = timeId;
			var addToWaitingList = false;
			break;
		case 'addWaiting':
			var add = timeId;
			var addToWaitingList = true;
			break;
		case 'remove':
			var add = '';
			removeArray.push(timeId);
			removeSessions.push({sessionID:sessionId, sessionTimeID:timeId})
			var addToWaitingList = false;
			break;
		case 'removeWaiting':
			var add = '';
			removeArray.push(timeId);
			removeSessions.push({sessionID:sessionId, sessionTimeID:timeId})
			var addToWaitingList = true;
			break;
			
	}
	addSessionToSchedule(add, removeArray, addToWaitingList, true, function(result){
		addRemoveCallback($el, sessionId, add, removeSessions, result);
	});
}

function addRemoveCallback($el, sessionId, add, removeSessions, result){
	if(result.length){
		if(result == "logout" && checkAjaxResult(result)) return;
		
		if($.isArray(removeSessions)){
			for(var i in removeSessions){
				var $rem_row = $('#session_'+removeSessions[i].sessionID);
				var $rem_el = $rem_row.find('.sessionScheduling').eq(0);
				var type = (removeSessions[i].type === "Waiting List")? "removeWaiting" : "remove";
				updateStatuses($rem_el, $rem_row, type, removeSessions[i].sessionID);
			}
		}

		var $ul = $el.closest('ul.availableSessions');
		var action = $el.data('action');
		var sessionData = $.parseJSON(result);
		if(sessionData.message == 'success'){
			var $row = $el.closest('div.resultRow');
			updateStatuses($el, $row, action, sessionId);
		}
		else if(sessionData.data || sessionData.addSession){
			var addSession = sessionData.addSession;
			var sessionItem = sessionData.data;
			resolveConflict($el, sessionId, add, addSession, sessionItem);
		}
		else if(sessionData.error){
			$ul.removeClass('working')
				.find('a').data('working', false).removeClass('loading');
			messageDialog(sessionData.error);
		}
	}
	else{
		messageDialog($('#generalErrorText').html()); 
	}
}

function updateStatuses($el, $row, action, sessionId){
	updateStatus($el, $row, action, sessionId);

	if(sessionId && $('body.popup').length > 0){
		var $row_top = top.$('#session_'+sessionId);
		var $el_top = $row_top.find('.sessionScheduling').eq(0);
		if($row_top && $row_top.length > 0) top.updateStatus($el_top, $row_top, action, sessionId);
	}
}

function updateStatus($el, $row, action, sessionId){
	if($row){
		switch(action){
			case 'add':
				var text = $('#scheduledText').html();
				$row.addClass('scheduled').find('.scheduleStatus').html(text);
				break;
			case 'remove':
				$row.removeClass('scheduled').find('.scheduleStatus').html('');
				break;
			case 'addWaiting':
				var text = $('#waitListText').html();
				$row.addClass('waitList');
				$row.find('.scheduleStatus').html(text);
				break;
			case 'removeWaiting':
				$row.removeClass('waitList');
				$row.find('.scheduleStatus').html('');
				break;
		}
	}
	
	refreshAvailableSessions($el, sessionId);
}

function resolveConflict($el, sessionId, addId, addSession, conflicts){
	var removeArray = [];
	for(var i in conflicts){
		removeArray.push(conflicts[i].sessionTimeID);
	}
	
	showConflictDialog(addSession, conflicts, function(result){
		if(result == true){
			var isWaitlist = ($el.hasClass('imageAddWaiting') || $el.hasClass('imageRemoveWaiting'));
			addSessionToSchedule(addId, removeArray, isWaitlist, false, function(result){
				addRemoveCallback($el, sessionId, addId, conflicts, result);
			});
		}
		else{
			refreshAvailableSessions($el, sessionId);
		}
	});
}

function refreshAvailableSessions($el, sessionId){
	if($el){
		var $ul = $el.closest('ul.availableSessions');
		if(sessionId && $ul.length > 0){
			if(!$ul.hasClass('working')) $ul.addClass('loading');
			getAvailableSessions(sessionId, function(result){
				getAvailableSessionsCallback(sessionId, $ul, $el, result);
				$ul.removeClass('loading').removeClass('working');
			});
		}
	}
}

/* Move to another file */
function addSessionToSchedule(add, removeArray, addToWaitingList, checkVenueDistance, callback){
	ConnectAjax.addSessionToSchedule(add, removeArray, addToWaitingList, checkVenueDistance, callback);
}