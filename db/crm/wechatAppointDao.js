/**
 * Created by tanyuan on 7/7/15.
 */
var model = exports.model = require('./model');
var WechatAppoint = exports.client = model.crm_wechat_appoint;

var idg = require('../../db/idg');

exports.add = function(wechatAppoint, cb) {
    idg.next(WechatAppoint.collection.name, function (err, result){
        if(err){
            cb(err);
        }else {
            var id = result.toString();

            wechatAppoint._id = parseInt(id);
            WechatAppoint(wechatAppoint).save(function(err){
                if(!err) {
                    cb(null, wechatAppoint);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.updateById = function(id, params, cb) {
    WechatAppoint.update({_id: id}, params, cb);
};