;(function($) {

	$.fn.keywordSearch = function(options) {
		// default options
		var defaults = {
			placeholder: "Keyword Search",
			submitButton: "input[type=submit],button[type=submit]",
			autoSubmit: false,
			delay: 300,
			onClear: null,
			onSubmit: null
		};
		
		return this.each(function() {
			var opts = $.extend(true, {}, defaults, options);
			var $phrase, $container;
			if($(this).is('input')){
				$phrase = $(this).addClass('ks-phrase ks-blank');
				$container = $('<div class="ks-container ui-state-default ui-corner-all" />').insertBefore($phrase).append($phrase);
			}
			else{
				$container = $(this).addClass('ks-container ui-state-default ui-corner-all');
				$phrase = $container.find('input[type=text]').addClass('ks-phrase ks-blank');
			}
			var $submit = $container.find(opts.submitButton).button().addClass('ks-submit');
			opts.autoSubmit = ($submit.length === 0);
			var $clearBtn = $('<span class="ui-icon ui-icon-circle-close ks-clear"></span>').appendTo($container).click(function(){
				$phrase.trigger('ksclear');
			});
			
			$container.bind({
				"mouseenter": function(){ $(this).addClass('ui-state-hover ks-hover'); },
				"mouseleave": function(){ $(this).removeClass('ui-state-hover ks-hover'); },
				"click": function(){ $phrase.focus(); }
			});
				
			$phrase.bind({
				"ksclear": function(){
					$phrase.val('');
					$(this).trigger('keyup.kskeyup');
					if(typeof opts.onClear === "function") opts.onClear($phrase[0]);
				},
				"keyup.kskeyup": function(){
					onKeyUp(this, $clearBtn, opts);
					if(opts.autoSubmit === true){
						var self = this;
						clearTimeout($(self).data('ksTimer'));
						var timer = setTimeout(function(){ $(self).trigger('kssubmit'); }, opts.delay);
						$(self).data('ksTimer', timer);
					}
				},
				"kssubmit": function(){
					if(typeof opts.onSubmit === "function") opts.onSubmit(this);
				},
				"focus": function(){
					if($(this).data('blank') == true){
						$(this).data('blank', false).val('').removeClass('ks-blank');
					}
					$container.addClass('ks-active');
				},
				"blur": function(){
					if(praseIsBlank(this, opts)){
						$phrase.data('blank', true).addClass('ks-blank').val(opts.placeholder);
					}
					onKeyUp(this, $clearBtn, opts);
					$container.removeClass('ks-active');
				}
			});
			$phrase.blur();

			$($phrase.get(0).form).bind('submit.kssubmit', function(){
				$phrase.trigger('kssubmit');
			});
		});
		
		function onKeyUp(phraseInput, $clearBtn, opts){
			if(praseIsBlank(phraseInput, opts)) $clearBtn.hide();
			else $clearBtn.show();
		}
		
		function praseIsBlank(phraseInput, opts){
			return ($(phraseInput).val().length == 0 || $(phraseInput).val() == opts.placeholder);
		}
	};
})(jQuery);
