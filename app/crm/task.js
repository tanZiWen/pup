/**
 * Created by wangnan on 14-6-24.
 */

var taskDao = require('../../db/crm/taskDao');
var Pagination = require('../../lib/Pagination');
var dictionary = require('../../lib/dictionary');
var dictModel = require('../portal/dictModel');
var moment = require('moment');
var async = require('async');
var userDao = require('../../db/upm/userDao');
var workGroupDao = require('../../db/upm/workgroupDao');
var customerDao = require('../../db/crm/customerDao');
var sysMessageDao = require('../../db/crm/sysMessageDao');
var sender = require('../../routes/sender');
var sioHelper = require('../../lib/sioHelper');
var customerImplBatchDao = require('../../db/crm/customerImplBatchDao');


var logger = require('../../lib/logFactory').getModuleLogger(module);

exports.list = function(req, res) {
    var typeList = dictModel.getDictByType(dictionary.dictTypes.taskType);
    var callListRequestStatusList = dictModel.getDictByType(dictionary.dictTypes.callListRequestStatus);
    res.json({typeList : typeList, callListRequestStatusList: callListRequestStatusList});
};

exports.listData = function(req, res) {
    var user = req.session.user;
    var pagination = new Pagination(req);
    pagination.condition.belongUser = {$in: [user._id]};
    taskDao.client.findByPage(pagination, function(err, docs) {
        if(err) {
            res.json({err : err.stack});
        } else {
            var taskList = _.pluck(docs, '_doc');

            var taskTypeList = dictModel.getDictByType(dictionary.dictTypes.taskType);
            var planTypeList = dictModel.getDictByType(dictionary.dictTypes.customerActionPlanType);

            async.map(taskList, function(key, cb) {
                if(key.ctime) {
                    key.ctimeStr = moment(key.ctime).format('YYYY-MM-DD HH:mm');
                }
                if(key.doneTime) {
                    key.doneTimeStr = moment(key.doneTime).format('YYYY-MM-DD HH:mm');
                }
                translateRefObj(key.type, key.refObj);
                if(key.lock == 0) {
                    key.auditorName = '未认领';
                    cb(null, key);
                }else {
                    userDao.findById(key.lock, function(err, result) {
                        if(err) {
                            logger.error('app.crm.audit.listData:'+err.stack);
                            cb(err);
                        }else {
                            key.auditorName = result.realName;
                            cb(null, key);
                        }
                    });
                }
            }, function(err, doc) {
                if(err) {
                    logger.error('app.crm.audit.listData:'+err.stack);
                    res.json(500, {err: err.stack});
                }else{
                    res.json({taskList : doc, pagination : pagination, taskTypeList : taskTypeList, planTypeList : planTypeList})
                }
            });
        }
    });
};

exports.isAuditing = function(req, res) {
    var params = req.body;

    var user = req.session.user;

    var step = {};

    step.isAuditing = function(next) {
        taskDao.findTask({refId: parseInt(params.refId)}, next);
    };

    step.isUpdateLock = ['isAuditing', function(next, data) {
        if(data.isAuditing.lock == user._id) {
            next(null, true);
        }else if(data.isAuditing.lock == 0){
            taskDao.update({refId: parseInt(params.refId)}, {lock: user._id}, next);
        }else {
            next(null, false);
        }
    }];


    step.findUser = ['isUpdateLock', 'isAuditing', function(next, data) {
        if(!data.isUpdateLock) {
            userDao.findById(data.isAuditing.lock, next);
        }else {
            next(null, false);
        }
    }];

    async.auto(step, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            if(!result.findUser) {
                res.json({msg: {type: dictionary.resMsgType.succ}, id: parseInt(params.refId)});
            }else {
                res.json({msg: {type: dictionary.resMsgType.info, body: '该列表属于质检人'+result.findUser.username+'('+result.findUser.realName+')'}})
            }
        }
    });
};


