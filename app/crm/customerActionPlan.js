/**
 * Created by wangnan on 14-6-13.
 */

var logger = require('../../lib/logFactory').getModuleLogger(module);
var customerActionPlanDao = require('../../db/crm/customerActionPlanDao');
var customerDao = require('../../db/crm/customerDao');
var customerServiceRecordDao = require('../../db/crm/customerServiceRecordDao');
var userDao = require('../../db/upm/userDao');
var dictionary = require('../../lib/dictionary');
var dictModel = require('../portal/dictModel');
var Pagination = require('../../lib/Pagination');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var taskDao = require('../../db/crm/taskDao');
var idg = require('../../db/idg');
var sioHelper = require('../../lib/sioHelper');
var sender = require('../../routes/sender');

/**
 * 客户行动计划列表请求
 * @param req
 * @param res
 */
exports.listData = function(req, res) {

    console.log('request customerActionPlan List Data...');

    var pagination = new Pagination(req);
    var steps = {};

    steps.plan = function(next) {
        customerActionPlanDao.client
            .findByPage(pagination, function(err, docs) {
                if(err) {
                    logger.error(err.stack);
                    next(err);
                } else {
                    var planList = [];
                    try {
                        planList = _.pluck(docs, '_doc');
                        _.map(planList, function(plan) {
                            var dict = dictModel.getDictByTypeAndKey(
                                dictionary.dictTypes.customerActionPlanType,
                                plan.type
                            );
                            if(dict) {
                                plan.typeName = dict.name;
                            }
                            plan.actionDateStr = moment(plan.actionDate).format('YYYY-MM-DD HH:mm');
                            plan.actionEndDateStr = moment(plan.actionEndDate).format('YYYY-MM-DD HH:mm');
                            if(plan.doTime) {
                                plan.doTimeStr = moment(plan.doTime).format('YYYY-MM-DD HH:mm');
                            }
                            return plan;
                        });
                    } catch(err) {
                        logger.error(err.stack);
                        next(err);
                    }
                    next(null, planList);
                }
            });
    };

    steps.mergeRM = ['plan', function(next, result) {
        var rmList = [];
        var planList = result.plan;
        for(var i in planList) {
            if(planList[i].rm) {
                rmList.push(planList[i].rm);
            }
        }
        if(rmList && rmList.length != 0) {
            userDao.client.find({_id : {$in : rmList}}, function(err, docs) {
                if(err) {
                    logger.error(err.stack);
                    next(err);
                } else {
                    for(var i in docs) {
                        for(var j in planList) {
                            if(planList[j].rm == docs[i]._id) {
                                planList[j].rmName = docs[i].realName;
                                planList[j].rmUsername = docs[i].username;
                                planList[j].password = 0;
                            }
                        }
                    }
                    next(null);
                }
            });
        } else {
            next(null);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({
                err : {msg : '查询行动计划异常'}
            });
        } else {
            res.json({
                customerActionPlanList : result.plan,
                pagination : pagination
            });
        }
    });
}

/**
 * 查询某用户的未完成行动计划日历
 * @param req
 * @param res
 */
