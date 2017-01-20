/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatMsg = exports.client = model.crm_wechat_msg;
var idg = require('../../db/idg');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = WechatMsg;

exports.find = function(where, cb) {
    WechatMsg.find(where, cb);
}

exports.add = function (params, cb) {
    idg.next(WechatMsg.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            WechatMsg(params).save(function(err, doc){
                if(!err) {
                    cb(null, doc);
                } else {
                    cb(err);
                }
            });
        }
    })

};


