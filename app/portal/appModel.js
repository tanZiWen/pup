/**
 * Created by wangnan on 14-5-5.
 */

var appDao = require('../../db/upm/appDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore');

init();

var apps = [];

function init() {
    appDao.findAll(function(err, result) {
        if(err) {
            callback(err, null);
        }else {
            try{
                apps = result;
            }catch(e) {
            }
        }
    })
}

exports.findAppByCode = function(code) {
    var appMap = {};
    _.each(apps, function(key, value) {
        if(key.code == code) {
            appMap = key;
        }
    })
    return appMap;
}
exports.findAllLogoutUrls = function() {
    var logoutUrls = [];
    _.each(apps, function(app, v) {
        if (app.logoutUrl) {
            logoutUrls.push(app.logoutUrl);
        }
    });
    return logoutUrls;
}