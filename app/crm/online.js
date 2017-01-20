/**
 *
 * User: wuzixiu
 * Date: 2/14/14
 * Time: 4:39 PM
 */
var WechatAccountOperateDao = require('../../db/crm/webchatAccountOperateDao');
var WechatAccountDao = require('../../db/crm/wechatAccountDao');
var WechatAccoutContactDao = require('../../db/crm/wechatAccountContactDao');
var async =require('async');
var idg = require('../../db/idg');
var _ = require('underscore');
var dictionary = require('../../lib/dictionary');
var Pagination = require('../../lib/Pagination');

exports.list = function (req, res) {
    res.render('crm/online/list', { title: 'CRM' });
};

exports.account = function (req, res) {
    res.render('crm/online/account', { title: 'CRM' });
};

exports.wachatList = function(req, res) {
    WechatAccountDao.findAll(function(err, result){
        if(err){
            res.json({accountList : {}});
        }else {
            res.json({accountList : result});
        }
    });
}

exports.findOrSave = function(req, res) {
    var params = req.body;
    var step = {};
    step.findWechatAccount = function(next) {
        WechatAccountOperateDao.find(params, next);
    };

    step.addWechatAccount = ['findWechatAccount', function(next, data){
        if(_.isEmpty(data.findWechatAccount)){
            WechatAccountOperateDao.add(params, next);
        } else {
            next(null);
        }
    }];

    async.auto(step, function(err, result){
        if(err) {
            res.json(500, {err: err.stack});
        }

        else {
            if(_.isEmpty(result.findWechatAccount)){
                res.json({type : dictionary.resMsgType.succ, wechat : {id : result.addWechatAccount.toString(), flag : 0}});
            }else {
                result.findWechatAccount.flag = 1;

                res.json({type : dictionary.resMsgType.succ, wechat : result.findWechatAccount});
            }
        }
    });

};

exports.addCount = function(req, res){
    var params = req.body;
    WechatAccountOperateDao.updateByIdCount(params, function(err, result){
        if(err) {
            res.json({type : dictionary.resMsgType.error});
        }else {
            res.json({type : dictionary.resMsgType.succ, wechat : params});
        }
    });
}

exports.addInfo = function(req, res){
    var params = req.body;
    var step = {};
    step.findAuthCustomers = function(next){
        WechatAccountOperateDao.findById(params.id, next);
    };
    step.addAuthCustomers = ['findAuthCustomers', function(next, data) {
        if(!_.isEmpty(data.findAuthCustomers.authCustomers)) {
            var authCustomers = _.property('authCustomers')(data.findAuthCustomers);
            var authAccounts = _.without(_.pluck(authCustomers, 'authAccount'), '');
            var telNos = _.without(_.pluck(authCustomers, 'telNo'), '');
            if(_.contains(authAccounts, params.authAccount) || _.contains(telNos, params.telNo)) {
                next();
            }else {
                WechatAccountOperateDao.updateByIdInfo(params, next);
            }
        }else {
            WechatAccountOperateDao.updateByIdInfo(params, next);
        }
    }];
    async.auto(step, function(err, result) {
        if(err) {
            res.json({type : dictionary.resMsgType.error});
        }else {
            if(_.isUndefined(result.addAuthCustomers)) {
                res.json({msg: {type : dictionary.resMsgType.error, body: '电话号或认证账号已存在'}});
            }else {
                res.json({msg: {type : dictionary.resMsgType.succ}, wechat: params});
            }
        }
    })
//    WechatAccountOperateDao.updateByIdInfo(params, function(err, result){
//        if(err) {
//            res.json({type : dictionary.resMsgType.error});
//        }else {
//            console.log(params);
//            res.json({type : dictionary.resMsgType.succ, wechat : params});
//        }
//    });
}