exports.listUserSchedule = function(req, res) {
    var steps = {};
    var userId = req.param('userId');
    steps.user = function(next) {
        if(_.isEmpty(userId)) {
            next(null, req.session.user);
        } else {
            userDao.findById(userId, function(err, doc) {
                if(err) {
                    logger.error('customerActionPlan.listUserTodoPlan.user : ' + err.stack);
                    next(err);
                } else {
                    next(null, doc._doc);
                }
            });
        }
    };
    steps.customer = ['user', function(next, result) {
        var customerStatusList = dictModel.getListByTypes([dictionary.dictTypes.customerStatus]);
        var customerSstatusKeyList = _.pluck(customerStatusList, 'key');
        customerDao.client.find({belongUser : result.user._id, status : {$in : customerSstatusKeyList}}, function(err, docs) {
            if(err) {
                logger.error('customerActionPlan.listUserTodoPlan.customer : ' + err.stack);
                next(err);
            } else {
                next(null, _.pluck(docs, '_doc'));
            }
        });
    }];
    steps.plan = ['customer', function(next, result) {
        var customerList = result.customer;
        var customerIdList = null;
        if(_.isEmpty(customerList)) {
            customerIdList = [];
        } else {
            customerIdList = _.pluck(customerList, '_id');
        }
        customerActionPlanDao.findUndoPlanForCustomers(result.user, customerIdList, function(err, docs) {
            if(err) {
                logger.error('customerActionPlan.listUserTodoPlan.plan : ' + err.stack);
                next(err);
            } else {
                next(null, _.pluck(docs, '_doc'));
            }
        });
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, []);
        } else {
            var events = [];
            try {
                var plans = result.plan;
                var customers = result.customer;
                for(var i in plans) {
                    var e = {};
                    e.id = plans[i]._id;
                    var dictName = '';
                    if(! _.isEmpty(plans[i].type)) {
                        var dict = dictModel.getDictByTypeAndKey(
                            dictionary.dictTypes.customerActionPlanType,
                            plans[i].type
                        );
                        dictName = dict.name;
                    }
                    e.title = dictName + '#' + plans[i]._id;
                    for(var j in customers) {
                        if(plans[i].customerId == customers[j]._id) {
                            var statusMap = dictModel.getMapByTypes([
                                dictionary.dictTypes.customerStatus
                            ]);
                            var callStatusMap = dictModel.getMapByTypes([
                                dictionary.dictTypes.customerCallStatus
                            ]);
                            var auditStatusMap = dictModel.getMapByTypes([
                                dictionary.dictTypes.customerAuditStatus
                            ]);
                            var status = customers[j].status;
                            if(_.isEmpty(status)) {
                                customers[j].statusName = '未知';
                            }else {
                                customers[j].statusName = statusMap[customers[j].status].name;
                            }
                            var callStatus = customers[j].callStatus;
                            if(_.isEmpty(callStatus)) {
                                customers[j].callStatusName = '未知';
                            }else {
                                customers[j].callStatusName = callStatusMap[customers[j].callStatus].name;
                            }
                            var auditStatus = customers[j].auditStatus;
                            if(_.isEmpty(auditStatus)) {
                                customers[j].auditStatusName = '未知';
                            }else {
                                customers[j].auditStatusName = auditStatusMap[customers[j].auditStatus].name;
                            }
                            if(customers[j].houseInfo) {
                                customers[j].houseInfoName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerHouseInfos, customers[j].houseInfo).name;
                            }else {
                                customers[j].houseInfoName = '未知';
                            }
                            if(!_.isEmpty(customers[j].profession)) {
                                if(customers[j].profession.type == 'other') {
                                    customers[j].professionInfo = customers[j].profession.describe;
                                }else {
                                    customers[j].professionInfo = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerProfessionTypes, customers[j].profession.type).name;
                                }
                            }else {
                                customers[j].professionInfo = '未知';
                            }
                            if(!_.isEmpty(customers[j].investmentPreference)) {
                                if(customers[j].investmentPreference.type == 'other') {
                                    customers[j].investmentPreferenceInfo = customers[j].investmentPreference.describe;
                                }else {
                                    customers[j].investmentPreferenceInfo = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerInvestmentPreferenceTypes, customers[j].investmentPreference.type).name;
                                }
                            }else {
                                customers[j].investmentPreferenceInfo = '未知';
                            }
                            if(!_.isEmpty(customers[j].investmentTimePreference)) {
                                customers[j].investmentTimePreferenceName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerInvestmentTimePreference, customers[j].investmentTimePreference).name;
                            }else {
                                customers[j].investmentTimePreferenceName = '未知';
                            }
                            if(!_.isEmpty(customers[j].venturePreference)) {
                                customers[j].venturePreferenceName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerVenturePreference, customers[j].venturePreference).name;
                            }else {
                                customers[j].venturePreferenceName = '未知';
                            }
                            if(customers[j].isLikeAction) {
                                customers[j].isLikeActionName = '是';
                            }else {
                                customers[j].isLikeActionName = '否';
                            }
                            if(!_.isEmpty(customers[j].bodyMass)) {
                                customers[j].bodyMassName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerBodyMass, customers[j].bodyMass).name;
                            }else {
                                customers[j].bodyMassName = '未知';
                            }
                            if(!_.isEmpty(customers[j].status)) {
                                customers[j].statusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, customers[j].status).name;
                            }else {
                                customers[j].statusName = '未知';
                            }
                            if(!_.isEmpty(customers[j].sex)) {
                                customers[j].sexName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.sex, customers[j].sex).name;
                            }else {
                                customers[j].sexName = '未知';
                            }
                            plans[i].customer = customers[j];
                            break;
                        }
                    }
                    if(plans[i].actionDate)
                        e.start = plans[i].actionDate;
                    if(plans[i].actionEndDate)
                        e.end = plans[i].actionEndDate;
                    e.plan = plans[i];
                    events.push(e);
                }
            } catch(err) {
                logger.error('customerActionPlan.listUserTodoPlan : ' + err.stack);
                res.json(500, []);
            }

            res.json(events);
        }
    });
};

