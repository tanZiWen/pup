/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatAccountTelNo = exports.client = model.crm_wechat_account_telNo;
var idg = require('../../db/idg');

exports.model = WechatAccountTelNo;

exports.find = function(where, cb) {
    WechatAccountTelNo.find(where, cb);
}

exports.add = function (params, cb) {
    idg.next(WechatAccountTelNo.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            WechatAccountTelNo(params).save(function(err, doc){
                if(!err) {
                    cb(null, doc);
                } else {
                    cb(err);
                }
            });
        }
    })
};

