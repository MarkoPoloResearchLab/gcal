var acctAlerts = 0;
var msgAlerts = 0;
var srvyAlerts = 0;
var editAcctPos = null;
var messagePos = null;
var surveyPos = null;
var navAccountTimeout = null;

$(function(){
	
	$('#historyLink').mouseover(showHistoryMenu);
	$('#navAccount')
		.mouseenter(function(){
			clearTimeout(navAccountTimeout);
			$(this).addClass("navAccountActive");
			addMenuNotifications();
		})
		.mouseleave(function(){
			var $navAccount = $(this);
			clearTimeout(navAccountTimeout);
			navAccountTimeout = setTimeout(function(){
				$navAccount.removeClass("navAccountActive");
			}, 350);
		});
	
	if($('#navAccount').length){
		notify();
		initMenu($('#navAccountMenu'));
	}
	
	setupMenu();
});

function initMenu($menu){
	$menu.addClass('ui-widget ui-widget-content ui-corner-bottom')
		.find('li.navItem').addClass('ui-corner-all').hover(
			function(){ $(this).addClass('ui-state-hover') },
			function(){ $(this).removeClass('ui-state-hover') } 
		);
}

function setupMenu(){
	getHistory(function(){
		if($('#historyMenu').find('.navItem').length > 0){
			$('#historyLink').css('display','block');
		}
	});
}


function showHistoryMenu(){
	$('.scroll-pane').jScrollPane();

	var historyPosition = $('#historyLink').position();
	var navWidth = $('#navAccountMenu').width();

	$('#historyMenu').css({
		right: navWidth - 5,
		top: historyPosition.top
	});
}

function getHistory(callback){
	if(typeof getRecentItems != "function") return;
	
	getRecentItems(function(result){
		try{
			var data = $.parseJSON(result).data;
			var historyRow = '';

			$('#historyMenu').remove();
			$('#historyLink').append('<ul id="historyMenu" class="scroll-pane"></ul>');

			for(var x in data){
				historyRow += getHistoryRow(data[x]);
			}
			$('#historyMenu').html(historyRow);
			initMenu($('#historyMenu'));

			if(callback){
				callback();
			}
		}
		catch(e){}
	});
}

function getHistoryRow(obj){
	var url = getItemUrl(obj);
	return '<li class="navItem"><a href="'+ url +'"><span class="historyIcon '+ obj.dataType +'"></span><span id="historyTitle" class="historyTitle">'+ truncateStr(obj.dataInfo, {removeHtml:true, trimToWord:false}) +'</span></a></li>';
}

function getItemUrl(obj){
	var type = obj.dataType;
	switch(type){
		case 'exhibitor':
			return 'exhibitorDetail.ww?EXHIBITOR_ID=' + obj.id;
			break;
		case 'person':
			return 'attendeeDetail.ww?PERSON_ID=' + obj.id;
			break;
		case 'session':
			return 'sessionDetail.ww?SESSION_ID=' + obj.id;
			break;
	}
}

function notify(){
	getNotifications(function(result){
		try{
			var data = $.parseJSON(result).data;
			var totalAlerts = 0;
		
			for(x in data){
				if(data[x].name != "surveys") totalAlerts += data[x].numAlerts; // remove if once surveys are implemented in topNav.jsp
				if(data[x].name == 'incompleteReg')
					acctAlerts = data[x].numAlerts;
				if(data[x].name == 'messages')
					msgAlerts = data[x].numAlerts;
				if(data[x].name == 'surveys')
					srvyAlerts = data[x].numAlerts;
			}
			
			if(totalAlerts > 0)
				$('#notify').html(totalAlerts).css('display', 'inline-block');
			else
				$('#notify').hide();
		
			$('#editAccountLink').find('.notify').html(acctAlerts);		
			$('#messagesLink').find('.notify').html(msgAlerts);			
			$('#surveysLink').find('.notify').html(srvyAlerts);
			
		}
		catch(e){}
	});
}

function addMenuNotifications(){
	editAcctPos = $('#editAccountLink').position();
	messagePos = $('#messagesLink').position();
	surveyPos = $('#surveysLink').position();
	
	if(acctAlerts > 0){
		$('#editAccountLink').find('.notify').css({
			top: editAcctPos.top,
			left: editAcctPos.left
		}).show();
	}
	else $('#editAccountLink').find('.notify').hide();
	
	if(msgAlerts > 0){
		$('#messagesLink').find('.notify').css({
			top: messagePos.top,
			left: messagePos.left
		}).show();
	}
	else $('#messageLink').find('.notify').hide();
	
	if(srvyAlerts > 0){
		if (surveyPos != null && surveyPos != undefined){
			$('#surveysLink').find('.notify').css({
				top: surveyPos.top,
				left: surveyPos.left
			}).show();
		}
	}
	else $('#surveysLink').find('.notify').hide();
}