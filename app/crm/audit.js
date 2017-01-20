var customerAuditRecordDao = require('../../db/crm/customerAuditRecordDao');
var customerActionPlanDao = require('../../db/crm/customerActionPlanDao');
var _ = require('underscore');
var dictModel = require('../portal/dictModel');
var dictionary = require('../../lib/dictionary');
var Pagination = require('../../lib/Pagination');
var taskDao = require('../../db/crm/taskDao');
var async = require('async');
var customerDao = require('../../db/crm/customerDao');
var userDao = require('../../db/upm/userDao');
var util = require('../../lib/utils');
var appCfg = require('../../app.cfg.js');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var moment = require('moment');
var G = require('../../lib/global.js');
var customerServiceRecordDao = require('../../db/crm/customerServiceRecordDao');
var sioHelper = require('../../lib/sioHelper');
var sender = require('../../routes/sender');



exports.listData = function(req, res) {
    var auditTypes = dictModel.getDictByType(dictionary.dictTypes.customerAuditRecordType);
    var auditStatus = dictModel.getDictByType(dictionary.dictTypes.customerAuditStatus);
    var claimStatus = dictModel.getDictByType(dictionary.dictTypes.claimStatus);
    auditTypes = _.without(auditTypes, _.findWhere(auditTypes, {key: dictionary.customerStatus.potential}));
    userDao.find({}, function(err, result) {
       if(err) {
           res.json(500, {err: err.stack});
       }else {
           res.json({auditTypes : auditTypes, auditStatus: auditStatus, users: result, claimStatus: claimStatus});
       }
    });
};

exports.list = function (req, res) {
    var pagination = new Pagination(req);
    var user = req.session.user;

    pagination = setListPagination(pagination);

    var steps = {};

    if(pagination.condition.claimStatus) {
        if(pagination.condition.claimStatus == dictionary.claimStatus.claimed) {
            steps.tasks = function(next) {
                taskDao.find({lock: user._id, type: dictionary.taskType.customerAuditRecord}, next);
            }
        }else {
            steps.tasks = function(next) {
                taskDao.find({lock: 0, type: dictionary.taskType.customerAuditRecord}, next);
            }
        }
        delete pagination.condition.claimStatus;
    }else {
        steps.tasks = function(next) {
            next(null, false);
        }
    }

    steps.customerAuditRecord = ['tasks', function(next, data) {
        if(data.tasks) {
            pagination.condition._id  = {$in: _.pluck(data.tasks, 'refId')};
        }
        customerAuditRecordDao.client.findByPage(pagination, next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('app.crm.audit.list'+err.stack);
            res.json({err : err.stack});
        }else {
            var docs = result.customerAuditRecord;
            async.map(docs, function(key, cb) {
                var steps = {};
                steps.task = function(next) {
                    taskDao.findTask({refId: key._id, type: dictionary.taskType.customerAuditRecord}, next);
                };

                steps.user = ['task', function(next, data) {
                    var task = data.task;
                    if(task) {
                        if(task.lock == 0) {
                            next(null, false);
                        }else {
                            userDao.findById(task.lock, next);
                        }
                    }else {
                        next(null, false);
                    }
                }];

                async.auto(steps, function(err, result) {
                    if(err) {
                        cb(err);
                    }else {
                        var customerStatus = dictModel.getDictByType(dictionary.dictTypes.customerStatus);
                        var customerStatusArray = _.without(_.pluck(customerStatus, 'key'), dictionary.customerStatus.potential, dictionary.customerStatus.bc20, dictionary.customerStatus.bc40);

                        if(_.contains(customerStatusArray, key.type)) {
                            key.type = 'other';
                        }
                        var type = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAuditRecordType, key.type);

                        if(key.audit.result) {
                            key._doc.resultName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAuditResult, key.audit.result).name;
                        }else {
                            key._doc.resultName = '待质检';
                        }
                        if(!_.isEmpty(type)) {
                            key._doc.typeName = type.name;
                        } else {
                            key._doc.typeName = '未知';
                        }
                        if(key.done) {
                            key._doc.doneName = '已完成';
                        }else {
                            key._doc.doneName = '未完成';
                        }
                        key._doc.auditorId = result.task.lock;
                        if(result.user) {
                            key._doc.auditorName = result.user.realName;
                        }else {
                            key._doc.auditorName = '未认领';
                        }
                        if(!_.isEmpty(key.call.content)) {
                            if(key.call.content.toString().length >= 70) {
                                key._doc.call.content = key._doc.call.content.substr(0, 40)+'...';
                            }
                        }
                        key._doc.callTime = moment(key.call.callTime).format('YYYY-MM-DD HH:mm');
                        cb(null, key);
                    }
                })
            }, function(err, result) {
                if(err) {
                    res.json(500, {err: err.stack});
                }else {
                    res.json({auditRecords : result, pagination : pagination});
                }
            });
        }
    })
};

