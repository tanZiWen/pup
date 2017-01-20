/**
 * Created by tanyuan on 7/6/15.
 */

var model = exports.model = require('./model');
var WechatHNWC = exports.client = model.crm_wechat_hnwc;
var idg = require('../../db/idg');

exports.add = function(wechatHNWC, cb) {
    idg.next(WechatHNWC.collection.name, function (err, result){
        if(err){
            cb(err);
        }else {
            var id = result.toString();

            wechatHNWC._id = parseInt(id);
            WechatHNWC(wechatHNWC).save(function(err){
                if(!err) {
                    cb(null, wechatHNWC);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.findById = function(id, cb) {
    WechatHNWC.findById(id, cb);
};

exports.updateById = function(id, params, cb) {
    WechatHNWC.update({_id: id}, params, cb);
};