exports.dataList = function(req, res){
    var params = req.query;
    var step = {};
    var wechatAccounts = [];
    var wechatLists = {};
    step.wechatAccount = function(next) {
        WechatAccountDao.findAll(next);
    };
    step.find = ['wechatAccount', function(next, data) {
        _.each(data.wechatAccount, function(key, value) {
            wechatAccounts.push(key.code);
        });
        params.wechatAccounts = wechatAccounts;
        WechatAccountOperateDao.findByDate(params, next);
    }];

    async.auto(step, function(err, result) {
        if(err){
            res.json({type : dictionary.resMsgType.error});
        }else {
            wechatLists = result.find;
            _.each(wechatLists, function(key, value) {
                if(key.tryCount == 0){
                    key.tryAccountRate = '0.0%';
                }else {
                    key.tryAccountRate = ((key.authCustomers/key.tryCount)*100).toFixed(1)+'%';
                }
                if(key.successCount == 0) {
                    key.successCountRate = '0.0%';
                }else{
                    key.successCountRate = ((key.authCustomers/key.successCount)*100).toFixed(1)+'%';
                }
            });
            res.json({type : dictionary.resMsgType.succ, wechatLists : result.find});
        }
    });
};

exports.modifyInfo = function(req, res) {
    var params = req.body;
    var step = {};
    step.findAuthCustomers = function(next){
        WechatAccountOperateDao.findById(params.id, next);
    };
    step.addAuthCustomers = ['findAuthCustomers', function(next, data) {
        var authCustomerAll = _.property('authCustomers')(data.findAuthCustomers);
        var authCustomerRemove = _.findWhere(authCustomerAll, {telNo: params.fid});
        var authCustomers = _.without(authCustomerAll, authCustomerRemove);
        var authAccounts = _.pluck(authCustomers, 'authAccount');
        var telNos = _.pluck(authCustomers, 'telNo');
        if(_.contains(authAccounts, params.mauthAccount) || _.contains(telNos, params.mtelNo)) {
            next();
        }else {
            WechatAccountOperateDao.modifyByTelNo(params, next);
        }
    }];
    async.auto(step, function(err, result) {
        if(err) {
            res.json({type : dictionary.resMsgType.error, body: '更新失败'});
        }else {
            if(_.isUndefined(result.addAuthCustomers)) {
                res.json({type : dictionary.resMsgType.error, body: '电话号或认证账号已存在'});
            }else {
                res.json({type : dictionary.resMsgType.succ, body: '更新成功', wachat: params});
            }
        }
    });
}

exports.detailList = function(req, res) {
    var pagination = new Pagination(req);
    var wechatList = [];
    WechatAccountOperateDao.client.findByPage(pagination, function(err, result) {
        if(err) {
            res.json({wechatLists: [], pagination: pagination});
        }else {
            _.each(result, function(key, value) {
                var wechat = {};
                wechat.accountCode = key.accountCode;
                wechat.successCount = key.successCount;
                wechat.tryCount = key.tryCount;
                wechat.authCustomersNum = key.authCustomers.length;
                wechatList.push(wechat);

            });
            res.json({wechatLists: wechatList, pagination: pagination});
        }
    })
};

exports.accountListTable = function(req, res) {
    var pagination = new Pagination(req);
    var condition = pagination.condition;
    var steps = {};
    if(condition.telNo) {
        steps.accountContact = function(next) {
            WechatAccoutContactDao.find({telNo: new RegExp(condition.telNo)}, next);
        }
    }else {
        steps.accountContact = function(next) {
            next(null);
        }
    }

    if(condition.nickname) {
        condition.nickname = new RegExp(condition.nickname);
    }

    steps.accountList = ['accountContact', function(next, result) {
        var accountContact = result.accountContact;
        var accountId = [];
        if(accountContact != undefined) {
            if(!_.isEmpty(accountContact)) {
                _.each(accountContact, function(value) {
                    if(!_.contains(accountId, value.belongAccount.accountId)) {
                        accountId.push(value.belongAccount.accountId);
                    }
                });
            }
            condition._id = {$in: accountId};
        }
        delete condition.telNo;
        WechatAccountDao.client.findByPage(pagination, next);
    }];

    async.auto(steps, function(err, doc) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            res.json({accountListTable: doc.accountList, pagination: pagination})
        }
    });
};

exports.accountContact = function(req, res) {
    var pagination = new Pagination(req);
    pagination.condition = {'belongAccount.accountId': parseInt(pagination.condition.id)};
    WechatAccoutContactDao.client.findByPage(pagination, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            res.json({accountContactList: result, pagination: pagination});
        }
    });
};

