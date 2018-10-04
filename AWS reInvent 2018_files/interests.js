$(function(){
	$('#interestsTabs').tabs();
	setupPageEvents();
	downloadDocDialogInit();
	$('.actionColumn').on('click', '.download', downloadDocs);
	truncateElement('#interestsTabs', '#interestsTabs .abstract, #interestsTabs .description');
	ratingInit();
});

function setupPageEvents(){
	$('.detailColumn .openInPopup').click(showDetail);
	$('.sessionTimes a').click(availableSessions);
	$('.interest').click(toggleMyInterest);
	$('.sendMessage').click(sendMessage);
}

function showDetail(){
	var url = this.href + '&tclass=popup';
	$('<div class="detailDialog"><iframe src="' + url + '" width="100%" height="99%" frameborder="0"></iframe></div>').bigDialog({
		modal: true
	});
	return false;
}

function availableSessions(){
	var id = $(this).closest(".resultRow").attr("id").split("_")[1];
	showAvailSessions(this, id);
}

function toggleMyInterest(){
	var $el = $(this)
	var $row = $el.closest(".resultRow");
	var id = $row.attr("id").split("_")[1];
	var tab = $row.closest(".ui-tabs-panel").attr("id");
	
	switch(tab){
		case "peopleTab":
			type = "myContacts";
			break;
		case "sessionsTab":
			type = "sessionInterests";
			break;
		case "exhibitorsTab":
			type = "myExhibitors";
			break;
		case "speakersTab":
			type = "myContacts";
			break;
		case "filesTab":
			type = "fileInterests";
			var ses = $row.attr("id").split("_")[2];
			if (ses == 'session')
				type = "sesFileInterests";
			break;
	}
	
	ConnectAjax.addRemoveInterestListItem(id, type, function(result){
		switch(result){
			case "success":
				if($('.interestsTabs').length){
					$row.hide("blind", function(){
						$row.remove();
					});
					var $tabCount = $("#interestsTabs ul:first li a[href=#" + tab + "] span");
					var ct = parseInt($tabCount.html());
					$tabCount.html(--ct);
				}
				else{
					$el.toggleClass('interested');
				}
				break;
			case "logout":
				loginDialog();
				break;
		}
	});
}

function sendMessage(){
	editMessage($(this).data('url'));
}

function downloadDocDialogInit(){
	$('#downloadDocsDialog').dialog({
		modal: true,
		autoOpen: false,
		width: 600,
		buttons: {
			"Close": function(){
				$(this).dialog('close');
			}
		}
	});
}

function downloadDoc(){
	var url = $(this).attr('id');
	window.open(url);
}

function downloadDocs(){
	var id = $(this).closest('.resultRow').attr('id').split('_')[1];
	downloadDocsAjax(id, function(result){
		switch(result){
			case null:
				var htmlRow = '<div class="listScroll">';
				htmlRow += getDocRow();
				htmlRow += '</div>';
				$('#downloadDocsDialog').dialog('open').html(htmlRow);
				break;
			case "logout":
				loginDialog();
				break;
			case 'error':
				messageDialog('There was an error with your request, please try again later.');
				break;
			default:
				var data = $.parseJSON(result).data;
				var htmlRow = '<div class="listScroll">';
				for(x in data){
					htmlRow += getDocRow(data[x]);
				}
				htmlRow += '</div>';
				$('#downloadDocsDialog').dialog('open').html(htmlRow);
				$('.listItem').click(downloadDoc);
				break;
		}
		
	});
	return false;
}

function getDocRow(obj){
	if(obj){
		var desc = (obj.description != null)? obj.description: '';
		var name = (obj.name != null)? obj.name: '';
		return '<div id="'+ obj.url + '" class="listItem"><b>'+ name +'</b><span class="listDescription">'+ desc +'</span></div>';
	}
	else{
		return '<div class="listItem"><b>There aren\'t any documents available for this session</b></div>';
	}
}

function ratingInit(){
	$(".avgRatingWrap").each(function(){
		$(this).find('.stars-on').width(Math.round( $(this).find(".stars-off").width() / 5 * $(this).find('.curRating').text() ));
	});
}