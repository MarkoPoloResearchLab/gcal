//This needs to be on the page using the validation for some reason
//$(function(){
//	validateForm($('form'));
//});

function validateForm($form){
	/***** Default Validation *****/
	$('.formReq input, .formReq select, .formReq textarea').addClass('required');
	$('.ignore input').addClass('ignore');
	
	// attach validation to form
	$form.validate({
		focusInvalid: false,
		errorClass: "errorLabel",
		ignore: ':hidden, .ignore',
		rules: {
			password2:{
				equalTo: '#password'
			}
		},
		highlight: function(element, errorClass){
			$(element).closest('.formReq').addClass('error').removeClass('success');
		},
		success: function(label){
			label.closest('.formReq').removeClass('error').addClass('success');
		},
		invalidHandler: function(form, validator){
			var html = '<div class="errorPopup" title="Errors"><ul>';
			for(var i in validator.errorList){
				var element = validator.errorList[i].element;
				var message = validator.errorList[i].message;
				html += '<li>' + $(element).closest('.formRow').find('label:first').html() + ' &ndash; ';
				html += '<span class="errorMessage">' + message + '</span></li>';
			}
			html += '</ul></div>';
			
			$(html).dialog({
				modal: true,
				width: 600,
				buttons: {
					"OK": function(){
						$(this).dialog('close');
					}
				},
				open: function(){
					$('.ui-widget-overlay').hide();
					$('.ui-widget-overlay:last').show();
				},
				close: function(){
					$('.ui-widget-overlay').hide();
					$('.ui-widget-overlay:last').show();
				}
			});
		}
	});
	
	/*** validate form elements on page load if they've been filled out ***/
	$form.find('input[type=text]:not(:hidden):filled, textarea:filled, select:not(:hidden):filled').each(function(){
		$form.validate().element($(this));
	});
	$form.find('input[type=radio], input[type=checkbox]').each(function(){
		try{
			if($(this).closest('.formReq').find('input:checked').length)
				$form.validate().element($(this));
		}
		catch(e){}
	});
	
	/*** onclick & onchange immediate validation ***/
	// force check boxes to validate on click
	$form.find('.formReq input[type=checkbox], .formReq input[type=radio]').click(function(){
		$form.validate().element($(this));
	});			
	
	// force select boxes to validate on change
	$('.formReq select').change(function(){
		$('form').validate().element($(this));
	});
}

/*** state validation ***/
function setupStateValidation($state, $country, isStateRequired){
	$country.change(function(){
		if(isStateRequired && ($country.val() == 'US' || $country.val() == 'CA')){
			$state.change(validateState);
			$state.closest('.formRow').addClass('formReq');
			$state.rules('add', {
				required: true
			});
		}
		else{
			$state.unbind('change', validateState);
			$state.removeClass('valid').closest('.formRow').removeClass('formReq').removeClass('success').removeClass('error');
			$state.rules('add', {
				required: false
			});
		}
	});
}

function validateState(){
	var $state = $(this);
	$state.closest('form').validate().element($state);
}

/*** split phone number validation ***/
function setupSplitPhoneValidation(){
	// split phone validation method
	$.validator.addMethod('splitPhone', function(value, element){
		var $container = $(element).closest('.formRow');
		return ($container.find('.countryCode').val() !== '' && $container.find('.areaCode').val() !== '' && $('.phoneNumber').val() !== '');
	});
	
	$('.countryCode').each(function(){
		$formRow = $(this).closest('.formRow');
		
		if($formRow.hasClass('formReq')){
			$('.countryCode').rules('add', {
				splitPhone: true
			});
			$('.areaCode').rules('add', {
				splitPhone: true
			});
			$('.phoneNumber').rules('add', {
				splitPhone: true
			});
		}
	});
}

function getLoginValidationRules(){
	ConnectAjax.getUsernamePasswordValidationRules(function(result){
		var loginRules = $.parseJSON(result).data;
		switch(loginRules.status){
			case 'success':
				// username validation
				$.validator.addMethod('username', function(value, element){
					var alphaNumRegex = /^\w+$/i;
					if(loginRules.usernameAlphaNumeric){
						return (alphaNumRegex.test(value) && value.length >= loginRules.minUsernameLength);
					}
					else{
						return (value.length >= loginRules.minUsernameLength);
					}
				}, function(){
					return $('#userName').closest('.formRow').find('.formInstruct').html();
				});
				if ($('#userName').length){
					$('#userName').rules('add', {
						username: true
					});
				}
				
				// password validation
				$.validator.addMethod('password', function(value, element){
					var regexArray = [];
					regexArray['number'] = /\d/;
					regexArray['letter'] = /[a-zA-Z]/;
					regexArray['special'] = /[!@#\$%\^&\*\(\)_\+\[\]\{\}:;',.\/<>\?~]/;
					regexArray['uppercase'] = /[A-Z]/;
					regexArray['lowercase'] = /[a-z]/;
					var conditionsMet = 0;
					$.each(loginRules.passwordCriteria, function(){
						if(regexArray[this].test(value))
							conditionsMet++;
					});
					return (conditionsMet >= loginRules.passwordCriteriaRequired && value.length >= loginRules.minPasswordLength);
				}, function(){
					return $('#password').closest('.formRow').find('.formInstruct').html();
				});
				if ($('#password').length){
					$('#password').rules('add', {
						password: true
					});
				}
				break;
			case "error":
				break;
		}
	});
}

function getLinkedInRules(){
	$.validator.addMethod('linkedin', function(value, element){
			return $('.linkedIn').val().indexOf('www.linkedin.com') !== -1;
	}, 'The LinkedIn URL must include www.linkedin.com');
	if($('.linkedIn').length){
		$('.linkedIn').rules('add', {
			linkedin: true
		});
	}
}

/*** Text Counter and Validation ***/
function getCounterRules(){
	$.validator.addMethod('textcounter', function(value, element, params){
		var maxLength = params[1];
		var type = params[2];
		return (getTextCount(value, type) <= maxLength);
	}, '{0}');

	$('.textcounter').each(function(){
		var max = $(this).data('maxlength');
		var type = $(this).data('maxtype');
		var showCount = $(this).hasClass('showCount');
		var message = $('#'+type+'CountdownError').html();
		message = message.replace('{0}', max);
		$(this).rules('add', {
			textcounter: [message, max, type, showCount]
		});

		if(showCount) initCounter(this, max, type);
	});
}
function initCounter(element, max, type){
	var $row = $(element).closest('.formRow');
	var $inst = $row.find('.formInstruct');
	if($inst.length === 0){
		$inst = $('<div class="formInstruct"></div>').appendTo($row);
	}
	var $count = $('<span class="count"></span>').appendTo($inst);
	var remainingHTML = '<span class="countRemaining"></span>';
	var prompt = $('#'+type+'CountdownPrompt').html();
	prompt = prompt.replace('{0}', remainingHTML).replace('{1}', max);
	$count.html(prompt);
	$(element)
		.bind('keyup.showCount', {"row":$row, "countEl":$count, "max":max, "type":type}, function(ev){
			var count = getTextCount(this.value, ev.data.type);
			updateRemaining(ev.data.row, count, ev.data.max);
		})
		.triggerHandler('keyup.showCount');
}
function getTextCount(value, type){
	var count = value.length;
	if(type === "words" && count > 0){
		var wordRegEx = /[\s]+/;
		count = value.split(wordRegEx).length;
	}
	return count;
}
function updateRemaining($row, count, max){
	var $remaining = $row.find('.countRemaining');
	$remaining.html(max-count).toggleClass('overLimit', (max-count < 0));
}
