/**
 * Created by michael on 14-6-3.
 * attent nearby people for wechat account
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatAttentNearby = exports.client = model.crm_wechat_attent_nearby;

var idg = require('../../db/idg');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = WechatAttentNearby;

exports.find = function(where, cb) {
    WechatAttentNearby.find(where, cb);
}


exports.add = function (params, cb) {
    idg.next(WechatAttentNearby.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            WechatAttentNearby(params).save(function(err, doc){
                if(!err) {
                    cb(null, doc);
                } else {
                    cb(err);
                }
            });
        }
    })

};
