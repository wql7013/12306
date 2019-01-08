$(function(){
	var eventClick = new MouseEvent('click', {
					'bubbles': true,
					'cancelable': true
				  });
	/*chrome.extension.sendRequest({which:'12306', cmd: 'get_person'}, function(response) {
		
	});*/
	
	g_person = sessionStorage.getItem('pass_person');
	if (!g_person)
		return;
	var persons = g_person.replace(/[ ,]+/g, '|');
	var regx = new RegExp(persons);
	$('#normal_passenger_id label').filter(function(){return $(this).text().match(regx)}).each(function(){this.dispatchEvent(eventClick)});
	$('#submitOrder_id')[0].dispatchEvent(eventClick);
	setTimeout(function checkok(){
		if (!$('#qr_submit_id').hasClass("btn92s"))
		{
			setTimeout(checkok, 100);
			return;
		}
		$('#qr_submit_id')[0].dispatchEvent(eventClick)
		}, 100);
	$('<audio src="/otn/resources/js/framework/audio/message.wav" loop="true" autoplay="true"></audio>').appendTo('body');
});