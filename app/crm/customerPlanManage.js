/**
 * Created by tanyuan on 7/2/14.
 */

var customerActionPlanDao = require('../../db/crm/customerActionPlanDao');
var dictionary = require('../../lib/dictionary');
var dictModel = require('../portal/dictModel');
var async = require('async');
var userDao = require('../../db/upm/userDao');
var customerDao = require('../../db/crm/customerDao');
var Pagination = require('../../lib/Pagination');

exports.list = function (req, res) {
    var addressType = dictModel.getDictByType(dictionary.dictTypes.customerAddressType);
    var meetType = dictModel.getDictByType(dictionary.dictTypes.customerMeetType);
    var actionPlanType = dictModel.getDictByType(dictionary.dictTypes.customerActionPlanType);
    var doneType = dictModel.getDictByType(dictionary.dictTypes.doneType);
    userDao.find({}, function(err, result) {
        if(err) {
            res.json(500, {err : err.stack});
        }else {
            res.json({addressTypes: addressType, meetTypes: meetType, actionPlanTypes: actionPlanType, doneTypes: doneType, userInfos: result});
        }
    });

}

//exports.getUserInfo = function(req, res){
//    var userInfo = req.body.userInfo;
//    userDao.find({'$or' : [{realName: new RegExp(userInfo)}, {username: new RegExp(userInfo)}]}, function(err, result){
//        if(err) res.json({err : err.stack});
//        else {
//            res.json(result);
//        }
//    });
//}
exports.listTable = function(req, res) {
    var pagination = new Pagination(req);
    var condition = {};
    var params = pagination.condition;
    var step = {};
    var param = {};

    if(!_.isEmpty(params.addressType)) {
        condition.addressType = params.addressType;
    }
    if(!_.isEmpty(params.meetType)) {
        condition.meetType = params.meetType;
    }
    if(!_.isEmpty(params.startTime) && !_.isEmpty(params.endTime)) {
        condition.actionDate = {$gte: params.startTime, $lte: params.endTime};
    }
    if(!_.isEmpty(params.startTime) && _.isEmpty(params.endTime)) {
        condition.actionDate = {$gte: params.startTime};
    }
    if(_.isEmpty(params.startTime) && !_.isEmpty(params.endTime)) {
        condition.actionDate = {$lte: params.endTime};
    }
    if(!_.isEmpty(params.actionPlanType)) {
        condition.type = params.actionPlanType;
    }
    if(!_.isEmpty(params.doneType)) {
        if(params.doneType == dictionary.doneType.finished) {
            condition.done = true;
        }else {
            condition.done = false;
        }
    }

    if(!_.isEmpty(params.customerNameOrCodeOrTel)) {
        param = {$or: [{code: new RegExp(params.customerNameOrCodeOrTel)}, {telNo: new RegExp(params.customerNameOrCodeOrTel)}, {name: new RegExp(params.customerNameOrCodeOrTel)}]};
    }

    if(!_.isEmpty(params.userInfo)){
        param.belongUser = params.userInfo;
    }

    step.findCust = function(next) {
        if(!_.isEmpty(param)) {
            customerDao.find(param, next);
        }else {
            next(null);
        }
    };

    step.findMsg = ['findCust', function(next, data) {
        if(!_.isEmpty(data.findCust)){
            var customerId = _.pluck(data.findCust, '_id');
            condition.customerId = {$in: customerId};
            pagination.condition = condition;
            customerActionPlanDao.client.findByPage(pagination, next);
        }else if(data.findCust == undefined) {
            pagination.condition = condition;
            customerActionPlanDao.client.findByPage(pagination, next);
        }else {
            next(null, []);
        }
    }];

    async.auto(step, function(err, result) {
        if(err) {
            res.json({err : err.stack});
        }else {
            var actionPlanData = result.findMsg;
            async.map(actionPlanData, function(item, cb) {
                var proccess = {};
                var dataObj = {};
                proccess.customerInfo = function(next) {
                    customerDao.findById(item.customerId, next);
                };
                proccess.userInfo = ['customerInfo', function(next, data) {
                    if(!_.isEmpty(data.customerInfo)){
                        userDao.findById(data.customerInfo.belongUser, next);
                    }else {
                        next(null, {});
                    }
                }];
                async.auto(proccess, function(err, result) {
                    var actionPlanType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerActionPlanType, item.type);
                    dataObj.id = item._id;
                    if(!_.isEmpty(actionPlanType)) {
                        dataObj.actionPlanType = actionPlanType.name;
                    }else {
                        dataObj.actionPlanType = '未知';
                    }
                    if(!_.isEmpty(result.userInfo)) {
                        dataObj.userInfo = result.userInfo.username+'('+result.userInfo.realName+')';
                    }else{
                        dataObj.userInfo = '未知';
                    }
                    if(!_.isEmpty(result.customerInfo)) {
                        dataObj.customerName = result.customerInfo.name;
                        dataObj.customerCode = result.customerInfo.code;
                    }else {
                        dataObj.customerCode = '未知';
                        dataObj.customerName = '未知';
                    }
                    dataObj.actionDate = item.actionDate;
                    if(item.done != undefined) {
                        if(item.done) {
                            dataObj.done = '已完成';
                        }else {
                            dataObj.done = '未完成';
                        }
                    }else {
                        dataObj.done = '未知';
                    }
                    cb(null, dataObj);
                });
            }, function(err, result) {
                if(err) {
                    res.json(500, {err : err.stack});
                }else {
                    res.json({customerActionPlans : result, pagination: pagination});
                }
            });
        }
    })
}

exports.detail = function(req, res) {
    var data = req.body;
    var step = {};
    step.actionPlanInfo = function(next) {
        customerActionPlanDao.findPlanById(data.id, next);
    }
    step.rmInfo = ['actionPlanInfo', function(next, data) {
        if(data.actionPlanInfo.rm) {
            userDao.findById(data.actionPlanInfo.rm, next);
        }else {
            next(null);
        }

    }];

    async.auto(step, function(err, result) {
        if(err) {
            res.json(500, {err : err.stack});
        } else {
            if(result.rmInfo) {
                result.actionPlanInfo._doc.rmName = result.rmInfo.realName;
                var meetTypeName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerMeetType, result.actionPlanInfo.meetType);
                var customerAddressTypeName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAddressType, result.actionPlanInfo.addressType);
                result.actionPlanInfo._doc.meetTypeName = meetTypeName.name;
                result.actionPlanInfo._doc.customerAddressTypeName = customerAddressTypeName.name;
            }else {
                result.actionPlanInfo._doc.rmName = '未知';
            }
            if(!result.actionPlanInfo.doTime) {
                result.actionPlanInfo._doc.doTime = '未知';
            }
            if(!result.actionPlanInfo.doUsername) {
                result.actionPlanInfo._doc.doUsername = '未知';
            }
            if(!result.actionPlanInfo.doUserRealName) {
                result.actionPlanInfo._doc.doUserRealName = '未知';
            }
            result.actionPlanInfo._doc.customerName = data.customerName;
            result.actionPlanInfo._doc.userInfo = data.userInfo;
            result.actionPlanInfo._doc.actionPlanType = data.actionPlanType;
            result.actionPlanInfo._doc.doneName = data.doneName;
            res.json({customerActionPlan: result.actionPlanInfo});
        }
    });
}