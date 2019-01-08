var tabIds = {};

var tids = {};
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	var resp = {};
	if (request.cmd === 'open') {
		resp = null;
		chrome.tabs.create({url:request.url,selected: false}, function(tab){
			sendResponse({'id': tab.id});
		});
	}
	else if (request.cmd === 'close') {
		try {
			chrome.tabs.remove(request.id);
		}
		catch(e){}
	}
	else if (request.cmd === 'setTimeout') {
		var tidkey = request.tid + '-' + sender.tab.id;
		if (tidkey in tids) {
			clearTimeout(tids[tidkey]);
		}
		var tid = setTimeout(function(){
			delete tids[tidkey];
			sendResponse({state: 'complete'});
		}, request.t);
		tids[tidkey] = tid;
		return;
	}
	else if (request.cmd === 'clearTimeout') {
		var tidkey = request.tid + '-' + sender.tab.id;
		clearTimeout(tids[tidkey]);
		delete tids[tidkey];
	}
	else if (request.cmd === 'login') {
		chrome.windows.getAll({populate:true},function(wins){
			var hasPage = false;
			$.asyncEach(wins, function(ind, win, done) {
				if (win.tabs.some(function(tab){
					if(tab.url.match(/^https?:\/\/kyfw\.12306\.cn\/otn\/view\/index\.html/)) {
						chrome.tabs.update(tab.id, {url: tab.url});
						return true;
					}
					return false;
				})) {
					hasPage = true;
					done('complete');
					return;
				}
				done('next');
			}, function() {
				if (!hasPage) {
					chrome.tabs.create({url:"https://kyfw.12306.cn/otn/view/index.html",selected: true}, function(tab){ });
				}
			});
		});
	}
	if(resp !== null)
		sendResponse(resp);
});


$.asyncEach = function (obj, fun, complete) {
	var keys = Object.keys(obj);
	if (Array.isArray(obj)) {
		keys = keys.map(function(elem){return elem-0});
	}
	var len = keys.length;
	var keyInd = -1;
	var retryCtn = 0;
	done('next');
	function done(state) {
		if (state === 'complete') {
			complete(Array.prototype.slice.call(arguments, 1));
			return;
		}
		else if (state === 'next') {
			retryCtn = 0;
			keyInd++
		}
		else {
			retryCtn++;
		}
		if (keyInd >= len) {
			complete(Array.prototype.slice.call(arguments, 1));
			return;
		}
		setTimeout(fun.bind(obj, keys[keyInd], obj[keys[keyInd]], done, retryCtn), 0);
	}
};