//展示回收分配任务页面
exports.customerRecycleDistributionShow = function(req, res) {
    var params = req.query;
    var steps = {};

    var taskId = params.id;
    var recycleDistributionPriority = params.recycleDistributionPriority;
    var customerRecycleDistributionType = params.customerRecycleDistributionType;

    console.log('task.customerRecycleDistributionShow:' + taskId);

    steps.task = function(next) {
        taskDao.findOne({_id : taskId}, function(err, doc) {
            if(err) {
                logger.error('task.customerRecycleDistributionShow.task : ' + err.stack);
                next(err);
            } else {
                var task = doc._doc;
                task.ctimeStr = moment(task.ctime).format('YYYY-MM-DD HH:mm:ss');
                next(null, task);
            }
        });
    };

    steps.users = function(next) {
      userDao.find({status : dictionary.userStatus.ok}, function(err, docs) {
          if(err) {
              logger.error('task.customerRecycleDistributionShow.users: '+ err.stack);
              next(err);
          }else {
              next(null, _.pluck(docs, '_doc'));
          }
      });
    };

    steps.rmList = function(next) {
        userDao.findRM(function(err, docs) {
            if(err) {
                logger.error('task.customerRecycleDistributionShow.rmList : ' + err.stack);
                next(err);
            } else {
                next(null, _.pluck(docs, "_doc"));
            }
        });
    };

    steps.consultants = ['task', function(next, result) {
        workGroupDao.findByLeaders(result.task.belongUser, function(err, docs) {
            if(err) {
                logger.error('task.customerRecycleDistributionShow.consultants_1 : ' + err.stack);
                next(err);
            } else {
                var groups = _.pluck(docs, '_doc');
                var userIds = [];
                _.each(groups, function(g) {
                    userIds = _.union(userIds, _.pluck(g.workers, 'userid'));
                });
                userDao.find({_id : {$in : userIds}, status : dictionary.userStatus.ok}, function(err, docs1) {
                    if(err) {
                        logger.error('task.customerRecycleDistributionShow.consultants_2 : ' + err.stack);
                        next(err);
                    } else {
                        next(null, _.pluck(docs1, '_doc'));
                    }
                });
            }
        });
    }];

    if(customerRecycleDistributionType == dictionary.customerRecycleDistributionType.promotion) {
        steps.customers = ['task', 'users', function(next, result) {
            customerDao.findRecycleDistribution(result.task.refObj.userid, function(err, docs) {
                if(err) {
                    logger.error('task.customerRecycleDistributionShow.customers_1 : ' + err.stack);
                    next(err);
                } else {
                    if(recycleDistributionPriority == dictionary.customerRecycleDistributionPriority.consultantPriority) {
                        _.each(docs, function(value) {
                            value.ultimateBlong = {};
                            var belongUser = _.findWhere(result.users, {_id: value.belongUser});
                            if(_.isEmpty(belongUser)) {
                                value.ultimateBlong.user = _.findWhere(result.users, {_id: value.manager});
                                value.ultimateBlong.flag = 'delBelong';
                            }else {
                                value.ultimateBlong.user = belongUser;
                                value.ultimateBlong.flag = 'delBelongToManager';
                            }

                        });
                    }else if(recycleDistributionPriority == dictionary.customerRecycleDistributionPriority.rmPrioroty) {
                        _.each(docs, function(value) {
                            value.ultimateBlong = {};
                            var manager = _.findWhere(result.users, {_id: value.manager});
                            if(_.isEmpty(manager)) {
                                value.ultimateBlong.user = _.findWhere(result.users, {_id: value.belongUser});
                                value.ultimateBlong.flag = 'delBelongToManager';
                            }else {
                                value.ultimateBlong.user = manager;
                                value.ultimateBlong.flag = 'delBelong';
                            }
                        });
                    }
                    next(null, docs);
                }
            });
        }];
    }else {
        steps.customers = ['task', 'users', function(next, result) {
            customerDao.findRecycleDistributionByUser(result.task.refObj.userid, function(err, docs) {
                if(err) {
                    logger.error('task.customerRecycleDistributionShow.customers_2 : ' + err.stack);
                    next(err);
                } else {
                    next(null, docs);
                }
            });
        }];
    }

    steps.mergeGroupLeaders = ['task', function(next, result) {
        userDao.find({_id : {$in : result.task.belongUser}}, function(err, docs) {
            if(err) {
                logger.error('task.customerRecycleDistributionShow.mergeGroupLeaders : ' + err.stack);
                next(err);
            } else {
                result.task.leaders = _.pluck(docs, "_doc");
                next(null, true);
            }
        });
    }];

    steps.mergeCustomerConsultant = ['customers', function(next, result) {
        userDao.client.loadRefFor(result.customers, {
            refFieldName : 'belongUser',
            refDataFieldName : 'refConsultant'
        }, function(err, docs) {
            if(err) {
                logger.error('task.customerRecycleDistributionShow.mergeCustomerConsultant : ' + err.stack);
                next(err);
            } else {
                next(null, true);
            }
        });
    }];

    steps.mergeCustomerManager = ['customers', function(next, result) {
        userDao.client.loadRefFor(result.customers, {
            refFieldName : 'manager',
            refDataFieldName : 'refManager'
        }, function(err, docs) {
            if(err) {
                logger.error('task.customerRecycleDistributionShow.mergeCustomerManager : ' + err.stack);
                next(err);
            } else {
                next(null, true);
            }
        });
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({error: {type: dictionary.resMsgType.error, body: '加载任务'}})
        } else {
            res.json({
                task : result.task,
                customers : result.customers,
                consultants : result.consultants,
                managers : result.rmList,
                recycleDistributionPrioritys: dictModel.getDictByType(dictionary.dictTypes.customerRecycleDistributionPriority),
                recycleDistributionPriority: recycleDistributionPriority
            });
        }
    });
};


