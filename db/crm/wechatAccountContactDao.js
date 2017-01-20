/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatAccountContactMsg = exports.client = model.crm_wechat_account_contact;
var idg = require('../../db/idg');

exports.model = WechatAccountContactMsg;

exports.find = function(where, cb) {
    WechatAccountContactMsg.find(where, cb);
}

exports.add = function (params, cb) {
    idg.next(WechatAccountContactMsg.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            WechatAccountContactMsg(params).save(function(err, doc){
                if(!err) {
                    cb(null, doc);
                } else {
                    cb(err);
                }
            });
        }
    })
};

