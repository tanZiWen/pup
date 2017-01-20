/**
 * Created by tanyuan on 7/2/15.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatDevice = exports.client = model.crm_wechat_device;

var idg = require('../../db/idg');

exports.add = function(wechatDevice, cb) {
    idg.next(WechatDevice.collection.name, function (err, result){
        if(err){
            cb(err);
        }else {
            var id = result.toString();

            wechatDevice._id = parseInt(id);
            WechatDevice(wechatDevice).save(function(err){
                if(!err) {
                    cb(null, wechatDevice);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.findById = function(id, cb) {
    WechatDevice.findById(id, cb);
};

exports.findOne = function(param, cb) {
    WechatDevice.findOne(param, cb);
};

exports.find = function(param, cb) {
    WechatDevice.find(param, null, {sort: {'ctime': -1}}, cb);
};

