
var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatAccountOperate = exports.client = model.crm_wechat_account_operate;
var idg = require('../../db/idg');


exports.add = function (params, cb) {
    idg.next(WechatAccountOperate.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            if(!params._id) {
                params._id = id;
            }
            WechatAccountOperate(params).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.find = function(params, cb){
    WechatAccountOperate.findOne({accountCode : params.accountCode, operateDate : params.operateDate}, cb);
};

exports.findById = function(id, cb){
    WechatAccountOperate.findOne({_id : id}, cb);
};

exports.updateByIdCount =function(params, cb){
    WechatAccountOperate.update(
        {_id : parseInt(params.id)}, {tryCount : parseInt(params.tryCount),
        successCount : parseInt(params.successCount)}, cb);
};

exports.updateByIdInfo =function(params, cb){
    var authCustomers = {};
    authCustomers.authAccount = params.authAccount;
    authCustomers.telNo = params.telNo;
    authCustomers.nickName = params.nickName;
    WechatAccountOperate.update({_id : parseInt(params.id)},{$push : {authCustomers : authCustomers}},cb);
};

exports.findByDate = function(params, cb){
    var rules = {operateDate : {$gte : params.operateStart, $lte : params.operateEnd}, accountCode : {$in : params.wechatAccounts}};
    WechatAccountOperate.aggregate(
        {$match : rules},
        {$group: {_id: '$operateDate', tryCount: {$sum: '$tryCount'},
            successCount: {$sum: '$successCount'},
            authCustomers: {$sum: {$size: '$authCustomers'}}}}).sort({_id : 1}).exec(cb);

};

exports.modifyByTelNo = function(params, cb) {
    WechatAccountOperate.update({_id: params.id, 'authCustomers.telNo': params.fid},
        {$set: {'authCustomers.$.authAccount': params.mauthAccount,
                'authCustomers.$.telNo': params.mtelNo,
                'authCustomers.$.nickName': params.mnickName
        }
},{ upsert: true },cb);

};

exports.findDetail = function(params, cb) {
    WechatAccountOperate.find(params, cb);
};
