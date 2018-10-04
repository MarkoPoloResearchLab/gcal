if (typeof dwr == 'undefined' || dwr.engine == undefined) throw new Error('You must include DWR engine before including this file');

(function() {
if (dwr.engine._getObject("StrutsMessageResourceDwr") == undefined) {
var p;

p = {};
p._path = '/connect/dwr';






p.googleTranslateFromEnglishFile = function(p0, p1, callback) {
return dwr.engine._execute(p._path, 'StrutsMessageResourceDwr', 'googleTranslateFromEnglishFile', arguments);
};






p.displayMessageResourceHistory = function(p0, p1, callback) {
return dwr.engine._execute(p._path, 'StrutsMessageResourceDwr', 'displayMessageResourceHistory', arguments);
};






p.decryptHistoryKeyValuePair = function(p0, p1, callback) {
return dwr.engine._execute(p._path, 'StrutsMessageResourceDwr', 'decryptHistoryKeyValuePair', arguments);
};







p.decryptHistoryLanguageKeyValueTuple = function(p0, p1, p2, callback) {
return dwr.engine._execute(p._path, 'StrutsMessageResourceDwr', 'decryptHistoryLanguageKeyValueTuple', arguments);
};







p.storeValue = function(p0, p1, p2, callback) {
return dwr.engine._execute(p._path, 'StrutsMessageResourceDwr', 'storeValue', arguments);
};






p.googleTranslate = function(p0, p1, callback) {
return dwr.engine._execute(p._path, 'StrutsMessageResourceDwr', 'googleTranslate', arguments);
};





p.updateStrutsMessageResource = function(p0, callback) {
return dwr.engine._execute(p._path, 'StrutsMessageResourceDwr', 'updateStrutsMessageResource', arguments);
};






p.loadFromFile = function(p0, p1, callback) {
return dwr.engine._execute(p._path, 'StrutsMessageResourceDwr', 'loadFromFile', arguments);
};

dwr.engine._setObject("StrutsMessageResourceDwr", p);
}
})();

