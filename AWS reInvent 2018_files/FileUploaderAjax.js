if (typeof dwr == 'undefined' || dwr.engine == undefined) throw new Error('You must include DWR engine before including this file');

(function() {
if (dwr.engine._getObject("FileUploaderAjax") == undefined) {
var p;

p = {};
p._path = '/connect/dwr';








p.uploadPersonPhoto = function(p0, p1, p2, p3, callback) {
return dwr.engine._execute(p._path, 'FileUploaderAjax', 'uploadPersonPhoto', arguments);
};





p.uploadPhotoPreview = function(p0, callback) {
return dwr.engine._execute(p._path, 'FileUploaderAjax', 'uploadPhotoPreview', arguments);
};




p.fileUploadStatus = function(callback) {
return dwr.engine._execute(p._path, 'FileUploaderAjax', 'fileUploadStatus', arguments);
};

dwr.engine._setObject("FileUploaderAjax", p);
}
})();

