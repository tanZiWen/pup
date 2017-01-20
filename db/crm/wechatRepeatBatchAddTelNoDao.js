/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatRepeatBatchAddTelNo = exports.client = model.crm_wechat_repeat_batch_add_telNo;

exports.model = WechatRepeatBatchAddTelNo;

var idg = require('../../db/idg');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.find = function(where, cb) {
    WechatRepeatBatchAddTelNo.find(where, cb);
}

exports.add = function (params, cb) {
    idg.next(WechatRepeatBatchAddTelNo.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            WechatRepeatBatchAddTelNo(params).save(function(err, doc){
                if(!err) {
                    cb(null, doc);
                } else {
                    cb(err);
                }
            });
        }
    })
};

