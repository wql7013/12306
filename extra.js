(function(){
var tids = {}, tid = 0;
window.setTimeout = function(cb, t) {
	var ctn = 0;
	tid++;
	while(tid in tids) {
		tid++;
	}
	var data = {
                    cmd: 'setTimeout',
                    t: t,
					tid: tid
                };
	var curtid = tid;
	chrome.extension.sendRequest(data, function(response){
		if (response.state === 'complete' && (curtid in tids)) {
			if (typeof cb === 'function')
				cb();
			else if (typeof cb === 'string') {
				eval(cb);
			}
			delete tids[curtid];
		}
	});
	tids[tid] = tid;
	return tid;
}
window.clearTimeout = function(tid) {
	var data = {
                    cmd: 'clearTimeout',
					tid: tid
                };
	chrome.extension.sendRequest(data, function(){});
	delete tids[tid];
}
})();
