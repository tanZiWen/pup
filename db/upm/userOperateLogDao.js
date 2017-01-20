/**
 * Created by tanyuan on 11/2/15.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var UserOperateLog = exports.client = model.upm_user_operate_log;
var idg = require('../../db/idg');
var dictionary = require('../../lib/dictionary');
var _ = require('underscore');
var logger = require('../../lib/logFactory').getModuleLogger(module);

exports.add = function(req, cb) {
    idg.next(UserOperateLog.collection.name, function (err, result){
        if(err) {
            cb(err);
        }else {
            var params = {};
            params.agent = req.headers['user-agent'];
            params.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            params.userid = req.session.user._id;
            params.username = req.session.user.username;
            params.realName = req.session.user.realName;
            params.originalUrl = req.originalUrl;
            req.priority = userOperateLevel(arr, params.originalUrl);
            var id = result.toString();
            if(!params._id) {
                params._id = parseInt(id);
            }
            params.priority = req.priority;
            if(!params.priority || params.priority == '') {
                params.priority = dictionary.userOperatePriority.level2;
            }
            UserOperateLog(params).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
};

function userOperateLevel(arr, url) {
    var flag = 0;
    _.each(arr, function(value) {
        if(url.indexOf(value) > 0) {
            flag = 1;
        }
    });

    if(flag == 1) {
        return dictionary.userOperatePriority.level1;
    }else {
        return '';
    }
}
var arr = ['exportCustomerList', 'custAdvanced/list', '/main'];
