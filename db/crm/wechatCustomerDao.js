/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatCustomer = exports.client = model.crm_wechat_customer;

var idg = require('../../db/idg');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = WechatCustomer;

exports.find = function(where, cb) {
    WechatCustomer.find(where, cb);
}


exports.add = function (params, cb) {
    idg.next(WechatCustomer.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            WechatCustomer(params).save(function(err, doc){
                if(!err) {
                    cb(null, doc);
                } else {
                    cb(err);
                }
            });
        }
    })

};
