var canPost = true;
var microBlogCharCt = 0;

$(function(){
	// do not render microblog sidebar if on dashboard
	if(typeof dashJson == "undefined" && typeof microBlogJson != "undefined"){
		microBlogJson = JSON.parse(microBlogJson);
		generateMicroBlogSidebar();
		populateMicroBlogSidebar();
		setupMicroBlogPane();
		$(window).resize(setupMicroBlogPane);
		$('#paneTab').click(showMicroBlogPane);
		$('#pane').on('click', 'legend .ui-icon', hideMicroBlogPane);
		$(".microBlog .gotoLink").click(openNewPost);
		$(".microBlog").on("click", ".navigation a", openMicroBlogThread);
		$(".microBlog .microBlogSearch").on("keyup", "input", searchMicroBlog);
		$(".microBlog .microBlogSearch").on("click", "input", searchMicroBlog);
		$("#paneTab").button();
	}
});

function generateMicroBlogSidebar(){
	canPost = microBlogJson.data.canPost;
	microBlogCharCt = microBlogJson.data.characterCount;
	var canPostHtml = (canPost) ? "" : "noPost";
	var paneHtml = '<div id="pane" class="pane widgetScroll ' + canPostHtml + '">';
	paneHtml += '<fieldset class="microBlog">';
	paneHtml += '<legend>' + $("#microBlogTitle").html() + '<span class="ui-icon ui-icon-close"></span></legend>';
	paneHtml += '<div class="systemWidgetBody">';
	paneHtml += '<ul class="widgetScroll">';
	paneHtml += '<ul>';
	paneHtml += '</div>';
	paneHtml += '<div class="microBlogSearch"><input type="search" placeholder="' + $("#microBlogSearch").html() + '" /></div>';
	paneHtml += '<a href="#" class="gotoLink">' + $("#microBlogNewPost").html() + '</a>';
	paneHtml += '</fieldset>';
	paneHtml += '</div>';
	paneHtml += '<a href="javascript:void(0);" id="paneTab" class="widgetTemplate">' + $("#microBlogTitle").html() + '</a>';
	$("#templateContent").append(paneHtml);
	$(".microBlog .gotoLink").button();
}

function generatePostHtml(post, params){
	var authorInfo = post.submitterfullname + " - " + post.createdate;
	var originHtml = (params && params.original) ? 'class="originPost" data-qa="microBlog-originPost"' : 'data-qa="microBlog-replyPost-' + post.index + '"';
	var hideHtml = (params && params.hide) ? 'style="display: none;"' : '';
	var postHtml = '<li data-id="' + post.microblogid + '" ' + originHtml + ' ' + hideHtml + '>';
	postHtml += '<div class="content">' + post.content + '<small class="author" data-qa="microBlog-author-' + post.index + '">' + authorInfo + '</small></div>';
	if(params && params.nav != false){
		postHtml += '<div class="navigation">';
		postHtml += '<a href="#">' + $("#microBlogReplies").html().replace(/<span><\/span>/gi, "<span>" + post.replies + "</span>") + '</a>';
		postHtml += '<a href="#" class="reply"><i class="fa fa-reply"></i>' + $("#microBlogReplyText").html() + '</a>';
		postHtml += '</div>';
	}
	postHtml += '</li>';
	return postHtml;
}

function setupMicroBlogPane(){
	var templatePaneOffset = ($(window).width() - $("#pane").width()) - ($("#templateMain").offset().left + $("#templateMain").width());
	var $blog = $("#pane .microBlog");
	var blogHeight = $(window).height() - $("#templateHeader").outerHeight() - $("#templateFooter").outerHeight() - 125;
	$blog.find(".systemWidgetBody").css("height", blogHeight);
	if(templatePaneOffset <= 0){ hideMicroBlogPane(); }
	else{ showMicroBlogPane(); }
}

function showMicroBlogPane(){
	$('#pane').show();
	$('#paneTab').hide();
}

function hideMicroBlogPane(){
	$('#paneTab').css('width', $('#pane').width() - 5).show();
	$('#pane').hide();
}

function populateMicroBlogSidebar(){
	switch(microBlogJson.status){
		case "success":
			var posts = microBlogJson.data.feed;
			for(var i = 0; i < posts.length; i++){
				var post = posts[i];
				var $post = generatePostHtml(post, {
					nav: true
				});
				$(".microBlog .widgetScroll").append($post);
			}
			break;
		case "error": messageDialog(result.message); break;
		case "logout": break;
	}
}

function setupMicroBlogCharacterCount(){
	validateForm($("#microBlogReply form"));
	$("#microBlogReply textarea").rules("add", {
		minlength: 1,
		maxlength: microBlogCharCt
	});

	$("#microBlogReply").on("keyup", "textarea", function(){
		var currCt = $(this).val().length;
		var remaining = microBlogCharCt - currCt;
		if(remaining < 0){
			$("#microBlogReply #blogCount").addClass("blogCountNegative").removeClass("blogCountPositive");
		}
		else{
			$("#microBlogReply #blogCount").addClass("blogCountPositive").removeClass("blogCountNegative");
		}
		$("#microBlogReply #blogCount span:first").html(remaining);
	});
}

