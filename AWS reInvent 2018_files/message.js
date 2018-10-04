function initMessageTabs(){
	$("#messageTabs").tabs({
		load: function(event, ui){
			initMessageList(ui.panel);
		}
	});
	initMessageList($("#inboxList"));
}

function initMessageList(panel){
	if(editMessageURI != null && viewMessageURI != null){
		$(panel).find('table.messageList tr').not('.headerRow')
			.on("mouseover", function(){ $(this).addClass('hover');})
			.on("mouseout", function(){ $(this).removeClass('hover');})
			.on("click", function(){
				var messageId = this.id.split("_")[1];
				var messageTab = getCurrentTab();
				if($(this).hasClass("unread")){
					$(this).removeClass("unread");
					changeNotification('messages', -1, notify);
					var count = parseInt($("#unreadCount").text()) || 0;
					if(count > 0){
						count--;
						$("#unreadCount").html(count);
						checkUnreadCount();
					}
				}
				viewMessage(messageId, viewMessageURI, editMessageURI, messageTab);
			})
			.find('a.delete')
				.click(function(){
					var messageId = $(this).closest("tr").attr("id").split("_")[1];
					var messageRow = $(this).closest("tr");
					deleteMessage(messageId, function(result){
						deleteMessageCallback(result, messageRow);
					});
					return false;
				});
	}
	else{
		alert("Global URI's are not defined.");
	}
}

function getCurrentTab(){
	var msgTab =  $("#messageTabs").find("li.ui-tabs-active a").attr("id");
	if (msgTab)
		return msgTab.split("-")[0];
}

var editMessageDialog = null;
function editMessage(url){
	if(editMessageDialog == null){
		editMessageDialog = $('<div id="editMessageDialog"></div>').html('<iframe src="blank.html" style="width:100%;height:98%" frameborder="0"></iframe>').dialog({
			modal:true,
			width:600,
			height:500,
			buttons: {
				"Cancel": function(){ $(this).dialog('close'); },
				"Send": function(){
					var iframeDoc = $(this).find('iframe').get(0).contentWindow.document;
					submitMessage($(iframeDoc).find('form#messageForm'), $(this));
				}
			},
			close: function(){
				$(this).find('iframe').attr('src','about:blank');
			}
		});
	}
	editMessageDialog.find('iframe').attr('src',url);
	editMessageDialog.dialog('open');
}
var viewMessageDialog = null;
function viewMessage(messageId, url, editUri, messageType){
	url = url + "?messageID=" + messageId;
	if(viewMessageDialog == null){
		viewMessageDialog = $('<div id="viewMessageDialog"></div>').html('<iframe src="blank.html" style="width:100%;height:98%" frameborder="0"></iframe>').dialog({
			modal:true,
			width:600,
			height:500,
			close: function(){
				$(this).find('iframe').attr('src','about:blank');
			}
		});
	}
	
	var buttons = {};
	if(messageType == "inbox"){
		buttons["Move to Archive"] = function(){
				var $dialog = $(this);
				deleteMessage(messageId, function(result){
					var messageRow = $("#message_"+messageId);
					deleteMessageCallback(result, messageRow, function(){
						$dialog.dialog('close');
					});
				});
			};
	}
	if(messageType == "inbox" || messageType == "archive"){
		buttons["Reply"] = function(){
				$(this).dialog('close');
				var editUrl = editUri + "?reply=true&messageID=" + messageId;
				editMessage(editUrl);
			};
	}
	buttons["Close"] = function(){ $(this).dialog('close'); };
	
	viewMessageDialog.dialog('option', 'buttons', buttons);
	viewMessageDialog.find('iframe').attr('src',url);
	viewMessageDialog.dialog('open');
}
function submitMessage($form, $dialog){
	if(validateMessage($form)){
		$.ajax({
			type: 'POST',
			url: $form.attr("action"),
			data: $form.serialize(),
			dataType: 'html', //response data type
			success: function(){
				$dialog.dialog('close');
			},
			error: function(){
				messageDialog($('#errorSendingMessage').html());
			}
		});
	}
}

function validateMessage($form){
	var recipients = $form.find('input[name=recipients]').toArray();
	for(var i in recipients){ 
		if(isNaN(recipients[i].value)){
			var message = $('#invalidRecipient').html();
			messageDialog(message);
			return false;
		}
	}
	if(recipients.length == 1){
		messageDialog($('#recipientRequired').html());
		return false;
	}
	if($form.find('#subject').val().length == 0){
		messageDialog($('#subjectRequired').html());
		return false;
	}
	if($form.find('textarea#text').val().length == 0){
		messageDialog($('#messageRequired').html());
		return false;
	}
	return true;
}

function deleteMessageCallback(result, messageRow, callback){
	if(checkAjaxResult(result)){
		$(messageRow).remove();
		if(callback) callback();
	}
}

var $recipients = null;
function initMessageDialog(options){
	$('form#messageForm').submit(validateMessage);
	$recipients = $('#recipients').listBuilder({
		maxItems: options.maxRecipients,
		showRemoveIcon: true,
		onMaxReached: function(item){
			var maxRecipientsReached = $('#maxRecipientsReached').html();
			messageDialog(maxRecipientsReached.replace("{0}", item.label));
		},
		beforeAddItem: function(item, response){
			var match = $('.listBuilder input[name="recipients"]:hidden').filter(function(){
				return this.value == item.value;
			});
			if(match.length == 0){
				response(true);
			}
			else{
				var errorTitle = $('#systemMessageText').html();
				var duplicateFound = $('#duplicateRecipientFound').html();
				meetingErrorDialog(errorTitle, duplicateFound, function(){
					response(false);
				});
			}
		},
		onRemoveItem: function(toRemove, response){
			if(toRemove && toRemove.label === toRemove.value){ //if it is not a real recipient
				response(true);
			}
			else{
				var confirmRemove = $('#confirmRemoveRecipient').html();
				confirmDialog(confirmRemove.replace("{0}", toRemove.label), function(result){
					if(result == true){
						response(result);
					}
				});
			}
		},
		onlyAddFromSource: true,
		autocompleteOptions: {
			minLength: 2,
			autoFocus: true,
			focus: function (event, ui) {
				event.preventDefault();
			},
			source: function(request, callback){
				searchUser(request.term, function(result){ //searchUser is a function on editMeeting.jsp
					callback(parseResponse(result));
				});
			}
		}
	});
	if(options.recipient){
		$('#recipients').trigger("listbuilderadd", options.recipient);
	}
}

function parseResponse(response){
	if(response.toLowerCase() == "logout"){
		var doLoginRedirect = function(){ top.location.href = top.contextPath + 'logout.ww'; };
		meetingErrorDialog($('#sessionExpired').html(), $('#browserSessionExpired').html(), doLoginRedirect);
		return false;
	}
	else if(response.toLowerCase() == "error"){
		return false;
	}
	return $.parseJSON(response);
}

function confirmDialog(message, callback){
	top.$('<div title="Confirm"></div>').html(message).dialog({
		modal:false,
		buttons: {
			"Yes": function(){
				callback(true);
				top.$(this).dialog('close').remove();
			},
			"No": function(){
				callback(false);
				top.$(this).dialog('close').remove();
			}
		}
	});
}
function meetingErrorDialog(title, msg, callback){
	top.$('<div title="'+title+'">'+msg+'</div>').dialog({
		modal: true,
		buttons: {
			"Ok": function(){
				if(typeof callback == "function") callback();
				top.$(this).dialog('close');
			}
		},
		close: function(){ top.$(this).remove(); }
	});
	return false;
}