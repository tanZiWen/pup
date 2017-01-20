/**
 * Created by tanyuan on 6/18/15.
 */


var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatMoments = exports.client = model.crm_wechat_moments;

var idg = require('../../db/idg');



exports.add = function(wechatMoments, cb) {
    idg.next(WechatMoments.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = result.toString();

            wechatMoments._id = parseInt(id);

            if(wechatMoments.type == 'image') {
                wechatMoments.refObj.dir = id;
            }

            WechatMoments(wechatMoments).save(function(err){
                if(!err) {
                    cb(null, wechatMoments);
                } else {
                    cb(err);
                }
            });
        }
    })
};