exports.detail = function (req, res) {

    var id = parseInt(req.query.id);
    var user = req.session.user;

    var steps = {};

    steps.task = function(next) {
        taskDao.findTask({refId: id, type: dictionary.taskType.customerAuditRecord}, next);
    };

    steps.isClaimed = ['task', function(next, data) {
        var task = data.task;
        if(task.lock == 0) {
            next(null, false);
        }else {
            userDao.findById(task.lock, next);
        }
    }];

    steps.customerAuditRecord = function(next) {
        customerAuditRecordDao.find({_id : id}, next);
    };

    steps.customer = ['customerAuditRecord', function(next, data) {
        customerDao.findById(parseInt(data.customerAuditRecord.customer.customerId), next);
    }];

    async.auto(steps, function(err, docs) {
        if(err) {
            logger.error('audit.auditClaim:'+ err.stack);
            res.json({type: dictionary.resMsgType.error, body: '认领失败'});
        }else {
            var result = docs.customerAuditRecord;
            var customer = docs.customer;
            var customerInfo = '';
            var customerStatus = dictModel.getDictByType(dictionary.dictTypes.customerAuditRecordType);
            var customerStatusArray = _.without(_.pluck(dictModel.getDictByType(dictionary.dictTypes.customerStatus), 'key'), dictionary.customerStatus.potential, dictionary.customerStatus.bc20, dictionary.customerStatus.bc40);

            var type = result.type;

            if(_.contains(customerStatusArray, result.type)) {
                type = 'other';
            }

            if(result.audit.customerStatus){
                customerInfo= dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, result.audit.customerStatus);
            }

            var oldCustomerStatus = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, result.customer.status);
            if(!_.isEmpty(oldCustomerStatus)) {
                result._doc.oldCustomerStatusName = oldCustomerStatus.name;
            }else {
                result._doc.oldCustomerStatusName = '未知';
            }

            var newCustomerStatus = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, result.type);
            if(!_.isEmpty(newCustomerStatus)) {
                result._doc.newCustomerStatusName = newCustomerStatus.name;
            }else {
                result._doc.newCustomerStatusName = '未知';
            }

            var typeObj = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAuditRecordType, type);
            if(!_.isEmpty(typeObj)) {
                result._doc.typeName = typeObj.name;
            } else {
                result._doc.typeName = '未知';
            }

            if(result.done) {
                result._doc.doneName = '已完成';
            }else {
                result._doc.doneName = '未完成';
            }

            if(result.audit.result) {
                var resultName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAuditResult, result.audit.result);
                result._doc.resultName = resultName.name;
            }

            result._doc.callTime = moment(result.call.callTime).format('YYYY-MM-DD HH:mm');
            result._doc.telNoAbbr = result.customer.telNo;
            result._doc.customerStatus = customerInfo;
            result._doc.customerStatusList = customerStatus;
            var customerServiceRecordTypeList = dictModel.getDictByType(dictionary.dictTypes.customerServiceRecordType);
            if(!docs.isClaimed) {
                res.json({type: dictionary.resMsgType.success, auditRecord : result, userId: user._id, customer: customer, auditorId: docs.task.lock, callCenter : appCfg.callCenter, customerServiceRecordTypeList: customerServiceRecordTypeList});
            }else {
                res.json({type: dictionary.resMsgType.info, body: docs.isClaimed.realName+'已认领该客户', auditRecord : result, customer: customer, userId: user._id, auditorId: docs.task.lock, callCenter : appCfg.callCenter, customerServiceRecordTypeList: customerServiceRecordTypeList});
            }
        }
    });

};

exports.recordModal = function(req, res) {
    var ucid = req.param('ucid');
    res.json({ucid : ucid, callCenter : appCfg.callCenter});
}

