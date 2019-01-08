g_sTrainNum=(sessionStorage.getItem('g_sTrainNum') || '').split(',').filter(function(elem){ return elem.length });
g_seatCode = (sessionStorage.getItem('g_seatCode') || '').split(',').filter(function(elem){ return elem.length });
g_seatText = (sessionStorage.getItem('g_seatText') || '').split(',').filter(function(elem){ return elem.length });
g_person = sessionStorage.getItem('g_person') || '';

var g_check_tid;
var eventClick = new MouseEvent('click', {
	'bubbles': true,
	'cancelable': true
  });
$(function(){
	$('#t-list').before($('<div style="color:red;">抢票：<input id="js_checktime" type="text" placeholder="刷新时间" style="display:inline-block;width:6em;margin:0 14px;"/><input id="js_passenger" type="text" placeholder="乘车人" style="display:inline-block;width:6em;margin:0 14px;"/><button id="js_start" type="button">开始</button>&nbsp;&nbsp;<button id="js_reset" type="button">清空选择</button>&nbsp;&nbsp;座次:&nbsp;<span id="js_seattext"></span>&nbsp;&nbsp;&nbsp;&nbsp;车次:&nbsp;<span id="js_traintext"></span></div>'));
	$('#js_checktime').blur(function(){
		if ($(this).val().match(/^\d+$/)) {
			window.checktime = $(this).val() - 0;
		}
	});
	$('#js_passenger').blur(function(){
		g_person = $(this).val();
		sessionStorage.setItem('g_person', g_person);
		//chrome.extension.sendRequest({which:'12306', cmd: 'set_person', data: $(this).val()}, function() {});
	});
	$('#js_start').click(function(){
		if (window.checkstop === false){
			window.checkstop  = true;
			clearTimeout(fInterval.tid);
			clearTimeout(fOrderErr.tid);
			$(this).text('开始');
		}
		else{
			if (g_sTrainNum.length === 0 || g_seatCode.length === 0) {
				(function btnQueryClick() {
					if (window.checkstop) return;
					var $btnQuery = $('#query_ticket').not('.btn-disabled');//获取查询按钮并点击
					if($btnQuery.length > 0)
						$btnQuery[0].dispatchEvent(eventClick);
					else setTimeout(btnQueryClick,100);
				})();
			}
			else {
				window.checkstop  = false;
				var $btnQuery = $('#query_ticket').not('.btn-disabled');//获取查询按钮并点击
				if($btnQuery.length > 0)
					$btnQuery[0].dispatchEvent(eventClick);
				setTimeout(startcheck.bind(window,$('#train_date').val()), 1000);
				$(this).text('停止');
			}
		}
	});
	$('#js_reset').click(function(){
		g_sTrainNum=[];
		sessionStorage.setItem('g_sTrainNum', '');
		g_seatCode = [];
		sessionStorage.setItem('g_seatCode', '');
		g_seatText = [];
		sessionStorage.setItem('g_seatText', '');
		$('input[name=js_seatcode],input[name=js_traincode]').prop('checked', false);
		$('#js_traintext').text('');
		$('#js_seattext').text('');
	});
	
	$('#t-list thead tr').prepend('<td width="20" color="red">选择</td>');
	var $seatSelect, $trainSelect = $();
	$(document).on('change', 'input[name=js_seatcode]', function() {
		if ($(this).prop('checked') && g_seatCode.indexOf($(this).val()) === -1) {
			g_seatCode.push($(this).val());
			var left = $(this).parents('td').offset().left;
			var seattext = $('#t-list thead tr.th th').filter(function(){
				return Math.abs($(this).offset().left - left) < 5
			}).text().replace(/[\r\n \s]/g,'');
			g_seatText.push(seattext);
		}
		else if (!$(this).prop('checked') && g_seatCode.indexOf($(this).val()) !== -1) {
			var ind = g_seatCode.indexOf($(this).val());
			g_seatCode.splice(ind,1);
			g_seatText.splice(ind,1);
		}
		sessionStorage.setItem('g_seatCode', g_seatCode.join(','));
		sessionStorage.setItem('g_seatText', g_seatText.join(','));
		$('#js_seattext').text(g_seatText.join(', '));
		console.log(g_seatCode);
	}).on('change', 'input[name=js_traincode]', function() {
		if ($(this).prop('checked') && g_sTrainNum.indexOf($(this).val()) === -1) {
			g_sTrainNum.push($(this).val());
		}
		else if (!$(this).prop('checked') && g_sTrainNum.indexOf($(this).val()) !== -1) {
			g_sTrainNum.splice(g_sTrainNum.indexOf($(this).val()),1);
		}
		sessionStorage.setItem('g_sTrainNum', g_sTrainNum.join(','));
		$('#js_traintext').text(g_sTrainNum.join(', '));
		console.log(g_sTrainNum);
	});
	setTimeout(function(){
		// 检查勾选座次
		if ($('#seat_select').length === 0 && $('tr[datatran]','#queryLeftTable').length > 0) {
			if ($seatSelect) $seatSelect.empty().remove();
			$seatSelect = $('tr','#queryLeftTable').has('td').first().clone().find('td').empty().each(function(){
				if ($(this).is('[hbdata][id]')) {
					var seatCode = $(this).attr('id').match(/^\w+(?=_)/)[0];
					$(this).data('id', seatCode);
					$('<input name="js_seatcode" type="checkbox" value="'+seatCode+'" '+(g_seatCode.indexOf(seatCode) === -1 ? '' : 'checked')+'>').appendTo(this);
				}
			}).removeAttr('hbdata hbid onclick id style').css('height','20px').end().removeAttr('datatran class').attr('id', 'seat_select').prepend('<td style="height:20px;"></td>').appendTo('#t-list thead');
			$('#js_seattext').text(g_seatText.join(', '));
		}
		// 检查勾选车次
		$trainSelect = $trainSelect.not($trainSelect.filter(function(){
			return $(this).parents(document).length === 0;
		}).empty().remove());
		if ($trainSelect.length === 0)
			$('#js_traintext').text(g_sTrainNum.join(', '));
		$trainSelect.add($('tr[datatran]','#queryLeftTable').map(function() {
			if ($(this).prev().has('input[name=js_traincode]').length > 0)
				return;
			var strain = $(this).attr('datatran');
			var $input = $('<td><input name="js_traincode" type="checkbox" value="'+strain+'" '+(
				g_sTrainNum.indexOf(strain) === -1 ? '' : 'checked'
				)+'></td>');
			var $tr = $(this).prev().prepend($input);
			return $input;
		}));
		setTimeout(arguments.callee, 1000);
	}, 1000);
});
function startcheck(sDate,sTrainNum){
chrome.extension.sendRequest({which:'12306', cmd: 'login', data: '12306 start!'}, function() {});
clearTimeout(fInterval.tid);
clearTimeout(fOrderErr.tid);
if (sTrainNum !== undefined)
	g_sTrainNum=sTrainNum;
$(function() {
sFrom = $('#fromStationText').val();//设置出发站
sTo = $('#toStationText').val();//设置目的地

fInterval();
});
clearTimeout(checklogin.tid);
checklogin();
}

