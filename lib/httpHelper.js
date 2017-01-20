/**
 * Created by tanyuan on 10/15/15.
 */

var appCfg = require('../app.cfg.js');
var util = require('util');

exports.httpHelper = function(options, postData, next) {
    var req = http.request(options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        if(res.statusCode == 405) {
            next(null, {statusCode: res.statusCode, resultData: '没有权限!'});
        }
        res.on('data', function (resultData) {
            try {
                console.log("http error:", resultData);
                next(null, {statusCode: res.statusCode, resultData: resultData});
            } catch (e) {
                console.log('Error!');
                next(e)
            }
        });
    });

    req.on('error', function(err) {
        console.log('problem with request: ' + err.message);
        next(err)
    });

    // write data to request body
    req.write(postData);

    req.end();
};

exports.httpMultiparty = function(files) {
    var BOUNDARYPREFIX = 'nodejstogolang';
    var options = appCfg.nodejsTogoRequestOptions;
    var max = 9007199254740992;
    var dec = Math.random() * max;
    var hex = dec.toString(36);
    var boundaryKey = BOUNDARYPREFIX + hex;

    var enddata = util.format('\r\n--%s--', boundaryKey);
    var nextLine = '\r\n';

    var contentLenght = 0;
    var fileInfo = [];
    var fileNames = [];


    _.each(files, function(value) {
        var content = util.format('--%s\r\n', boundaryKey);
        content += util.format('Content-Disposition: form-data; name="images"; filename="%s"\r\n', value.name);
        content += util.format('Content-Type: %s\r\n\r\n', value.mimetype);
        var contentBinary = new Buffer(content, 'utf-8');
        fileInfo.push({contentBinary: contentBinary, filePath: value.path});
        contentLenght +=  contentBinary.length + value.size + Buffer.byteLength(nextLine);
        fileNames.push(value.name);
    });

    options.headers['Content-Length'] = contentLenght + Buffer.byteLength(enddata);
    options.headers['Content-Type'] =  util.format('multipart/form-data; boundary=%s', boundaryKey);

    return {options: options, fileInfo: fileInfo, enddata: enddata, nextLine: nextLine, fileNames: fileNames};
};