//执行回收分配任务
exports.customerRecycleDistributionSubmit = function(req, res) {
    console.log('task.customerRecycleDistributionSubmit');

    var taskId = req.param('taskId');
    var submitType = req.param('submitType');
    var dealResult = req.param('dealResult');
    var dealCustomerMap = {};
    var dealPromotions = [];
    var reasons = [];
    var steps = {};
    var customerImpBatchId = [];

    steps.task = function(next) {
        taskDao.findOne({_id : taskId}, function(err, doc) {
            if(err) {
                logger.error('task.customerRecycleDistributionSubmit.task: ' + err.stack);
                next(err);
            } else {
                next(null, doc);
            }
        });
    };

    steps.users = function(next) {
        userDao.find({}, function(err, doc) {
            if(err) {
                logger.error('crm.task.customerRecycleDistributionSubmit.users: ' +err.stack);
                next(err);
            }else {
                next(null, doc);
            }
        });
    };

    if(submitType == dictionary.customerRecycleDistributionType.quitOffice) {
        //合并被处理客户的信息
        for(var i in dealResult) {
            var doc = dealResult[i];
            var customer = dealCustomerMap[doc[2]];

            if(!customer) {
                customer = {};
                dealCustomerMap[doc[2]] = customer;
            }

            if(doc[0] == 'consultant') {
                customer.belongUser = doc[1];
            } else if(doc[0] == 'manager') {
                customer.manager = doc[1];
            }
        }

        steps.customers = ['task', function(next, data) {
            customerDao.findRecycleDistributionByUser(data.task.refObj.userid, function(err, doc) {
                if(err) {
                    logger.error('crm.task.customerRecycleDistributionSubmit.customers: ' + err.stack);
                    next(err);
                }else {
                    next(null, doc);
                }
            });
        }];

        steps.dealRecycleDistrition = ['customers', 'users', function(next, data) {
            var step = {};
            var customers = data.customers;
            var task = data.task;
            var users = data.users;

            //员工离职处理
            _.each(customers, function(doc) {
                step['customer_' + doc._id] = function(next) {
                    var reason = {};
                    var customer = {};
                    reason.customerName = doc.name;
                    reason.customerCode = doc.code;
                    reason.oldBelongUser = doc.belongUser;
                    reason.oldManager = doc.manager;

                    var flag = 0;
                    var userInfo = {};

                    _.each(dealCustomerMap, function(user, customerId){
                        if(customerId == doc._id) {
                            flag = 1;
                            userInfo = user;
                        }
                    });

                    var manager = _.findWhere(users, {_id: doc.manager});
                    var consultant = _.findWhere(users, {_id: doc.belongUser});

                    if(flag == 1) {
                        if(!_.isEmpty(userInfo.belongUser) && !_.isEmpty(userInfo.manager)) {
                            if(!userInfo.belongUser.userid && !userInfo.manager.userid) {
                                customer.belongUser = '';
                                customer.manager = '';
                                customer.free = true;
                                if(!_.contains(customerImpBatchId, doc.ImpBatchId)) {
                                    customerImpBatchId.push(doc.ImpBatchId)
                                }
                            }else {
                                if(userInfo.belongUser.userid) {
                                    customer.belongUser = parseInt(userInfo.belongUser.userid);
                                }else {
                                    customer.belongUser = '';
                                }
                                if(userInfo.manager.userid) {
                                    customer.manager = parseInt(userInfo.manager.userid);
                                }
                            }
                            reason.nowBelongUser = customer.belongUser;
                            reason.nowManager = customer.manager;
                        }else if(!_.isEmpty(userInfo.belongUser) && _.isEmpty(userInfo.manager)){
                            if(_.isEmpty(manager) || (!_.isEmpty(manager) && manager.status != dictionary.userStatus.ok)) {
                                customer.manager = '';
                                if(!userInfo.belongUser.userid) {
                                    customer.free = true;
                                    customer.belongUser = '';
                                    if(!_.contains(customerImpBatchId, doc.ImpBatchId)) {
                                        customerImpBatchId.push(doc.ImpBatchId)
                                    }
                                }else{
                                    customer.belongUser = parseInt(userInfo.belongUser.userid);
                                }
                                reason.nowManager = customer.manager;
                            }else {
                                if(userInfo.belongUser.userid) {
                                    customer.belongUser = parseInt(userInfo.belongUser.userid);
                                }else {
                                    customer.belongUser = '';
                                }
                                reason.nowManager = doc.manager;
                            }
                            reason.nowBelongUser = customer.belongUser;
                        }else if(_.isEmpty(userInfo.belongUser) && !_.isEmpty(userInfo.manager)) {
                            if(_.isEmpty(consultant) || (!_.isEmpty(consultant) && consultant.status != dictionary.userStatus.ok)) {
                                customer.belongUser = '';
                                if(!userInfo.manager.userid) {
                                    customer.free = true;
                                    customer.manager = '';
                                    if(!_.contains(customerImpBatchId, doc.ImpBatchId)) {
                                        customerImpBatchId.push(doc.ImpBatchId)
                                    }
                                }else {
                                    customer.manager = parseInt(userInfo.manager.userid);
                                }
                                reason.nowBelongUser = customer.belongUser;
                            }else {
                                if(userInfo.manager.userid) {
                                    customer.manager = parseInt(userInfo.manager.userid);
                                }else {
                                    customer.manager = '';
                                }
                                reason.nowBelongUser = doc.belongUser;
                            }
                            reason.nowManager = customer.manager;
                        }
                    }else {
                        if(task.refObj.userid == doc.belongUser) {
                            if(_.isEmpty(manager) || (!_.isEmpty(manager) && manager.status != dictionary.userStatus.ok)) {
                                customer.belongUser = '';
                                customer.manager = '';
                                customer.free = true;
                                reason.nowBelongUser = customer.belongUser;
                                reason.nowManager = customer.manager;
                                if(!_.contains(customerImpBatchId, doc.ImpBatchId)) {
                                    customerImpBatchId.push(doc.ImpBatchId)
                                }
                            }else {
                                customer.belongUser = '';
                                reason.nowBelongUser = customer.belongUser;
                                reason.nowManager = doc.manager;
                            }
                        }
                        if(task.refObj.userid == doc.manager) {
                            if(_.isEmpty(consultant) || (!_.isEmpty(consultant) && consultant.status != dictionary.userStatus.ok)) {
                                customer.belongUser = '';
                                customer.manager = '';
                                customer.free = true;
                                reason.nowBelongUser = customer.belongUser;
                                reason.nowManager = customer.manager;
                                if(!_.contains(customerImpBatchId, doc.ImpBatchId)) {
                                    customerImpBatchId.push(doc.ImpBatchId)
                                }
                            }else {
                                customer.manager = '';
                                reason.nowBelongUser = doc.belongUser;
                                reason.nowManager = customer.manager;
                            }
                        }
                    }

                    reasons.push(reason);

                    customerDao.modifyById(doc._id, customer, function(err, result) {
                        if(err) {
                            logger.error('crm.task.customerRecycleDistributionSubmit.dealRecycleDistrition.modifyById error:' +err.stack);
                            next(null);
                        }else {
                            next(null, result);
                        }
                    });
                }
            });
            async.parallel(step, next);
        }];
    }

    steps.refreshBatchCount = ['dealRecycleDistrition', function(next, data) {
        if(!_.isEmpty(customerImpBatchId)) {
            customerImplBatchDao.refreshBatchCount(customerImpBatchId, next);
        }else {
            next(null, false);
        }

    }];

    if(submitType == dictionary.customerRecycleDistributionType.promotion) {
        _.each(dealResult, function(value) {
            var docs = value.split(',');
            dealPromotions.push({customerId: docs[0], condition: docs[1]});
        });

        steps.dealRecycleDistrition = function(next) {
            var step = {};

            //用户晋升客户处理
            _.each(dealPromotions, function(value) {
                step['customer_' + value.customerId] = function(next) {
                    customerDao.findById(value.customerId, function(err, doc) {
                        if(err) {
                            logger.error('crm.task.customerRecycleDistributionSubmit.dealRecycleDistrition.findById.promotion error: ' +err.stack);
                            next(err);
                        }else {
                            var reason = {};
                            reason.customerName = doc.name;
                            reason.customerCode = doc.code;
                            reason.oldBelongUser = doc.belongUser;
                            reason.oldManager = doc.manager;
                            if(value.condition == 'delBelongToManager') {
                                doc.manager = doc.belongUser;
                                doc.belongUser = null;

                            }else {
                                doc.belongUser = null;
                            }
                            reason.nowBelongUser = doc.belongUser;
                            reason.nowManager = doc.manager;
                            reasons.push(reason);
                            doc.save(function(err) {
                                if(err) {
                                    logger.error('cmr.task.customerRecycleDistributionSubmit.dealPromotion.save.promotion error:' +err.stack);
                                    next(err);
                                } else {
                                    next(null, doc);
                                }
                            });
                        }
                    });
                }
            });
            async.parallel(step, next);
        };
    }

    steps.dm = ['dealRecycleDistrition', function(next, result) {
        userDao.findDM(function(err, docs) {
            if(err) {
                logger.error('task.customerRecycleDistributionSubmit.dm : ' + err.stack);
                next(err);
            } else {
                next(null, _.pluck(docs, '_doc'));
            }
        });
    }];

    steps.doneTask = ['dealRecycleDistrition', 'task', function(next, result) {
        var task = result.task;
        var params = {};
        params.done = true;
        params.doneTime = new Date();
        params.$set = {'refObj.reasons': reasons};
        taskDao.update({_id : taskId}, params, function(err, doc) {
            if(err) {
                logger.error('task.customerRecycleDistributionSubmit.doneTask:' +err.stack);
                next(err);
            }else {
                sender.refreshTaskCountByUserIds(sioHelper.get(), task.belongUser, {});
                next(null, doc);
            }
        });

    }];

    steps.addSysMsg = ['dm', 'doneTask', 'users', function(next, result) {
        var step = {};
        var leaderStr = '';
        var customers = _.values(result.dealRecycleDistrition);
        var dms = _.pluck(result.dm, '_id');
        var task = result.task;
        var users = result.users;
        //todo 发消息通知数据管理员更新情况
        _.each(task.belongUser, function(value) {
            var user = _.findWhere(users, {_id: value});
            if(!_.isEmpty(user)) {
                leaderStr += user.username+'('+user.realName+') ';
            }
        });
        var ctime = moment(task.ctime).format('YYYY-MM-DD HH:ss');
        var msgContent = '';
        msgContent += '<div class="modal-header">';
        msgContent += '<div><button type="button" data-dismiss="modal" aria-hidden="true" class="close">×</button>';
        msgContent += '<div class="row"><div class="col-md-12"><h4 class="modal-title">回收分配用户:  ' + task.refObj.realName + '(' + task.refObj.username + ')</h4></div></div></div></div>';
        msgContent += '<div class="modal-body">';
        msgContent +=  '<div class="row"><table class="table mm-box"><tbody><tr class="th-inverse-success"><th style="width: 15%" class="text-center"> 员工</th><th style="width: 20%" class="text-center"> 创建时间</th><th style="width: 65%" class="text-center"> 员工组长</th></tr></tbody><tbody><tr><td class="text-center">'+ task.refObj.username + '(' + task.refObj.realName + ')</td><td class="text-center">' +ctime+ ' </td><td class="text-center"><span class="m-r-5">' + leaderStr + '</span></td></tr></tbody></table></div>';
        msgContent += '<div class="row">';
        msgContent += '<table class="table mm-box">';
        msgContent += '<tbody><tr class="th-inverse-success">';
        msgContent += '<th>客户名称</th>';
        msgContent += '<th>客户编号</th>';
        msgContent += '<th>原顾问</th>';
        msgContent += '<th></th>';
        msgContent += '<th>当前顾问</th>';
        msgContent += '<th>RM</th>';
        msgContent += '<th></th>';
        msgContent += '<th>当前RM</th>';
        msgContent += '</tr></tbody><tbody>';
        _.each(reasons, function(key) {
            msgContent += '<tr>';
            msgContent += '<td>' + key.customerName + '</td>';
            msgContent += '<td>' + key.customerCode + '</td>';
            var user = {};
            if(key.oldBelongUser) {
                user = _.findWhere(users, {_id: key.oldBelongUser});
                if(user) {
                    msgContent += '<td>' + user.realName + '(' + user.username + ')</td>';
                }else {
                    msgContent += '<td>无</td>';
                }
            } else {
                msgContent += '<td>无</td>';
            }
            msgContent += '<td><div class="glyphicon glyphicon-arrow-right"></div></td>';
            if(key.nowBelongUser) {
                user = _.findWhere(users, {_id: key.nowBelongUser});
                if(user) {
                    msgContent += '<td>' + user.realName + '(' + user.username + ')</td>';
                }else {
                    msgContent += '<td>无</td>';
                }
            } else {
                msgContent += '<td>无</td>';
            }
            if(key.oldManager) {
                user = _.findWhere(users, {_id: key.oldManager});
                if(user) {
                    msgContent += '<td>' + user.realName + '(' + user.username + ')</td>';
                }else {
                    msgContent += '<td>无</td>';
                }
            } else {
                msgContent += '<td>无</td>';
            }
            msgContent += '<td><div class="glyphicon glyphicon-arrow-right"></div></td>';
            if(key.nowManager) {
                user = _.findWhere(users, {_id: key.nowManager});
                if(user) {
                    msgContent += '<td>' + user.realName + '(' + user.username + ')</td>';
                }else {
                    msgContent += '<td>无</td>';
                }
            } else {
                msgContent += '<td>无</td>';
            }
            msgContent += '</tr>';
        });
        msgContent += '</tbody></table></div></div>';
        msgContent += '<div class="modal-footer"><div class="text-center"><button style="margin-right: 40px;" data-dismiss="modal" class="cancel btn btn-lg btn-info">关闭</button></div></div>';

        _.each(result.dm, function(dm) {
            step['sysMessage_'+dm._id] = function(next) {
                var sysMsg = {};
                if(task.refObj.customerRecycleDistributionType
                    == dictionary.customerRecycleDistributionType.promotion) {
                    sysMsg.title = '晋升回收分配';
                } else if (task.refObj.customerRecycleDistributionType
                    == dictionary.customerRecycleDistributionType.quitOffice) {
                    sysMsg.title = '离职回收分配';
                }
                sysMsg.type = dictionary.sysMessageType.info;
                sysMsg.read = false;
                sysMsg.receiver = {
                    userid : dm._id,
                    username : dm.username,
                    realName : dm.realName
                };
                sysMsg.beOptPer = {
                    userid: task.refObj.userid,
                    username: task.refObj.username,
                    realName: task.refObj.realName
                };
                sysMsg.content = msgContent;
                sysMessageDao.add(sysMsg, next);
            }
        });
        async.parallel(step, function(err, result) {
            if(err) {
                logger.error('task.customerRecycleDistributionSubmit.addSysMsg' + err.stack);
            }else {
                sender.refreshMsgCountByUserIds(sioHelper.get(), dms, {});
                next(err, result);
            }
        })

    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({
                msg: {type: dictionary.resMsgType.error, body: '系统出现异常，回收分操作失败'}
            });
        } else {
            res.json({
                msg: {type: dictionary.resMsgType.info, body: '回收分配成功'}
            });
        }
    });
};

