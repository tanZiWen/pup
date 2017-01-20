/**
 *
 * User: wuzixiu
 * Date: 2/16/14
 * Time: 1:09 PM
 */

var tag = require('./tag');
var areaModel = require('../portal/areaModel');
var dictionary = require('../../lib/dictionary');
var _ = require('underscore');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var customerDao = require('../../db/crm/customerDao');
var customerImplBatchDao = require('../../db/crm/customerImplBatchDao');
var Pagination = require('../../lib/Pagination');

var async = require('async');

exports.dataList = function (req, res) {
    var condition = req.query;

    var status = condition.status;
    delete condition.status;
    var callType = condition.callType;
    if(callType)
        delete condition.callType;

    if(condition.name != undefined){
        condition.name = new RegExp(condition.name);
    }

    var steps = {};

    steps.count = function(next) {
        if(status == '1') {
            customerImplBatchDao.bcCount(condition, next);
        } else {
            if(callType) {
                if(callType == '0') {
                    customerImplBatchDao.callCount(condition, next);
                } else {
                    customerImplBatchDao.noCallCount(condition, next);
                }
            } else {
                customerImplBatchDao.unbcCount(condition, next);
            }
        }
    }

    steps.list = function(next) {
        customerImplBatchDao.model.find(condition, {}, {sort : [{'ctime' : -1}]}, next);
    }

    if(condition.name == undefined){
        steps.countCustomerWithoutBatch = function(next) {
            var where = {};
            if(status == '1') {
                where = {ImpBatchId : 0, free : true, status : {$in : [dictionary.customerStatus.bc20, dictionary.customerStatus.bc40]}};
                if(condition['belongArea.areaCode'])
                    where['belongArea.areaCode'] = condition['belongArea.areaCode'];
                customerDao.client.count(where, next);
            } else {
                where = {ImpBatchId : 0, free : true, status : {$in : [null, '', dictionary.customerStatus.potential]}, callStatus : {$ne: dictionary.customerCallStatus.vacant}};
                if(condition['belongArea.areaCode'])
                    where['belongArea.areaCode'] = condition['belongArea.areaCode'];
                if(callType) {
                    if(callType == '0') {
                        where.lastCall = {$ne : null};
                    } else {
                        where.lastCall = null;
                    }
                }
                customerDao.client.count(where, next);
            }
        };
    }

    async.parallel(steps, function(err, result) {
        if(err) res.json({data: [], count : 0});
        else {
            var count = result.count.length > 0 ? result.count[0].count : 0;
            if(condition.name == undefined){
                count += result.countCustomerWithoutBatch;
                if(condition['belongArea.areaCode']) {
                    (result.list).push({_id : 0, name : '无批次汇总', belongArea : {areaCode : condition['belongArea.areaCode'],
                        areaName : areaModel.getAreaByCode(condition['belongArea.areaCode']).name},
                        bcCount : result.countCustomerWithoutBatch, unbcCount : result.countCustomerWithoutBatch, callCount : result.countCustomerWithoutBatch, callCount : result.countCustomerWithoutBatch});
                } else {
                    (result.list).push({_id : 0, name : '无批次汇总', belongArea : {areaCode : 'all',
                        areaName : '全部'}, bcCount : result.countCustomerWithoutBatch, unbcCount : result.countCustomerWithoutBatch, callCount : result.countCustomerWithoutBatch, callCount : result.countCustomerWithoutBatch});
                }
            }
            res.json({data : result.list, count : count, status : status, callTypeVal : callType});
        }
    });
};

exports.fileUpload = function(req, res) {
    customerImplBatchDao.fileUpload(req, function(err, result) {
        if(err) {
            res.json({name : ""});
        } else {
            res.json({name : result});
        }
    });
}

exports.create = function(req, res) {
    req.connection.setTimeout(600000);
    customerImplBatchDao.create(req, function(err, result) {
        if(err) {
            res.json({msg : {type : dictionary.resMsgType.error, body : '数据库操作异常，导入失败'}});
        } else {
            var data = result;
            res.json({msg : {type : dictionary.resMsgType.succ, body : '数据正在执行异步导入，稍后就会完成'}});
            //console.log(JSON.stringify(data));
//            res.json({msg : {type : dictionary.resMsgType.succ, body :
//                '数据导入成功，读取' + data.totalCount + '条， 成功' + data.successCount + '条', data : data.batch}});
        }
    });
}


exports.count = function(req, res) {
    var condition = req.query;
    customerImplBatchDao.count(condition, function(err, docs) {
        if(err) res.json({count: 0});
        else {
            var count = docs.length > 0 ? docs[0].count : 0;
            res.json({count : count});
        }
    });
}

exports.assign = function(req, res) {
    var params = req.body;
    var user = req.session.user;
    if(params.assignData != undefined && params.assignData.length > 0) {
        customerImplBatchDao.assign(params, user, function(err, result) {
            if(err) {
                res.json({msg : {type : dictionary.resMsgType.error, body : '数据分配异常，操作失败'}});
            } else {
                res.json({msg : {type : dictionary.resMsgType.succ, body : '数据分配成功'}});
            }
        });
    } else {
        res.json({msg : {type : dictionary.resMsgType.error, body : '请选择分配用户'}});
    }
}


exports.historyDataList = function(req, res){
    var pagination = new Pagination(req);
    customerImplBatchDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else
            res.json({data : docs, pagination : pagination});
    });
};

exports.batchDetailDataList = function(req, res) {
    console.log(req.query);
    var id = req.query.id;
    var flag = 0;
    var userid = '';
    if(!_.isEmpty(req.query.userid)) {
        userid = req.query.userid;
        flag = 1;
    }

    customerImplBatchDao.findById(id, function(err, batch) {
        if(err) {
            res.json({err : err.stack});
        } else {
            console.log(batch);
            if(batch) {
                if(_.has(batch._doc, 'assign')) {
                    var assignList = [];
                    _.each(batch.assign, function(assignGroup) {
                        _.each(assignGroup.assignTo, function(assignItem) {
                            var assignData = {};
                            if(flag == 0) {
                                assignData.count = assignItem.count;
                                assignData.userid = assignItem.userid;
                                assignData.username = assignItem.username;
                                assignData.realName = assignItem.realName;

                                assignData.operateRealName = assignGroup.realName;
                                assignData.ctime = assignGroup.ctime;

                                assignList.push(assignData);
                            }else {
                                if(userid && userid == assignItem.userid) {
                                    assignData.count = assignItem.count;
                                    assignData.userid = assignItem.userid;
                                    assignData.username = assignItem.username;
                                    assignData.realName = assignItem.realName;

                                    assignData.operateRealName = assignGroup.realName;
                                    assignData.ctime = assignGroup.ctime;

                                    assignList.push(assignData);
                                }
                            }

                        });
                    });
                    if(assignList.length > 0) {
                        assignList = _.sortBy(assignList, function(assignData) {
                            return assignData.ctime;
                        });
                        assignList.reverse();
                    }
                    res.json({data : assignList});
                } else {
                    res.json({data : []});
                }
            } else {
                res.json({data : []});
            }
        }
    });
}