exports.add = function(req, res){
    var id = parseInt(req.param('id'));
    var params = req.body;
    var user = req.session.user;
    var flag = parseInt(params.flag);
    delete params.flag;
    var comment = params.comment;
    var auditUser = {userid: user._id, username: user.username,  realName: user.realName};
    var audit = {};
    var result = '';
    var customerStatus = '';
    if(flag == 0){
        result = dictionary.auditResult.ok;
        customerStatus = params.customerStatus;
        audit = {result: result, customerStatus: customerStatus, auditTime: new Date(),
                 comment: comment, auditUser: auditUser};
    }else if(flag == 1){
        result = dictionary.auditResult.reject;
        customerStatus = dictionary.customerAuditStatus.reject;
        audit = {result: result, auditTime: new Date(),
                  comment: comment, auditUser: auditUser};
    }else {
        result = dictionary.auditResult.ok;
        audit = {auditTime: new Date(), result: result, auditUser: auditUser};
    }

    var steps = {};

    steps.findTask = function(next) {
        taskDao.findOne({_id: parseInt(params.taskId), type: dictionary.taskType.customerAuditRecord }, next);
    };

    steps.task = ['findTask', function(next, result) {
        taskDao.update({_id: parseInt(params.taskId), type: dictionary.taskType.customerAuditRecord}, {done : true, doneTime: new Date()}, function(err, doc) {
            if(err) {
                logger.error('crm.audit.add.task error: '+ err.stack);
                next(err);
            }else {
                sender.refreshTaskCountByUserIds(sioHelper.get(), result.findTask.belongUser, {});
                next(null, doc);
            }
        });
    }];

    steps.audit = function(next) {
        customerAuditRecordDao.modifyById({_id : id}, {audit: audit, done: true}, next);
    };

    steps.customer = function(next) {
        customerDao.findById(parseInt(params.customerId), next);
    };

    steps.modify = ['customer', function(next, data) {
        if(flag == 0) {
            customerDao.modifyById(parseInt(params.customerId), {status: customerStatus, auditStatus: result, code: G.ADD_CODE_PREFIX+params.customerId}, next);
        }else  if(flag == 1){
            if(!data.customer.status) {
                customerDao.modifyById(parseInt(params.customerId), {auditStatus: result, status: dictionary.customerStatus.potential}, next);
            }else {
                customerDao.modifyById(parseInt(params.customerId), {auditStatus: result}, next);
            }
        }else {
            next(null, false);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            if(flag == 0){
                res.json({msg :{type : dictionary.resMsgType.error, body : '质检通过失败'}});
            }else if(flag == 1){
                res.json({msg :{type : dictionary.resMsgType.error, body : '质检驳回失败'}});
            }else {
                res.json({msg :{type : dictionary.resMsgType.error, body : '质检失败'}});
            }
        }else {
            if(flag == 0){
                res.json({msg :{type : dictionary.resMsgType.succ, body : '质检通过'}, flag : flag});
            }else if(flag == 1){
                res.json({msg :{type : dictionary.resMsgType.succ, body : '质检驳回'}, flag : flag});
            }else {
                res.json({msg :{type : dictionary.resMsgType.succ, body : '质检成功'}, flag : flag});
            }
        }
    });
};

exports.getInfo = function(req, res) {
    userDao.find({}, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            res.json({users: result});
        }
    })
};

exports.auditClaim = function(req, res) {
    var params = req.body;
    var user = req.session.user;

    var steps = {};

    steps.task = function(next) {
        taskDao.findTask({refId: parseInt(params.refId), type: dictionary.taskType.customerAuditRecord }, next);
    };

    steps.isUpdate = ['task', function(next, data) {
        var task = data.task;
        if(task.lock == 0) {
            taskDao.update({refId: parseInt(params.refId), type: dictionary.taskType.customerAuditRecord }, {lock: user._id}, next);
        }else {
            next(null, false);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('audit.auditClaim:'+ err.stack);
            res.json({msg: {type: dictionary.resMsgType.error, body: '认领失败'}});
        }else {
            if(result.isUpdate) {
                var customerStatusArray = _.without(_.pluck(dictModel.getDictByType(dictionary.dictTypes.customerStatus), 'key'), dictionary.customerStatus.potential, dictionary.customerStatus.bc20, dictionary.customerStatus.bc40);
                if(_.contains(customerStatusArray, params.type)) {
                    res.json({msg: {type: dictionary.resMsgType.succ, body: '认领成功'}, flag: 1});
                }else {
                    res.json({msg: {type: dictionary.resMsgType.succ, body: '认领成功'}, flag: 0});
                }
            }else {
                res.json({msg: {type: dictionary.resMsgType.info, body: user.username+'已认领该客户'}});
            }
        }
    });
};

function setListPagination(pagination) {
    if(pagination.condition.auditStatus) {
        if(pagination.condition.auditStatus == 'auditing') {
            pagination.condition.audit = {$eq: null};
        }else {
            pagination.condition['audit.result'] = pagination.condition.auditStatus;
        }
        delete pagination.condition.auditStatus;
    }

    if(pagination.condition.startTime && !pagination.condition.endTime) {
        pagination.condition['call.callTime'] = {$gte: pagination.condition.startTime};
        delete pagination.condition.startTime;
    }else if(!pagination.condition.startTime && pagination.condition.endTime) {
        pagination.condition['call.callTime'] = {$lte: pagination.condition.endTime};
        delete pagination.condition.endTime;
    }else if(pagination.condition.startTime && pagination.condition.endTime){
        pagination.condition['call.callTime'] = {$gte: pagination.condition.startTime, $lte: pagination.condition.endTime};
        delete pagination.condition.startTime;
        delete pagination.condition.endTime;
    }

    if(pagination.condition.user) {
        pagination.condition['call.callUser.userid'] = pagination.condition.user;
    }

    delete pagination.condition.user;

    if(pagination.condition.auditType) {
        pagination.condition.type = pagination.condition.auditType;
    }
    delete pagination.condition.auditType;

    var customerStatusArray = _.without(_.pluck(dictModel.getDictByType(dictionary.dictTypes.customerStatus), 'key'), dictionary.customerStatus.potential, dictionary.customerStatus.bc20, dictionary.customerStatus.bc40);

    if(pagination.condition.type == 'other') {
        pagination.condition.type = {$in: customerStatusArray};
    }

    return pagination;
}

