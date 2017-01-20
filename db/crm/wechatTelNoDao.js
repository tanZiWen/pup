/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatTelNo = exports.client = model.crm_wechat_telNo;

exports.model = WechatTelNo;

exports.find = function(where, cb) {
    WechatTelNo.find(where, cb);
}

exports.add = function (params, cb) {
    WechatTelNo(params).save(function(err, doc){
        if(!err) {
            cb(null, doc);
        } else {
            cb(err);
        }
    });
};