exports.recycleDistributionDetail = function(req, res) {
    var taskId = req.param('taskId');
    var steps = {};

    steps.users = function(next) {
        userDao.find({}, next);
    };

    steps.task = function(next) {
        taskDao.findOne({_id: taskId}, next);
    };

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.task.recycleDistribution error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            var users = _.pluck(result.users, '_doc');
            var task = result.task._doc;
            var customers = [];
            var leaders = [];
            if(task.refObj.reasons) {
                _.each(task.refObj.reasons, function(value) {
                    var customer = {};
                    customer.customerName = value.customerName;
                    customer.customerCode = value.customerCode;
                    customer.oldBelongUser = _.findWhere(users, {_id: value.oldBelongUser});
                    customer.oldManager = _.findWhere(users, {_id: value.oldManager});
                    customer.nowBelongUser = _.findWhere(users, {_id: value.nowBelongUser});
                    customer.nowManager = _.findWhere(users, {_id: value.nowManager});
                    customers.push(customer);
                });
            }

            _.each(task.belongUser, function(value) {
                var leader = _.findWhere(users, {_id: value});
                if(leader) {
                    leaders.push(leader);
                }
            });
            task.ctimeStr = moment(task.ctime).format('YYYY-MM-DD HH:mm:ss');
            res.json({task: task, customers: customers, leaders: leaders});
        }
    })
};