exports.actionPlanList = function(req, res) {
    var pagination = new Pagination(req);

    pagination.condition.type = dictionary.customerActionPlanType.meet;

    var steps = {};

    steps.users = function(next) {
        userDao.find({status: dictionary.userStatus.ok}, next);
    };

    steps.actionPlans = function(next) {
        customerActionPlanDao.client.findByPage(pagination, next);
    };

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            var users = _.pluck(result.users, '_doc');
            var actionPlans = _.pluck(result.actionPlans, '_doc');
            _.each(actionPlans, function(value) {
                var dict = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerActionPlanType, value.type);
                if(dict) {
                    value.typeName = dict.name;
                }else {
                    value.typeName = '未知';
                }
                value.actionDate = moment(value.actionDate).format('YYYY-MM-DD HH:mm');
                value.actionEndDate = moment(value.actionEndDate).format('YYYY-MM-DD HH:mm');
                value.rmName = _.findWhere(users, value.rm).realName;
                dict = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAddressType, value.addressType);
                if(dict) {
                    value.addressTypeName = dict.name;
                }else {
                    value.addressTypeName = '未知';
                }
                dict = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerMeetType, value.meetType);
                if(dict) {
                    value.meetTypeName = dict.name;
                }else {
                    value.meetTypeName ='未知';
                }
            });
            res.json({actionPlans: actionPlans, pagination: pagination});
        }
    });
};

exports.auditInfo = function(req, res) {
    var pagination = new Pagination(req);
    customerAuditRecordDao.client.findByPage(pagination, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            var audits = _.pluck(result, '_doc');
            _.each(audits, function(value) {
                value.callTime = moment(value.call.callTime).format('YYYY-MM-DD HH:mm');
                value.typeName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, value.type).name;
                if(value.audit.result) {
                    value.resultName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAuditStatus, value.audit.result).name;
                }else{
                    value.resultName = '未知';
                }
                if(value.audit.customerStatus) {
                    value.customerStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, value.audit.customerStatus).name;
                }else {
                    value.customerStatusName = '未知';
                }
                if(value.audit.comment) {
                    value.comment = value.audit.comment;
                    if(value.audit.comment.toString().length >= 40) {
                        value.commentStr = value.audit.comment.substr(0, 40)+'...';
                    }else {
                        value.commentStr = value.audit.comment;
                    }
                }else {
                    value.comment = '未知'
                }
            });
            res.json({audits: result, pagination: pagination})
        }
    });
};

exports.serviceRecordList = function(req, res) {
    var pagination = new Pagination(req);

    customerServiceRecordDao.client.findByPage(pagination, function(err, result) {
        if(err) {
            logger.error('crm.audit.serviceRecordList error:' +err.stack);
            res.json(500, {err: err.stack})
        }else {
            var serviceRecord = _.pluck(result, '_doc');
            _.each(serviceRecord, function(value) {
                if(value.type) {
                    value.typeName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerServiceRecordType, value.type).name;
                }else {
                    value.typeName = '其它服务';
                }
                if(value.customerStatus) {
                    value.customerStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, value.customerStatus).name;
                }else {
                    value.customerStatusName = '未知';
                }
                if(value.customerCallStatus) {
                    value.customerCallStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerCallStatus, value.customerCallStatus).name;
                }else {
                    value.customerCallStatusName = '未知';
                }
                if(value.customerAuditStatus) {
                    value.customerAuditStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAuditStatus, value.customerAuditStatus).name;
                }else {
                    value.customerAuditStatusName = '未知';
                }
                if(!_.isEmpty(value.investmentPreference)) {
                    value.investmentPreferenceName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerInvestmentPreferenceTypes, value.investmentPreference.type).name;
                }else {
                    value.investmentPreferenceName = '未知';
                }
                if(value.bodyMass) {
                    value.bodyMassName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerBodyMass, value.bodyMass).name;
                }else {
                    value.bodyMassName = '未知';
                }
                value.ctimeStr = moment(value.ctime).format('YYYY-MM-DD HH:mm');
            });
            res.json({customerServiceRecordList: serviceRecord, pagination: pagination});
        }
    });
};
