/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatTask = exports.client = model.crm_wechat_task;

var idg = require('../../db/idg');

exports.find = function(where, cb) {
    WechatTask.find(where, cb);
}


exports.add = function (params, cb) {
    idg.next(WechatTask.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            WechatTask(params).save(function(err, doc){
                if(!err) {
                    cb(null, doc);
                } else {
                    cb(err);
                }
            });
        }
    })

};