exports.customerLevelPromotion = function(req, res) {
    var id = req.param('taskId');
    var steps = {};

    steps.task = function(next) {
        taskDao.findOne({_id: parseInt(id)}, next);
    };

    steps.customer = ['task', function(next, data) {
        var task = data.task;
        if(!_.isEmpty(task)) {
            customerDao.findOne({_id: task.refObj.customer.id}, next);
        }else {
            next(null);
        }
    }];

    steps.users = function(next) {
        userDao.find({}, next);
    };

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.task.customerLevelPromotion error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            var customer = result.customer._doc;
            var task = result.task;
            var users = _.pluck(result.users, '_doc');
            customer.taskId = task._id;
            customer.taskDone = task.done;
            if(task.refObj.customer.status) {
                customer.oldStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, task.refObj.customer.status).name;
            }else {
                customer.oldStatusName = '未知';
            }
            if(customer.auditStatus) {
                customer.auditStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAuditStatus, customer.auditStatus).name;
            }else {
                customer.auditStutusName = '未知';
            }
            if(customer.callStatus) {
                customer.callStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerCallStatus, customer.callStatus).name;
            }else {
                customer.callStatusName = '未知';
            }
            if(customer.reviewStatus) {
                customer.reviewStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerReviewStatus, customer.reviewStatus).name;
            }else {
                customer.reviewStatusName = '未知';
            }
            if(task.refObj.type) {
                customer.newStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, task.refObj.type).name;
            }else {
                customer.newStatusName = '未知';
            }
            if(task.type) {
                customer.taskTypeName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.taskType, task.type).name;
            }else {
                customer.taskTypeName = '未知';
            }
            if(task.ctime) {
                customer.ctimeStr = moment(task.ctime).format('YYYY-MM-DD HH:mm:ss');
            }else {
                customer.ctimeStr = '未知';
            }
            if(!_.isEmpty(customer.profession)) {
                customer.professionName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerProfessionTypes, customer.profession.type).name;
            }else {
                customer.professionName = '未知';
            }
            if(customer.investmentTimePreference) {
                customer.investmentTimePreferenceName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerInvestmentTimePreference, customer.investmentTimePreference).name;
            }else {
                customer.investmentTimePreferenceName = '未知';
            }
            if(customer.bodyMass) {
                customer.bodyMassName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerBodyMass, customer.bodyMass).name;
            }else {
                customer.bodyMassName = '未知';
            }
            if(!_.isEmpty(customer.investmentPreference)) {
                customer.investmentPreferenceName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerInvestmentPreferenceTypes, customer.investmentPreference.type).name;
            }else {
                customer.investmentPreferenceName = '未知';
            }
            if(customer.belongUser) {
                var belongUser = _.findWhere(users, {_id: customer.belongUser});
                if(!_.isEmpty(belongUser)) {
                    customer.belongUserInfo = belongUser;
                }else {
                    customer.belongUserInfo = {};
                }
            }else {
                customer.belongUserInfo = {};
            }
            if(customer.manager) {
                var manager = _.findWhere(users, {_id: customer.manager});
                if(!_.isEmpty(manager)) {
                    customer.managerInfo = manager;
                }else {
                    customer.managerInfo = {};
                }
            }else {
                customer.managerInfo = {};
            }
            res.json({customer: customer});
        }
    });
};
exports.customerLevelPromotionReject = function(req, res) {
    var taskId = parseInt(req.param('taskId'));

    var steps = {};

    steps.modifyTask = function(next) {
        taskDao.findOne({_id: taskId}, function(err, docs) {
            if(err) {
                logger.error('crm.task.customerLevelPromotionReject.findOne error:' +err.stack);
                next(err);
            }else {
                docs.doneTime = new Date();
                docs.done= true;
                docs.refObj.updateUser = {};
                docs.refObj.updateUser.id = req.session.user._id;
                docs.refObj.updateUser.username = req.session.user.username;
                docs.refObj.updateUser.realName = req.session.user.realName;
                docs.save(function(err, result) {
                    if(err) {
                        logger.error('crm.task.customerLevelPromotionReject.save error:'+ err.stack);
                        next(err);
                    }else {
                        sender.refreshTaskCountByUserIds(sioHelper.get(), docs.belongUser, {});
                        next(null, result._doc);
                    }
                })
            }
        })
    };

    steps.modifyCustomer = ['modifyTask', function(next, data) {
        var task = data.modifyTask;
        customerDao.modifyById(task.refObj.customer.id, {reviewStatus: dictionary.customerReviewStatus.unreviewed}, next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.task.customerLevelPromotionReject error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '驳回成功!'}})
        }
    })

};