function fInterval(){
	if (window.checkstop) return;
	if (new Date().getHours() < 6 || new Date().getHours() >= 23) {
		fInterval.tid = setTimeout(fInterval,1000);
		return;
	}
	var sTrainNum=g_sTrainNum;
	var $btnQuery = $('#query_ticket').not('.btn-disabled');//获取查询按钮并点击
	var $modal = $('.dhx_modal_cover').filter(function(){//有遮盖层且隐藏
		return this.style.display == 'none';
	});
	var $btnErr = $('#qd_closeDefaultWarningWindowDialog_id');//错误提示确认按钮
	if($btnQuery.length > 0 && $modal.length > 0 && $btnErr.length <= 0) {//查询按钮可用且无遮盖且无错误提示时
		$(sTrainNum).each(function(index){
			var $TrainTr = $('tr[datatran="'+this.toString()+'"]','#queryLeftTable').prev();//G66的表格行
			if($TrainTr.length > 0 && $(g_seatCode.map(function(ele){return 'td[id^="' + ele + '"]'}).join(','),$TrainTr).text().match(/\d+|有/)) {//某种座有票时
				$('<audio src="/otn/resources/js/framework/audio/message.wav" loop="true" autoplay="true"></audio>').appendTo('body');
				sessionStorage.setItem('pass_person', g_person);
				$('td:last-child a',$TrainTr)[0].dispatchEvent(eventClick);
				fOrderErr.tid = setTimeout(fOrderErr,100);
				return false;
			}
			else if(index == sTrainNum.length - 1){//所有车次二等座无票或无法显示时
				$btnQuery[0].dispatchEvent(eventClick);
				fInterval.tid = setTimeout(fInterval, window.checktime || 510);
			}
		});
	}
	else if($btnErr.length > 0) {//查询失败时
		$btnErr[0].dispatchEvent(eventClick);
		fInterval.tid = setTimeout(fInterval,100);
	}
	else {
		fInterval.tid = setTimeout(fInterval,100);
	}
}

function fOrderErr() {
	if (window.checkstop) return;
	var $orderErr = $('#qd_closeDefaultWarningWindowDialog_id');
	if($orderErr.length > 0) {
		$orderErr[0].dispatchEvent(eventClick);
	}
	else {
		fOrderErr.tid = setTimeout(fOrderErr,100);
	}
}

function checklogin() {
	$.ajax({
		type: 'POST',
		url:'https://kyfw.12306.cn/otn/login/checkUser',
		dataType: 'json',
		success: function(data) {
			if (data.data.flag) {
				checklogin.tid = setTimeout(checklogin, 30000);
				checklogin.logout = false;
			}
			else {
				console.log('logout!!!');
				checklogin.tid = setTimeout(checklogin, 30000);
				if (!checklogin.logout)
				{
					chrome.extension.sendRequest({which:'12306', cmd: 'login', data: '12306 logout!'}, function() {});
				}
				checklogin.logout = true;
			}
		},
		error: function(){
			checklogin.tid = setTimeout(checklogin, 60000);
		}
	})
}