function openNewPost(){
	var isReply = false;
	if($("#microBlogThread").length != 0){
		try{ isReply = $("#microBlogThread").dialog("isOpen"); } catch(e){};
	}
	var id = (isReply) ? $("#microBlogThread").data("id") : 0;

	if($("#microBlogReply").length == 0){
		var replyHtml = '<div id="microBlogReply" class="popup" title="' + $("#microBlogNewPost").html() + '" data-qa="microBlog-postDialog">';
		replyHtml += '<form action="#" method="post">';
		replyHtml += '<div class="formRow formReq">';
		replyHtml += '<label for="newPostText">New Post</label>';
		replyHtml += '<div class="formContent">';
		replyHtml += '<textarea data-qa="microBlog-postText"></textarea>';
		replyHtml += '<div id="blogCount" class="blogCountPositive" data-qa="microBlog-postCharCount">';
		replyHtml += '<span data-qa="microBlog-postCharsLeft">' + microBlogCharCt + '</span> / ' + '<span data-qa="microBlog-postCharsMax">' + microBlogCharCt + '</span>';
		replyHtml += '</div></div></div>';
		replyHtml += '</form>';
		replyHtml += '</div>';
		$("#templateContent").append(replyHtml);
		setupMicroBlogCharacterCount();
	}

	var buttonArray = [];
	buttonArray.push({
		'text': $('#cancelButtonText').html(),
		'class': 'btn-cancel',
		'click': function(){
			$(this).dialog("close");	
		}
	});
	buttonArray.push({
		'text': $("#microBlogPostText").html(),
		'class': 'btn-post',
		'click': function(){
			if($("#microBlogReply form").valid()){
				startPopupWorking($("#microBlogReply"));
				var url = baseHref + "/connectAjax/post.do";
				var params = { id: id, post: $("#microBlogReply textarea").val() };
				postTimeout(url, params, function(result){
					stopPopupWorking($("#microBlogReply"));
					switch(result.status){
						case "success":
							var post = result.data;
							post.replies = 0;
							post.index = $('#microBlogThread ul li').length - 1;
							post.createdate = $.datepicker.formatDate("mm/dd/y", new Date());
							if(isReply){
								var postHtml = generatePostHtml(post, { nav: false, hide: true });
								$("#microBlogThread ul").append(postHtml);
								$("#microBlogThread ul li:hidden").fadeIn("slow");
								$(".microBlog:not(#microBlogThread .microBlog) li[data-id=" + id + "]").each(function(){
									var ct = parseInt($(this).find(".navigation a:first span").html());
									$(this).find(".navigation a:first span").html(++ct);
								});
							}
							else{
								$(".microBlog").each(function(){
									var postHtml = generatePostHtml(post, { nav: true });
									$(this).find(".widgetScroll li:first").before(postHtml);
									$(this).find(".widgetScroll li:first").effect("highlight", {}, 700);
								});
							}
							$("#microBlogReply").dialog("close");
							break;
						case "error": messageDialog(result.message); break;
						case "logout": loginDialog(); break;
					}
				});
			}
		}
	});

	$("#microBlogReply").dialog({
		modal: (isReply) ? false : true,
		width: 550,
		buttons: buttonArray,
		close: function(){
			$("#microBlogReply textarea").val("");
		}
	});
}

function openMicroBlogThread(){
	var $link = $(this);
	var id = $link.closest("li").data("id");

	if($("#microBlogThread").length == 0){
		$("#templateContent").append('<div id="microBlogThread" class="microBlog" title="' + $("#microBlogThreadText").html() + '"><ul></ul></div>');
	}

	var buttonArray = [];
	buttonArray.push({
		'text': $("#closeButtonText").html(),
		'class': 'btn-close',
		'click': function(){
			$(this).dialog("close");
		}
	});
	if(canPost){
		buttonArray.push({
			'text': $("#postReplyText").html(),
			'class': 'btn-postReply',
			'click': function(){
				openNewPost();	
			}
		});
	}


	$("#microBlogThread").data("id", id);
	$("#microBlogThread").addClass("loading");
	$("#microBlogThread").dialog({
		modal: true,
		width: 700,
		height: 600,
		buttons: buttonArray,
		open: function(){
			var url = baseHref + "/connectAjax/loadReplies.do";
			var params = {id: $("#microBlogThread").data("id")};
			postTimeout(url, params, function(result){
				$("#microBlogThread").removeClass("loading");
				var id = $("#microBlogThread").data("id");
				switch(result.status){
					case "success":
						var posts = result.data;
						var originalPost = null;
						for(var i = 0; i < posts.length; i++){
							var post = posts[i];
							post.index = i - 1;
							if(post.microblogid == id){
								originalPost = post;
							}
							else{
								$("#microBlogThread ul").append(generatePostHtml(post, { original: false, nav: false }));
							}
						}
						var post = generatePostHtml(originalPost, { original: true, nav: false });
						$("#microBlogThread ul").prepend(post);
						break;
					case "error": messageDialog(result.message); break;
					case "logout": break;
				}
			});
			if($link.prev().length){ openNewPost(); }
		},
		close: function(){
			try{$("#microBlogReply").dialog("close");}catch(e){}
			$("#microBlogThread ul").html("");
		}
	});
}

var mbSearchTimeout = null;
function searchMicroBlog(){
	var $microBlog = $(this).closest("fieldset.microBlog");
	clearTimeout(mbSearchTimeout);
	mbSearchTimeout = setTimeout(function(){
		var url = baseHref + "/connectAjax/search.do";
		var params = {"search": $microBlog.find(".microBlogSearch input").val()};
		postTimeout(url, params, function(result){
			switch(result.status){
				case "success":
					var posts = result.data;
					if(posts){
						for(var i = 0; i < posts.length; i++){
							var post = posts[i];
							if(i == 0){
								$microBlog.find("li:first").before(generatePostHtml(post, {nav: true}));
								$microBlog.find("li:not(:first)").remove();
							}
							else{
								$microBlog.find("li:last").after(generatePostHtml(post, {nav: true}));
							}
						}
					}
					else{
						$microBlog.find('li:first').before('<li></li>');
						$microBlog.find('li:not(:first)').remove();
					}
					break;
				case "error": messageDialog(result.message); break;
				case "logout": break;
			}
		});
	}, 500);
}