exports.customerLevelPromotionSuccess = function(req, res) {
    var taskId = req.param('taskId');
    var steps = {};

    steps.modifyTask = function(next) {
        taskDao.findOne({_id: taskId}, function(err, docs) {
            if(err) {
                logger.error('crm.task.customerLevelPromotionSuccess.findOne error:' +err.stack);
                next(err);
            }else {
                docs.doneTime = new Date();
                docs.done= true;
                docs.refObj.updateUser = {};
                docs.refObj.updateUser.id = req.session.user._id;
                docs.refObj.updateUser.username = req.session.user.username;
                docs.refObj.updateUser.realName = req.session.user.realName;
                docs.save(function(err, result) {
                    if(err) {
                        logger.error('crm.task.customerLevelPromotionSuccess.save error:'+ err.stack);
                        next(err);
                    }else {
                        sender.refreshTaskCountByUserIds(sioHelper.get(), docs.belongUser, {});
                        next(null, result._doc);
                    }
                })
            }
        })
    };

    steps.modifyCustomer = ['modifyTask', function(next, data) {
        var task = data.modifyTask;
        customerDao.modifyById(task.refObj.customer.id, {reviewStatus: dictionary.customerReviewStatus.reviewed, status: task.refObj.type}, next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.task.customerLevelPromotionReject error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '驳回成功!'}})
        }
    })
};