exports.schedule = function(req, res) {
    var userId = req.param('id');
    if(_.isEmpty(userId)) {
        userId = req.session.user._id;
    }
    userDao.findById(userId, function(err, doc) {
        if(err) {
            logger.error('customerActionPlan.schedule : ' + err.stack);
            res.json({err : {msg : '查询用户信息异常'}});
        } else {
            res.json({user : doc._doc});
        }
    });
}

exports.toComplete = function(req, res) {
    var id = req.param('id');
    var steps = {};
    steps.plan = function(next) {
        customerActionPlanDao.client.findById(id, function(err, doc) {
            if(err) {
                logger.error(err.stack);
                next(err);

            } else {
                next(null, doc._doc);
            }
        });
    };
    steps.customer = ['plan', function(next, result) {
        customerDao.client.findById(result.plan.customerId, function(err, doc) {
            if(err) {
                logger.error(err.stack);
                next(err);
            } else {
                next(null, doc._doc);
            }
        });
    }];
    async.auto(steps, function(err, result) {
        if(err) {
            res.json({
                err : {msg : '打开行动计划完成对话框异常'}
            });
        } else {
            res.json({customerActionPlan : result.plan, customer : result.customer});
        }
    });
};

exports.toMod = function(req, res) {
    var id = req.param('id');
    var steps = {};
    steps.plan = function(next) {
        customerActionPlanDao.client.findById(id, function(err, doc) {
            if(err) {
                logger.error(err.stack);
                next(err);

            } else {
                next(null, doc._doc);
            }
        });
    };
    async.auto(steps, function(err, result) {
        if(err) {
            res.json({
                err : {msg : '打开修改备注对话框异常'}
            });
        } else {
            res.json({customerActionPlan : result.plan});
        }
    });
};

exports.complete = function(req, res) {
    var steps = {};
    var id = req.param('id');

    steps.actionPlan = function(next) {
        customerActionPlanDao.client.findById({_id : id}, function(err, doc) {
            if(err) {
                logger.error('customerActionPlan.complete.actionPlan_1 : ' + err.stack);
                next(err);
            } else {
                var currentDate = new Date();
                doc.done = true;
                doc.comment = req.body.comment;
                doc.doUserid = req.session.user._id;
                doc.doUsername = req.session.user.username;
                doc.doUserRealName = req.session.user.realName;
                doc.doTime = currentDate;
                doc.uuserid = req.session.user._id;
                doc.uusername = req.session.user.username;
                doc.uuserRealName = req.session.user.realName;
                doc.utime = currentDate;
                if(!doc.remind) {
                    doc.remind = false;
                }
                doc.save(function (err, actionPlan, numberAffected) {
                    if(err) {
                        logger.error('customerActionPlan.complete.actionPlan_2 : ' + err.stack);
                        next(err);
                    } else {
                        next(null, actionPlan);
                    }
                });
            }
        })
    };

    steps.findTask = ['actionPlan', function(next, result) {
        taskDao.findOne({_id : result.actionPlan.taskId, type: dictionary.taskType.customerActionPlan}, next);
    }];

    steps.task = ['findTask', function(next, result) {
        taskDao.client.update({_id : result.actionPlan.taskId, type: dictionary.taskType.customerActionPlan}, {done : true, doneTime : Date.now()}, function(err, count) {
            if(err) {
                logger.error('customerActionPlan.complete.task : ' + err.stack);
                next(err);
            } else {
                sender.refreshTaskCountByUserIds(sioHelper.get(), result.findTask.belongUser, {});
                next(null, count);
            }
        });
    }];

    steps.customer = ['actionPlan', function(next, result) {
        customerDao.client.findById(result.actionPlan.customerId, function(err, doc) {
            if(err) {
                logger.error('customerActionPlan.complete.customer_1 : ' + err.stack);
                next(err);
            } else {
                var currentDate = Date.now();
                if(!doc.lastContact) {
                    doc.lastContact = {};
                }
                doc.lastContact.lastContactDate = currentDate;
                doc.lastContact.lastContactUID = req.session.user._id;
                doc.lastContact.lastContactUName = req.session.user.username;
                doc.lastContact.type = result.actionPlan.type;
                doc.lastContact.comment = req.body.comment;
                if(result.actionPlan.type == dictionary.customerActionPlanType.call) {
                    if(!doc.lastCall) {
                        doc.lastCall = {};
                    }
                    doc.lastCall.lastCallDate = currentDate;
                    doc.lastCall.lastCallUID = req.session.user._id;
                    doc.lastCall.lastCallUName = req.session.user.username;
                    doc.lastCall.type = result.actionPlan.type;
                    doc.lastCall.comment = req.body.comment;
                }
                if(doc.unDoActionPlanCount) {
                    --doc.unDoActionPlanCount;
                }
                doc.save(function(err, customer, numberAffected) {
                    if(err) {
                        logger.error('customerActionPlan.complete.customer_2 : ' + err.stack);
                        next(err);
                    } else {
                        next(null, customer);
                    }
                });
            }
        });
    }];

    steps.serviceRecord = ['actionPlan', 'customer', function(next, result) {
        var serviceRecord = {};
        serviceRecord.customerStatus = result.customer.status;
        serviceRecord.customerCallStatus = result.customer.callStatus;
        if(result.customer.auditStatus) {
            serviceRecord.customerAuditStatus = result.customer.auditStatus;
        }
        serviceRecord.type = result.actionPlan.type;
        serviceRecord.customerId = result.actionPlan.customerId;
        serviceRecord.comment = req.body.comment;
        serviceRecord.cuserid = req.session.user._id;
        serviceRecord.cusername = req.session.user.username;
        serviceRecord.crealName = req.session.user.realName;
        serviceRecord.ctime = new Date();
        customerServiceRecordDao.client.add(serviceRecord, idg, function(err, doc) {
            if(err) {
                logger.error('customerActionPlan.complete.serviceRecord : ' + err.stack);
                next(err);
            } else {
                next(null, doc);
            }
        });
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({msg : {type : dictionary.resMsgType.error, body : '系统异常，行动计划完成失败'}});
        } else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '成功完成执行计划'}});
        }
    });
};

