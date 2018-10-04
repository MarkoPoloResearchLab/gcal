$(function(){
	$('#templateMain header').appendTo('#templateHeader');

	if($('#sessionSearch').length > 0){
		// var lastSearchDiv = $('#sessionSearch fieldset');
		// $('#sessionTypes_tr').insertAfter(lastSearchDiv);
        var newSession = $('#profileItem_11002_tr');
        $('#sessionTypes_tr').insertAfter(newSession);
	}
	$('a.button').button();
});