exports.getAllGroupLeaders = function(req, res) {
    var steps = {};
    var leaders = [];
    steps.users = function(next) {
        userDao.find({status: dictionary.userStatus.ok, position: {$in: [dictionary.userPosition.consultant, dictionary.userPosition.rm]}}, function(err, doc) {
            if(err) {
                logger.error('crm.task.getAllGroupLeaders.users err:' + err.stack);
            }else {
                next(null, _.pluck(doc, '_doc'));
            }
        });
    };

    steps.workGroups = function(next) {
        workGroupDao.find({iDel: {$ne: true}}, function(err, doc) {
            if(err) {
                logger.error('crm.task.getAllGroupLeaders.workGro error:' + err.stack);
            }else {
                next(null, _.pluck(doc, '_doc'));
            }
        });
    };

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error(err.stack);
            res.json(500, {err: err.stack});
        }else {
            var users = result.users;
            var workGroups = result.workGroups;
            _.each(workGroups, function(workGroup) {
                _.each(workGroup.workers, function(worker) {
                    if(_.contains(worker.workerRoles, dictionary.userPosition.leader)) {
                        var leader = _.findWhere(users, {_id: worker.userid});
                        if(!_.isEmpty(leader)) {
                            leaders.push(leader);
                        }
                    }
                })
            });
            res.json({leaders: leaders});
        }
    });
};