exports.mod = function(req, res) {
    var steps = {};
    var id = req.param('id');

    steps.actionPlan = function(next) {
        customerActionPlanDao.client.findById({_id : id}, function(err, doc) {
            if(err) {
                logger.error('customerActionPlan.mod.actionPlan_1 : ' + err.stack);
                next(err);
            } else {
                doc.comment = req.body.comment;
                doc.save(function (err, actionPlan, numberAffected) {
                    if(err) {
                        logger.error('customerActionPlan.mod.actionPlan_2 : ' + err.stack);
                        next(err);
                    } else {
                        next(null, actionPlan);
                    }
                });
            }
        })
    };

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({msg : {type : dictionary.resMsgType.error, body : '系统异常，修改备注失败'}});
        } else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '成功修改备注'}});
        }
    });
};

exports.delete = function(req, res) {
    var id = req.param('id');//plan id
    var step = {};
    step.findPlan = function(next) {
        customerActionPlanDao.client.findById({_id : id}, function(err, doc) {
            if(err) {
                logger.error('customerActionPlan.delete.findPlan : ' + err.stack);
                next(err);
            } else {
                if(doc) {
                    next(null, doc._doc);
                } else {
                    next(null, null);
                }

            }
        })
    };
    step.delTask = ['findPlan', function(next, result) {
        if(result.findPlan) {
            taskDao.client.findByIdAndRemove(result.findPlan.taskId, function(err, doc) {
                if(err) {
                    logger.error('customerActionPlan.delete.delTask : ' + err.stack);
                    next(err);
                } else {
                    next(null, true);
                }
            });
        } else {
            next(null, '');
        }

    }];
    step.modCustomer = ['findPlan', function(next, result) {
        if(result.findPlan) {
            customerDao.modifyById(result.findPlan.customerId, {$inc : {unDoActionPlanCount : -1}}, function(err, doc) {
                if(err) {
                    logger.error('customerActionPlan.delete.modCustomer : ' + err.stack);
                    next(err);
                } else {
                    next(null, true);
                }
            });
        } else {
            next(null, '');
        }
    }];
    step.delPlan = ['findPlan', function(next, result) {
        if(result.findPlan) {
            customerActionPlanDao.client.findByIdAndRemove(id, function(err, doc) {
                if(err) {
                    logger.error('customerActionPlan.delete.delPlan : ' + err.stack);
                    next(err);
                } else {
                    next(null, true);
                }
            });
        } else {
            next(null, '');
        }
    }];
    async.auto(step, function(err, result) {
        if(err) {
            logger.error('customerActionPlan.delete : delTask'
                + result.delTask + ', modCustomer='
                + result.modCustomer + ', delPlan='
                + result.delPlan);
            res.json({msg : {type : dictionary.resMsgType.error, body : '系统异常，删除行动计划异常，请联系管理员'}});
        } else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '成功删除行动计划'}});
        }
    });
};

exports.setDone = function(req, res) {
//    var id = req.param('id');
//    customerActionPlanDao.client.update({_id : id}, {$set : {done : true}}, function(err, count) {
//        if(err) {
//            res.json({msg : {type : dictionary.resMsgType.error, body : '系统异常，行动计划完成失败'}});
//        } else {
//            res.json({msg : {type : dictionary.resMsgType.succ, body : '成功完成执行计划'}});
//        }
//    });
};