exports.convertLeader = function(req, res) {
    var data = req.body;
    taskDao.modify(parseInt(data.taskId), {$set: {belongUser: [parseInt(data.leaderId)]}}, function(err, result) {
        if(err) {
            logger.error('crm.task.convertLeader error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '转交成功!'}})
        }
    });
};

function translateRefObj(type, refObj, data) {
    if(!type || !refObj) {
        return;
    }
    switch(type) {
        case dictionary.taskType.customerActionPlan :
            translateCustomerActionPlan(refObj, data);
            break;
        case dictionary.taskType.callListRequest :
            translateCallListRequest(refObj, data);
            break;
        case dictionary.taskType.customerAuditRecord :
            translateCustomerAuditRecord(refObj, data);
            break;
        case dictionary.taskType.orderPRDSign :
            translateOrderPRDSign(refObj, data);
            break;
    }
}

function translateCustomerActionPlan(refObj, data) {
    if(refObj.actionDate) {
        refObj.actionDateStr = moment(refObj.actionDate).format('YYYY-MM-DD HH:mm');
    }
}

function translateCallListRequest(refObj, data) {
    if(refObj.ctime) {
        refObj.ctimeStr = moment(refObj.ctime).format('YYYY-MM-DD HH:mm');
    }
}

function translateCustomerAuditRecord(refObj, data) {
    if(refObj.callTime) {
        refObj.callTimeStr = moment(refObj.callTime).format('YYYY-MM-DD HH:mm');
    }
}

function translateOrderPRDSign(refObj, data) {

}

