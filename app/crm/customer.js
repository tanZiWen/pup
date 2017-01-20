/**
 * author: Alex.wang
 */

var appCfg = require('../../app.cfg.js');
var tag = require('./tag');
var areaModel = require('../portal/areaModel');
var dictModel = require('../portal/dictModel');
var orgModel = require('../portal/orgModel');
var dictionary = require('../../lib/dictionary');
var _ = require('underscore');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var customerDao = require('../../db/crm/customerDao');
var customerAttachmentDao = require('../../db/crm/customerAttachmentDao');
var customerServiceRecordDao = require('../../db/crm/customerServiceRecordDao');
var customerActionPlanDao = require('../../db/crm/customerActionPlanDao');
var orderDao = require('../../db/crm/orderDao');
var taskDao = require('../../db/crm/taskDao');
var callListRequestDao = require('../../db/crm/callListRequestDao');var productDao = require('../../db/crm/productDao');
var workGroupDao = require('../../db/upm/workgroupDao');
var userDao = require('../../db/upm/userDao');
var Pagination = require('../../lib/Pagination');
var idg = require('../../db/idg');
var async = require('async');
var moment = require('moment');
var utils = require('../../lib/utils');
var customerAuditRecordDao = require('../../db/crm/customerAuditRecordDao');
var customerHistoryDao = require('../../db/crm/customerHistoryDao');
var customerHistory = require('./customerHistory');
var customerImplBatchDao = require('../../db/crm/customerImplBatchDao');
var G = require('../../lib/global.js');
var customerGiveupUserDao = require('../../db/crm/customerGiveupUserDao');
var customerAdvancedOpLogDao = require('../../db/crm/customerAdvancedOpLog');
var XLSX = require('xlsx');
var fs = fs = require('fs');
var byline = require('byline');

//var nodeExcel = require('excel-export-fast');

exports.list = function(req, res) {
    console.log('request customer list');
    var tagList = [];
    var statusList = [];
    var callStatusList =[];
    var auditStatusList = [];
    var reviewStatusList = [];
    var userPositionList = [];
    var user = req.session.user;

    var step = {};

    step.tag = function(next) {
        tag.tags(tag.type.CUSTOMER, function(err, docs) {
            if(err) {
                logger.error("customer.list_1:" + err.stack);
                next(err);
            } else {
                tagList = docs;
                next(null, tagList);
            }
        });
    };

    step.groups = function(next) {
        workGroupDao.find({workers: {$elemMatch: {userid:  user._id, workerRoles: {$in: ['leader']}}}}, function(err, docs) {
            if(err) {
                logger.error("customer.list_2:" + err.stack);
                next(err);
            } else {
                next(null, _.pluck(docs, "_doc"));
            }
        });
    };

    step.groupUsers = ['groups', function(next, result) {
        var groups = result.groups;
        var userIds = [];
        _.map(groups, function(group) {
            _.map(group.workers, function(worker) {
                if(_.contains(worker.workerRoles, dictionary.workerRole.worker)) {
                    userIds.push(worker.userid);
                }
            });
        });
        userDao.find({_id : {$in : userIds}}, function(err, docs) {
            if(err) {
                logger.error("customer.list_3:" + err.stack);
                next(err);
            } else {
                next(null, _.pluck(docs, "_doc"));
            }
        });
    }];

    async.auto(step, function(err, result) {

        statusList = dictModel.getListByTypes([
            dictionary.dictTypes.customerStatus
        ]);

        callStatusList = dictModel.getListByTypes([
            dictionary.dictTypes.customerCallStatus
        ]);

        auditStatusList = dictModel.getListByTypes([
            dictionary.dictTypes.customerAuditStatus
        ]);

        reviewStatusList = dictModel.getListByTypes([
            dictionary.dictTypes.customerReviewStatus
        ]);

        userPositionList.push(dictModel.getDictByTypeAndKey(dictionary.dictTypes.userPosition, dictionary.userPosition.consultant));
        userPositionList.push(dictModel.getDictByTypeAndKey(dictionary.dictTypes.userPosition, dictionary.userPosition.rm));

        res.json({
            tagList : tagList,
            auditStatusList: auditStatusList,
            callStatusList: callStatusList,
            statusList : statusList,
            reviewStatusList: reviewStatusList,
            userPosition:  user.position,
            groupUsers : result.groupUsers,
            userPositionList: userPositionList
        });
    });
};

exports.listData = function(req, res) {
    var pagination = new Pagination(req);
    var user = req.session.user;
    var range = pagination.condition.range;
    var userId = parseInt(user._id);
    var step = {};

    delete  pagination.condition.range;

    if(pagination.condition.telOrNameOrCode) {
        pagination.condition.$or = [{telNo: new RegExp(pagination.condition.telOrNameOrCode)}, {name: new RegExp(pagination.condition.telOrNameOrCode)}, {code: new RegExp(pagination.condition.telOrNameOrCode)}];
        delete pagination.condition.telOrNameOrCode;
    }
    pagination.condition.free = false;
    if(!pagination.condition.status) {
        pagination.condition.status = {$nin: [null, '']};
    }

    //按拨打时间逆序
    pagination.sort['lastCall.lastCallDate'] = -1;
    if(range == 'groupMembers') {
        step.info = function(next) {
            if(!pagination.condition.belongUser) {
                workGroupDao.find({workers: {$elemMatch: {userid:  userId, workerRoles: {$in: ['leader']}}}}, function(err, result) {
                    if(err) next(err);
                    else {
                        var userIds = [];
                        if(result) {
                            _.each(result, function(key, value) {
                                var userInfo = _.filter(key.workers,  function(work) {
                                    return work.userid != userId;
                                });
                                userIds.push(_.pluck(userInfo, 'userid'))
                            });
                        }
                        pagination.condition.belongUser = {$in: _.flatten(userIds)};
                        next(null, pagination);
                    }
                });
            } else {
                pagination.condition.belongUser = parseInt(pagination.condition.belongUser);
                next(null, pagination);
            }
        };
    }else if(range == 'groupAll') {
        step.info = function(next) {
            delete  pagination.condition.range;
            next(null, pagination);
        }
    }else if(range == dictionary.userPosition.consultant) {
        step.info = function(next) {
            pagination.condition.belongUser = userId;
            next(null, pagination);
        }
    }else if(range == dictionary.userPosition.rm) {
        step.info = function(next) {
            pagination.condition.manager = userId;
            next(null, pagination);
        }
    }else {
        step.info = function(next) {
            if(pagination.condition.$or) {
                var orCond = pagination.condition.$or;
                delete pagination.condition.$or;
                pagination.condition.$and = [{$or : orCond}, {$or : [{belongUser : userId}, {manager : userId}]}];
            } else {
                pagination.condition.$or = [{belongUser : userId}, {manager : userId}];
            }
            //pagination.condition.belongUser = userId;
            next(null, pagination);
        }
    }

    step.customerInfo = ['info', function(next, data) {
        if(data.info) {
            customerDao.client.findByPage(data.info, function(err, docs) {
                if(err) {
                    logger.error("customer.listData.customerInfo : " + err.stack);
                    next(err);
                } else {
                    next(null, _.pluck(docs, '_doc'))
                }
            });
        }else {
            next(null);
        }

    }];
    step.mergeSeller = ['customerInfo', function(next, data) {
        if(data.customerInfo) {
            userDao.client.loadRefFor(data.customerInfo, {refFieldName : 'belongUser', refDataFieldName : 'refSeller'}, function(err, docs) {
                if(err) {
                    logger.error("customer.listData.mergeSeller : " + err.stack);
                    next(err);
                } else {
                    next(null, docs);
                }
            })
        } else {
            next(null);
        }
    }];
    step.mergeManager = ['customerInfo', function(next, data) {
        if(data.customerInfo) {
            userDao.client.loadRefFor(data.customerInfo, {refFieldName : 'manager', refDataFieldName : 'refManager'}, function(err, docs) {
                if(err) {
                    logger.error("customer.listData.mergeManager : " + err.stack);
                    next(err);
                } else {
                    next(null, docs);
                }
            })
        } else {
            next(null);
        }
    }];
    async.auto(step, function(err, docs) {
        if(err) {
            res.json({err : err.stack});
        }else {
            var customerList = docs.customerInfo;
            var statusMap = dictModel.getMapByTypes([
                dictionary.dictTypes.customerStatus
            ]);
            for(var i in customerList) {
                var status = customerList[i].status;
                if(_.isEmpty(status)) {
                    customerList[i].statusName = '未知';
                }else {
                    if(_.isEmpty(statusMap[status])) {
                        customerList[i].statusName = '';
                        logger.error('[customer.listData] status is not exists : status=' + status);
                    }else {
                        customerList[i].statusName = statusMap[status].name;
                    }
                }
                var telNo = customerList[i].telNo;
                if(_.isEmpty(telNo)) {
                    customerList[i].telNoAbbr = '没留下电话'
                } else {
                    customerList[i].telNoAbbr = utils.phoneNoToAbbr(telNo)
                }
                if(!_.isEmpty(customerList[i].lastContact)) {
                    customerList[i].lastContact.dateStr = moment(customerList[i].lastContact.lastContactDate).fromNow();
                } else {
                    customerList[i].lastContact.dateStr = '还未联系哦';
                }
                if(!_.isEmpty(customerList[i].bodyMass)) {
                    customerList[i].bodyMassStr = dictModel.getDictByTypeAndKey(
                        dictionary.dictTypes.customerBodyMass,
                        customerList[i].bodyMass
                    ).name;
                } else {
                    customerList[i].bodyMassStr = '未知';
                }
                if(!_.isEmpty(customerList[i].investmentPreference)) {
                    customerList[i].investmentPreferenceStr = dictModel.getDictByTypeAndKey(
                        dictionary.dictTypes.customerInvestmentPreferenceTypes,
                        customerList[i].investmentPreference.type
                    ).name;

                } else {
                    customerList[i].investmentPreferenceStr = '未知';
                }
                if(_.isEmpty(customerList[i].email)) {
                    customerList[i].email = '';
                }
                if(!_.isEmpty(customerList[i].comment)) {
                    if(customerList[i].comment.toString().length >= 70) {
                        customerList[i].comment = customerList[i].comment.substr(0, 70)+'...';
                    }
                }
            }
            res.json({dataList : customerList, pagination : pagination, user : user});
        }
    });
};

exports.detail = function(req, res) {
    var id = req.param('id');
    var type = req.param('type');
    var steps = {};
    var user = req.session.user;

    var customerServiceRecordTypeList = dictModel.getDictByType(
        dictionary.dictTypes.customerServiceRecordType
    );


    steps.isLeader = function(next) {
        workGroupDao.find({
            workers: {
                $elemMatch: {
                    userid: user._id,
                    workerRoles: {$in: ['leader']}
                }
            }
        }, function (err, result) {
            if (err) {
                next(err);
            } else {
                var workerIds = [];
                _.each(result, function (value) {
                    workerIds = _.union(workerIds, _.pluck(value.workers, 'userid'));
                });
                next(null, workerIds);
            }
        });
    }

    steps.customer = ['isLeader', function(next, data) {
        var workerIds = data.isLeader;
        customerDao.findById(id, function(err, doc) {
            if(err) {
                console.log('err:', err.stack);
                next(err);
            } else {
                customer = doc._doc;
                if(user._id == customer.belongUser || user._id == customer.manager || _.contains(workerIds, customer.belongUser) || _.contains(workerIds, customer.manager)){
                    var dict = dictModel.getDictByTypeAndKey(
                        dictionary.dictTypes.customerInvestmentPreferenceTypes,
                        customer.investmentPreference.type
                    );
                    if(!_.isEmpty(dict)) {
                        customer.investmentPreferenceName = dict.name;
                    } else {
                        customer.investmentPreferenceName = '未知';
                    }

                    dict = dictModel.getDictByTypeAndKey(
                        dictionary.dictTypes.customerBodyMass,
                        customer.bodyMass
                    );
                    if(!_.isEmpty(dict)) {
                        customer.bodyMassName = dict.name;
                    } else {
                        customer.bodyMassName = '未知';
                    }

                    dict = dictModel.getDictByTypeAndKey(
                        dictionary.dictTypes.customerStatus,
                        customer.status
                    );
                    if(!_.isEmpty(dict)) {
                        customer.statusName = dict.name;
                    } else {
                        customer.statusName = '未知';
                    }

                    dict = dictModel.getDictByTypeAndKey(
                        dictionary.dictTypes.customerCallStatus,
                        customer.callStatus
                    );

                    if(!_.isEmpty(dict)) {
                        customer.callStatusName = dict.name;
                    } else {
                        customer.callStatusName = '未知';
                    }

                    dict = dictModel.getDictByTypeAndKey(
                        dictionary.dictTypes.customerAuditStatus,
                        customer.auditStatus
                    );

                    if(!_.isEmpty(dict)) {
                        customer.auditStatusName = dict.name;
                    } else {
                        customer.auditStatusName = '未知';
                    }

                    dict = dictModel.getDictByTypeAndKey(
                        dictionary.dictTypes.customerLevel,
                        customer.level
                    );
                    if(!_.isEmpty(dict)) {
                        customer.levelName = dict.name;
                    } else {
                        customer.levelName = '未知';
                    }
                    var tagStr = '';
                    for(var i = 0; i < customer.tags.length; i++) {
                        if(i == 0) {
                            tagStr += customer.tags[i];
                        } else {
                            tagStr += ',' + customer.tags[i];
                        }
                    }
                    customer.tagStr = tagStr;
                    next(null, customer);
                }else {
                    next(null, 'error');
                }
            }
        });
    }];

    steps.mergeSeller = ['customer', function(next, data) {
        if(!_.isEmpty(data.customer) && data.customer != 'error') {
            userDao.client.loadRefFor(data.customer, {refFieldName : 'belongUser', refDataFieldName : 'refSeller'}, function(err, docs) {
                if(err) {
                    logger.error("customer.detail.mergeSeller : " + err.stack);
                    next(err);
                } else {
                    next(null, docs);
                }
            })
        } else {
            next(null);
        }
    }];
    steps.mergeManager = ['customer', function(next, data) {
        if(!_.isEmpty(data.customer) && data.customer != 'error') {
            userDao.client.loadRefFor(data.customer, {refFieldName : 'manager', refDataFieldName : 'refManager'}, function(err, docs) {
                if(err) {
                    logger.error("customer.detail.mergeManager : " + err.stack);
                    next(err);
                } else {
                    next(null, docs);
                }
            })
        } else {
            next(null);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({
                err : {msg : '查询客户信息异常'}
            });
        } else {
            if(result.customer != 'error') {
                res.json({
                    customer : result.customer,
                    customerServiceRecordTypeList : customerServiceRecordTypeList,
                    user : req.session.user,
                    type: type
                });
            }else {
                res.json({});
            }

        }
    });
};

/**
 * 外拨列表查询
 * @param req
 * @param res
 */
exports.callList = function(req, res) {
    var tagList = [];
    var callStatusList = [];
    var auditStatusList = [];
    tag.tags(tag.type.CUSTOMER, function(err, docs) {
        if(err)
            logger.error(err.stack);
        else
            tagList = docs;


        callStatusList = dictModel.getListByTypes([
            dictionary.dictTypes.customerCallStatus
        ]);

        auditStatusList = dictModel.getListByTypes([
            dictionary.dictTypes.customerAuditStatus
        ]);

        res.json({ tagList : tagList, auditStatusList: auditStatusList, callStatusList: callStatusList});
    });
};

/**
 * 外拨列表数据
 * @param req
 * @param res
 */
exports.callListData = function(req, res) {
    var pagination = makeCallListPagination(req);
    var steps = {};

    steps.impBatch = function(next) {
        if(pagination.condition.impBatchName && pagination.condition.impBatchName != '') {
            customerImplBatchDao.find({name: new RegExp(pagination.condition.impBatchName)}, next);
        }else {
            next(null, false);
        }
        delete pagination.condition.impBatchName;
    };

    steps.customers = ['impBatch', function(next, data){
        if(data.impBatch) {
            var impBatchId = _.pluck(data.impBatch, '_id');
            pagination.condition.ImpBatchId = {$in: impBatchId};
        }
        customerDao.client.findByPage(pagination, next);
    }];

    async.auto(steps, function(err, result){
        if(err) {
            logger.error('customer.callListData err:' + err.stack);
            res.json({err : err.stack});
        }else {
            var callList = _.pluck(result.customers, '_doc');
            var statusMap = dictModel.getMapByTypes([
                dictionary.dictTypes.customerStatus
            ]);
            var callStatusMap = dictModel.getMapByTypes([
                dictionary.dictTypes.customerCallStatus
            ]);
            var auditStatusMap = dictModel.getMapByTypes([
                dictionary.dictTypes.customerAuditStatus
            ]);
            for(var i in callList) {
                var status = callList[i].status;
                if(_.isEmpty(status)) {
                    callList[i].statusName = '未知';
                }else {
                    callList[i].statusName = statusMap[status].name;
                }
                var callStatus = callList[i].callStatus;
                if(_.isEmpty(callStatus)) {
                    callList[i].callStatusName = '未知';
                }else {
                    callList[i].callStatusName = callStatusMap[callStatus].name;
                }
                var auditStatus = callList[i].auditStatus;
                if(_.isEmpty(auditStatus)) {
                    callList[i].auditStatusName = '未知';
                }else {
                    callList[i].auditStatusName = auditStatusMap[auditStatus].name;
                }
                //callList[i].statusName = statusMap[callList[i].status].name;
                if(callList[i].lastCall && callList[i].lastCall.lastCallDate) {
                    callList[i].lastCall.lastCallDateStr = moment(callList[i].lastCall.lastCallDate).fromNow();
                }
            }
            res.json({dataList : callList, pagination : pagination});
        }
    });
};

/**
 * 获取外拨列表中下一个客户
 * @param req
 * @param res
 */
exports.callListNext = function(req, res) {
    var pagination = makeCallListPagination(req);
    var currentIndexInPage = req.param('currentIndexInPage');
    var status = req.param('status');
    var callStatus = req.param('callStatus');
    var conditionCallStatus = req.param('conditionCallStatus');
    var nextIndexInPage = 0;
    if(currentIndexInPage == '') {
        currentIndexInPage = 0;
    }
    currentIndexInPage = parseInt(currentIndexInPage);
    if((currentIndexInPage + 1) == pagination.pageCount) {
        pagination.currentPage += 1;
        nextIndexInPage = 0;
    } else {
        if((_.isEmpty(status) && _.isEmpty(callStatus) && (!pagination.condition.callStatus || pagination.condition.callStatus == conditionCallStatus))){
            nextIndexInPage = currentIndexInPage + 1;
        }else {
            nextIndexInPage = currentIndexInPage;
        }
    }
    customerDao.client.findByPage(pagination, function(err, docs) {
        if(err) {
            res.json({err : err.stack});
        } else {
            if(docs.length <= nextIndexInPage) {
                res.json({msg : {type : dictionary.resMsgType.waring, body : '已到当前列表末尾'}});
            }else {
                res.json({
                    currentIndexInPage : nextIndexInPage,
                    customer : docs[nextIndexInPage]._doc,
                    pagination : pagination
                });
            }
        }
    });
};

function makeCallListPagination(req) {
    var pagination = new Pagination(req);
    if(pagination.condition.telOrName) {
        pagination.condition.$or = [{telNo: new RegExp(pagination.condition.telOrName)}, {name: new RegExp(pagination.condition.telOrName)}];
        delete pagination.condition.telOrName;
    }
    pagination.condition.belongUser = req.session.user._id;
    pagination.condition.free = false;
    pagination.sort['_id'] = -1;
    pagination.sort['belongUser'] = 1;
    return pagination;
}

/**
 * 外拨客户详细信息
 * @param req
 * @param res
 */
exports.callListDetail = function(req, res) {
    var id = req.param('id');
    var callCenterName = req.param('callCenterName');
    var investmentPreferenceList = [];
    var bodyMassList = [];
    var steps = {};
    var customer = {};
    var user = req.session.user;
    steps.customer = function(next) {
        customerDao.findById(id, function(err, doc) {
            if(err) {
                logger.error(err.stack);
                next(err);
            } else {
                try {
                    customer = doc._doc;
                    if(user._id == customer.belongUser || user._id == customer.manager) {
                        var statusMap = dictModel.getMapByTypes([
                            dictionary.dictTypes.customerStatus
                        ]);
                        var callStatusMap = dictModel.getMapByTypes([
                            dictionary.dictTypes.customerCallStatus
                        ]);
                        var auditStatusMap = dictModel.getMapByTypes([
                            dictionary.dictTypes.customerAuditStatus
                        ]);
                        if(!_.isEmpty(customer.lastCall) && customer.lastCall.lastCallDate) {
                            customer.lastCall.dateStr = moment(customer.lastCall.lastCallDate).fromNow();
                        } else {
                            customer.lastCall.dateStr = '';
                        }
                        var status = customer.status;
                        if(_.isEmpty(status)) {
                            customer.statusName = '未知';
                        }else {
                            if(statusMap[customer.status]) {
                                customer.statusName = statusMap[customer.status].name;
                            } else {
                                customer.statusName = '未知';
                            }

                        }
                        var callStatus = customer.callStatus;
                        if(_.isEmpty(callStatus)) {
                            customer.callStatusName = '未知';
                        }else {
                            if(callStatusMap[customer.callStatus]) {
                                customer.callStatusName = callStatusMap[customer.callStatus].name;
                            } else {
                                customer.callStatusName = '未知';
                            }
                        }
                        var auditStatus = customer.auditStatus;
                        if(_.isEmpty(auditStatus)) {
                            customer.auditStatusName = '未知';
                        }else {
                            if(auditStatusMap[customer.auditStatus]) {
                                customer.auditStatusName = auditStatusMap[customer.auditStatus].name;
                            } else {
                                customer.auditStatusName = '未知';
                            }
                        }
                        customer.telNoAbbr = customer.telNo.toString();
                        //customer.telNo = escape(utils.phoneNoEncrypt(customer.telNo));
                        console.log('encrypt telNo : ' + customer.telNo);
                        investmentPreferenceList = dictModel.getDictByType(dictionary.dictTypes.customerInvestmentPreferenceTypes) || [];
                        bodyMassList = dictModel.getDictByType(dictionary.dictTypes.customerBodyMass) || [];
                        next(null, {
                            investmentPreferenceList : investmentPreferenceList,
                            bodyMassList : bodyMassList,
                            customer : customer
                        });
                    }else {
                        next(null, {});
                    }
                }catch(e) {
                    logger.error(e.stack);
                    next(e);
                }

            }
        });
    };
    steps.tag = function(next) {
        tag.tags(tag.type.CUSTOMER, function(err, docs) {
            if(err) {
                logger.error(err.stack);
            } else {
                next(null, docs);
            }
        });
    };
    async.parallel(steps, function(err, result) {
        if(err) {
            res.json({
                err : {msg : '查询客户信息异常'}
            });
        } else {
            var tagsList = '';
            for(var i in result.tag) {
                if(i == 0) {
                    tagsList += result.tag[i].name;
                } else {
                    tagsList += ',' + result.tag[i].name;
                }
            }
            res.json({
                sexList: dictModel.getDictByType(dictionary.dictTypes.sex),
                houseInfos: dictModel.getDictByType(dictionary.dictTypes.customerHouseInfos),
                investmentPreferences: dictModel.getDictByType(dictionary.dictTypes.customerInvestmentPreferenceTypes),
                professionTypes: dictModel.getDictByType(dictionary.dictTypes.customerProfessionTypes),
                investmentTimePreferences: dictModel.getDictByType(dictionary.dictTypes.customerInvestmentTimePreference),
                venturePreferences: dictModel.getDictByType(dictionary.dictTypes.customerVenturePreference),
                bodyMassList: dictModel.getDictByType(dictionary.dictTypes.customerBodyMass),
                statusList: _.without(dictModel.getDictByType(dictionary.dictTypes.customerStatus), _.findWhere(dictModel.getDictByType(dictionary.dictTypes.customerStatus), {key: 'potential'})),
                customer : result.customer.customer,
                investmentPreferenceList : result.customer.investmentPreferenceList,
                tagsList : tagsList,
                callCenterName : callCenterName,
                user : req.session.user,
                callCenter : appCfg.callCenter,
                isCustomer : isCustomer(customer)
            });
        }
    });
};

/**
 * 外拨信息保存
 * @param req
 * @param res
 */
exports.callListSave = function(req, res) {
    var currentDate = new Date();
    var steps = {};
    var customerImplBatchId = null;
    var customerCallStatus = _.without(_.values(dictionary.customerCallStatus), dictionary.customerCallStatus.connected, dictionary.customerCallStatus.proxyConnected);
//    console.log(req.body);
    // 保存客户信息
    steps.customerHistory = function(next) {
        customerHistory.backupCustomer({
            customerId : req.body._id,
            user : req.session.user,
            operateType : dictionary.customerHistoryOperateType.call
        }, next);
    };
    steps.customer = ['customerHistory', function(next) {
        customerDao.findById(req.body._id, function(err, doc) {
            if(err) {
                logger.error('customer.callListSave.customer_1 : ' + err.stack);
                next(err);
            } else {
                try {
                    var lastContact = {};
                    customerImplBatchId = doc.ImpBatchId;
                    lastContact.lastContactDate = currentDate;
                    lastContact.lastContactUID = req.session.user._id;
                    lastContact.lastContactUName = req.session.user.username;
                    lastContact.type = dictionary.customerServiceRecordType.pureCall;
                    lastContact.product = req.body.callProduct;
                    lastContact.comment = req.body.callComment;
                    doc.lastContact = lastContact;
                    var lastCall = {};
                    lastCall.lastCallDate = currentDate;
                    lastCall.lastCallUID = req.session.user._id;
                    lastCall.lastCallUName = req.session.user.username;
                    lastCall.type = dictionary.customerServiceRecordType.pureCall;
                    lastCall.product = req.body.callProduct;
                    lastCall.comment = req.body.callComment;
                    doc.lastCall = lastCall;
                    doc.name = req.body.name;
                    doc.sex = req.body.sex;
                    doc.tags = req.body.callTags
                    doc.birthday = req.body.birthday;
                    doc.sex = req.body.sex;
                    doc.wechatNo = req.body.wechatNo;
                    doc.houseInfo = req.body.houseInfo;
                    doc.profession = {type: req.body.professionType, describe: req.body.professionDescribe};
                    doc.workAddress = req.body.workAddress;
                    doc.carType = req.body.carType;
                    doc.investmentPreference = {type: req.body.investmentPreferenceType, describe: req.body.investmentPreferenceDescribe};
                    doc.investmentTimePreference = req.body.investmentTimePreference;
                    doc.venturePreference = req.body.venturePreference;
                    doc.isLikeAction = req.body.isLikeAction;
                    doc.callTimes = doc.callTimes + 1;
                    doc.investmentPreference = {type: req.body.investmentPreferenceType, describe: req.body.investmentPreferenceDescribe};
                    doc.bodyMass = req.body.bodyMass;
                    doc.email = req.body.email;
                    doc.fundBackTime = req.body.fundBackTime;
                    doc.noInvestmentReason = req.body.noInvestmentReason;
                    doc.comment = req.body.callComment;
                    if(req.body.type == dictionary.customerStatus.potential ) {
                        doc.code = G.ADD_CODE_PREFIX + doc._id;
                        doc.status = req.body.type;
                        doc.callStatus = dictionary.customerCallStatus.connected;
                    } else if(req.body.type == dictionary.customerStatus.bc20 || req.body.type == dictionary.customerStatus.bc40) {
                        doc.auditStatus = dictionary.customerAuditStatus.auditing;
                        doc.callStatus = dictionary.customerCallStatus.connected;
                        doc.status = dictionary.customerStatus.potential;
                    } else if(_.contains(['', null, undefined], doc.status) && _.contains(customerCallStatus, req.body.type)) {
                        doc.free = true;
                        doc.callStatus = req.body.type;
                    } else if(req.body.type == 'save' || req.body.type == 'next') {
                    } else {
                        doc.callStatus = req.body.type;
                    }
                    doc.uuserid = req.session.user._id;
                    doc.uusername = req.session.user.username;
                    doc.urealName = req.session.user.realName;
                    doc.utime = currentDate;
                    if(req.body.callNextDays) {
                        if(!doc.unDoActionPlanCount) {
                            doc.unDoActionPlanCount = 0;
                        }
                        ++doc.unDoActionPlanCount;
                    }
                    //console.log(doc);
                    doc.save(function(err, doc, numberAffected) {
                        if(err) {
                            logger.error('customer.callListSave.customer_2 : ' + err.stack);
                            next(err);
                        } else {
                            next(null, doc._doc);
                        }
                    });
                } catch(err) {
                    logger.error('customer.callListSave.customer_3 : ' + err.stack);
                    next(err);
                }

            }
        });
    }];

    steps.updateCustomerHistory = ['customer', function(next, data) {
        var customerHistory = data.customerHistory;
        var customer = data.customer;
        var changeColumns = updateCustomerHistory(customer, customerHistory);
        customerHistoryDao.modifyById(customerHistory._id, {changeColumns: changeColumns, changeCustomer: customer}, function(err, doc) {
            if(err) {
                logger.error('customer.callListSave.updateCustomerHistory : ' + err.stack);
                next(err);
            } else {
                next(null, doc);
            }
        });
    }];
    //修改customerImplBatch
    if(_.contains(customerCallStatus, req.body.type )) {
        steps.customerReassign = ['customer', function(next, data) {
            if(_.contains(['', null, undefined], data.customer.status )) {
                customerGiveupUserDao.client.add({
                    customerId : req.body._id,
                    userId : req.session.user._id
                }, idg, function(err, doc) {
                    if(err) {
                        logger.error('customer.callListSave.customerReassign : ' + err.stack);
                        next(err);
                    } else {
                        next(null, doc._doc);
                    }
                });
            }else {
                next(null, false);
            }
        }];

        steps.customerImplBatch = ['customer', function(next, data) {
            if(_.contains(['', null, undefined], data.customer.status )) {
                if(customerImplBatchId != null) {
                    var subTaskSteps = {};
                    subTaskSteps.totalCount = function(subCb) {
                        customerDao.client.count({ImpBatchId: parseInt(customerImplBatchId), free : true}, subCb);
                    }

                    subTaskSteps.unbcCount = function(subCb) {
                        customerDao.client.count({ImpBatchId: parseInt(customerImplBatchId), status : {$in : [null, '', dictionary.customerStatus.potential]}, free : true}, subCb);
                    }

                    subTaskSteps.bcCount = function(subCb) {
                        customerDao.client.count({ImpBatchId: parseInt(customerImplBatchId), status : {$in : ['bc20', 'bc40', 'bc60']}, free : true}, subCb);
                    }

                    subTaskSteps.updateBatchCount = ['totalCount', 'unbcCount', 'bcCount', function(subCb, data) {
                        var totalCount = data.totalCount;
                        var bcCount = data.bcCount;
                        var unbcCount = data.unbcCount;
                        customerImplBatchDao.update({_id : parseInt(customerImplBatchId)}, {freeCount : totalCount, availableCount: totalCount, bcCount: bcCount, unbcCount: unbcCount}, subCb);
                    }];

                    async.auto(subTaskSteps, next);
                }
                else {
                    next(null);
                }
            }else {
                next(null, false);
            }
        }];
    }
    // 保存客户服务记录
    steps.customerServiceRecord = ['customer', function(next, result) {
        var serviceRecord = {};
        if(req.body.type == dictionary.customerStatus.potential ) {
            serviceRecord.customerStatus = req.body.type;
            serviceRecord.customerCallStatus = dictionary.customerCallStatus.connected;
        }else if(req.body.type == dictionary.customerStatus.bc20 || req.body.type == dictionary.customerStatus.bc40) {
            serviceRecord.customerAuditStatus = dictionary.customerAuditStatus.auditing;
            serviceRecord.customerCallStatus = dictionary.customerCallStatus.connected;
        }else if(req.body.type == 'save' || req.body.type == 'next') {
        }else {
            serviceRecord.customerCallStatus = req.body.type;
        }
        serviceRecord.type = dictionary.customerServiceRecordType.pureCall;
        serviceRecord.customerId = req.body._id;
        serviceRecord.product = req.body.callProduct;
        serviceRecord.investmentPreference = {type: req.body.investmentPreferenceType, describe: req.body.investmentPreferenceDescribe};
        serviceRecord.bodyMass = req.body.bodyMass;
        serviceRecord.comment = req.body.callComment;
        serviceRecord.cuserid = req.session.user._id;
        serviceRecord.cusername = req.session.user.username;
        serviceRecord.crealName = req.session.user.realName;
        serviceRecord.ctime = currentDate;
        if(req.body.recording)
            serviceRecord.recording = req.body.recording;
        customerServiceRecordDao.client.add(serviceRecord, idg, function(err, doc) {
            if(err) {
                logger.error('customer.callListSave.customerServiceRecord : ' + err.stack);
                next(err);
            } else {
                next(null, doc);
            }
        });
    }];
    if(req.body.callNextDays) {
        // 生成拨打行动计划
        steps.customerActionPlan = function(next) {
            var actionPlan = {};
            actionPlan.type = dictionary.customerServiceRecordType.call;
            actionPlan.customerId = req.body._id;
            var actionDate = new Date();
            if(req.body.callNextDays) {
                actionDate.setDate(actionDate.getDate() + parseInt(req.body.callNextDays));
            }
            actionPlan.actionDate = actionDate;
            actionPlan.actionEndDate = actionDate;
            actionPlan.remind = req.body.callRemind == 'on';
            actionPlan.comment = req.body.callComment;
            actionPlan.cuserid = req.session.user._id;
            actionPlan.cusername = req.session.user.username;
            actionPlan.crealName = req.session.user.crealName;
            actionPlan.cime = currentDate;
            actionPlan.uuserid = req.session.user._id;
            actionPlan.uusername = req.session.user.username;
            actionPlan.urealName = req.session.user.crealName;
            actionPlan.utime = currentDate;
            customerActionPlanDao.client.add(actionPlan, idg, function(err, doc) {
                if(err) {
                    logger.error('customer.callListSave.customerActionPlan : ' + err.stack);
                    next(err);
                } else {
                    next(null, doc);
                }
            });
        };

        steps.planTaskId = function(next){
            idg.next(taskDao.client.collection.name, next);
        }

        steps.planTask = ['planTaskId', 'customer', 'customerActionPlan', function(next, result) {
            var task = {};
            task._id = parseInt(result.planTaskId.toString());
            task.refId = result.customerActionPlan._id;
            task.type = dictionary.taskType.customerActionPlan;
            task.belongUser = req.session.user._id;
            task.done = false;
            task.ctime = Date.now();
            task.refObj = {};
            task.refObj.type = result.customerActionPlan.type;
            task.refObj.actionDate = result.customerActionPlan.actionDate;
            task.refObj.comment = result.customerActionPlan.comment;
            task.refObj.customer = {};
            task.refObj.customer.id = result.customer._id;
            task.refObj.customer.name = result.customer.name;
            taskDao.add(task, function(err, doc) {
                if(err) {
                    logger.error('customer.callListSave.planTask : ' + err.stack);
                    next(err);
                } else {
                    next(null, doc);
                }
            });
        }];
    }

    if(req.body.type == dictionary.customerStatus.bc20 || req.body.type == dictionary.customerStatus.bc40) {

        steps.auditTaskId = function(next, result) {
            idg.next(taskDao.client.collection.name, function(err, result) {
                if(err) {
                    logger.error('customer.callListSave.taskId : ' + err.stack);
                    next(err);
                } else {
                    next(null, parseInt(result.toString()))
                }
            });
        };

        steps.audit = ['auditTaskId', 'customer', function(next, result) {
            var audit = {};
            audit.type = req.body.type;
            audit.taskId = result.auditTaskId;
            audit.customer = {};
            audit.customer.customerId = result.customer._id;
            audit.customer.name = result.customer.name;
            audit.customer.telNo = result.customer.telNo;
            audit.customer.wechatNo = req.body.wechatNo;
            audit.call = {};
            audit.call.callTime = Date.now();
            audit.call.content = req.body.callComment;
            audit.call.callUser = {};
            audit.call.callUser.userid = req.session.user._id;
            audit.call.callUser.username = req.session.user.username;
            audit.call.callUser.realName = req.session.user.realName;
            audit.done = false;
            if(req.body.recording)
                audit.recording = req.body.recording;
            customerAuditRecordDao.client.add(audit, idg, function(err, doc) {
                if(err) {
                    logger.error('customer.callListSave.audit : ' + err.stack);
                    next(err);
                } else {
                    next(null, doc._doc);
                }
            });

        }];

        steps.auditor = function(next) {
            userDao.findAuditor(function(err, doc) {
                if(err) {
                    logger.error('customer.callListSave.auditor : ' + err.stack);
                    next(err);
                } else {
                    next(null, _.pluck(doc, '_doc'));
                }
            });
        };

//        steps.taskId = function(next){
//            idg.next(taskDao.client.collection.name, next);
//        }

        steps.auditTask = ['auditTaskId', 'audit', 'auditor', function(next, result) {
            var task = {};
            task._id = parseInt(result.auditTaskId);
            task.refId = result.audit._id;
            task.type = dictionary.taskType.customerAuditRecord;
            //console.log(result.auditor);
            if(result.auditor) {
                task.belongUser = _.pluck(result.auditor, '_id');
            }
            task.done = false;
            task.ctime = Date.now();
            task.refObj = {};
            task.refObj.type = result.audit.type;
            task.refObj.callTime = Date.now();
            task.refObj.customer = {};
            task.refObj.customer.id = req.body._id;
            task.refObj.customer.name = result.customer.name;
            task.refObj.customer.status = req.body.callStatus;
            task.refObj.callUser = {};
            task.refObj.callUser.id = req.session.user._id;
            task.refObj.callUser.username = req.session.user.username;
            task.refObj.callUser.realName = req.session.user.realName;
            taskDao.add(task, function(err, doc) {
                if(err) {
                    logger.error('customer.callListSave.auditTask : ' + err.stack);
                    next(err);
                } else {
                    next(null, doc._doc);
                }
            });
        }];
    }

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({msg : {type : dictionary.resMsgType.error, body : '系统异常，提交外拨信息失败'}});
        } else {
            res.json({
                msg : {type : dictionary.resMsgType.succ, body : '提交外拨信息成功'},
                customer : result.customer,
                customerServiceRecord : result.customerServiceRecord,
                customerActionPlan : result.customerActionPlan
            });
        }
    })
};

exports.dataManage = function (req, res) {
    var data = {};
    callListRequestDao.count({status : dictionary.callListRequestStatus.unassigned}, function(err, count) {
        data.areas = areaModel.getAreas();
        data.dataLevels = dictModel.getDictByType(dictionary.dictTypes.customerDataLevel);
        data.requestCount = count;
        data.orgs = orgModel.getRootOrgs();
        res.json(data);
    })
};

exports.importForm = function (req, res) {
    res.render('crm/customer/import', { title: 'CRM' });
};

exports.requestList = function (req, res) {
    var pagination = new Pagination(req);
    pagination.condition = {status : dictionary.callListRequestStatus.unassigned}
    callListRequestDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            _.each(docs, function(request) {
                var dataLevel = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerDataLevel, request.level);
                var status = dictModel.getDictByTypeAndKey(dictionary.dictTypes.callListRequestStatus, request.status);
                if(dataLevel) {
                    request._doc.levelName = dataLevel.name;
                } else {
                    request._doc.orgName = "";
                }
                if(status) {
                    request._doc.statusName = status.name;
                } else {
                    request._doc.statusName = "";
                }
            });
            res.json({data : docs, pagination : pagination});
        }
    });
};

exports.assignMenu = function(req, res) {
    var data = {};
    data.dataLevels = dictModel.getDictByType(dictionary.dictTypes.customerDataLevel);
    res.json(data);
};

exports.toAssign = function(req, res) {
    var data = {};
    data.areas = areaModel.getAreas();
    data.orgs = orgModel.getRootOrgs();
    data.dataLevels = dictModel.getDictByType(dictionary.dictTypes.customerDataLevel);
    if(req.query.requestId && req.query.requestId != undefined) {
        data.requestId = req.query.requestId;
    }
    if(req.query.batchName && req.query.batchName != undefined) {
        data.batchName = req.query.batchName;
    }
    res.json(data);
};

exports.importMenu = function(req, res) {
    var data = {};
    data.areas = areaModel.getAreas();
    data.orgs = orgModel.getRootOrgs();
    data.dataLevels = dictModel.getDictByType(dictionary.dictTypes.customerDataLevel);
    res.json(data);
};

exports.historyMenu = function(req, res) {
    var data = {};
    userDao.find({}, function(err, users) {
        if(err) {
            data.users = [];
        } else {
            data.users = users;
        }
        data.areas = areaModel.getAreas();
        res.json(data);
    });
};

exports.recycleMenu = function(req, res) {
    var user = req.session.user;

    var operRole = '';
    if(user.position == dictionary.userPosition.dm) {
        operRole = 'dm';
        res.json({role : operRole});
    } else {
        workGroupDao.findOne({'workers.userid' : user._id, 'workers.workerRoles' : {$all : [dictionary.workerRole.leader]}}, function(err, doc) {
            if(!err && doc != null) {
                operRole = dictionary.workerRole.leader;
                res.json({role : operRole});
            } else {
                res.json({role : operRole});
            }
        });
    }
};

exports.recycleDM = function(req, res) {
    var user = req.session.user;

    var busStatusList = dictModel.getDictByType(dictionary.dictTypes.customerStatus);
    var operRole = '';
    if(user.position == dictionary.userPosition.dm) {
        workGroupDao.findAll(function(err, docs) {
            operRole = user.position;
            if(err) {
                res.json({workGroups : [], statusList : busStatusList, role : operRole});
            } else {
                //console.log({workGroups : docs, statusList : busStatusList, role : operRole});
                res.json({workGroups : docs, statusList : busStatusList, role : operRole});
            }
        });
    } else {
        res.json({});
    }
};

exports.recycleData = function(req, res) {

   var customerIds = _.has(req.body, 'customerIds') ? req.body.customerIds : [];
   var nocalUserIds = _.has(req.body, 'userIds') ? req.body.userIds : [];
   var user = req.session.user;
   if(customerIds != undefined) {
       var steps = {};
       var filterCustomerIds = [];
       _.each(customerIds, function(customerId) {
           filterCustomerIds.push(parseInt(customerId));
       });
       var filterNocalUserIds = [];
       _.each(nocalUserIds, function(userId) {
           filterNocalUserIds.push(parseInt(userId));
       });
       steps.batchList = function(next) {
           customerDao.client.aggregate(
               {$match: {free : false, $or : [{_id : {$in : filterCustomerIds}, status: {$nin: [null, '']}}, {belongUser : {$in : filterNocalUserIds}, status : {$in: [null, '']}}]}},
               {$group:{_id: '$ImpBatchId', count: {$sum: 1}}}
           ).exec(function(err, docs) {
               if(err) {
                   next(null, {});
               } else {
                   var batchMap = {};
                   _.each(docs, function(doc) {
                       batchMap[doc._id] = doc.count;
                   });

                   next(null, batchMap);
               }
           });
       };

       steps.recycleData = function(next) {
           var updator = {free: true,
               $unset: {belongUser: 1, assignUser: 1, assignTime: 1}};

           updator.uuserid = user._id;
           updator.uusername = user.username;
           updator.urealName = user.crealName;
           updator.utime = new Date();
           customerDao.recycleData(filterCustomerIds, updator, next);
       };

       steps.recycleNocallData = function(next) {
           var updator = {free: true, $unset: {belongUser: 1, assignUser: 1, assignTime: 1}};

           updator.uuserid = user._id;
           updator.uusername = user.username;
           updator.urealName = user.crealName;
           updator.utime = new Date();
           customerDao.client.update({belongUser : {$in : filterNocalUserIds}, free : false, status : {$in: [null, '']}}, updator, {multi : true}, next);
       };

       steps.modifyBatchCount = ['recycleData', 'recycleNocallData', function(next, data) {
           var batchMap = data.batchList;
           var task = {};
           var i = 0;
           _.each(_.keys(batchMap), function(batchId) {
               if(parseInt(batchId) != 0) {
                   task['modifyBatch' + i] = function(subNext) {
                       var subTaskSteps = {};
                       subTaskSteps.totalCount = function(subCb) {
                           customerDao.client.count({ImpBatchId: parseInt(batchId), free : true}, subCb);
                       }

                       subTaskSteps.unbcCount = function(subCb) {
                           customerDao.client.count({ImpBatchId: parseInt(batchId), status : {$in : [null, '', dictionary.customerStatus.potential]}, free : true}, subCb);
                       }

                       subTaskSteps.bcCount = function(subCb) {
                           customerDao.client.count({ImpBatchId: parseInt(batchId), status : {$in : ['bc20', 'bc40', 'bc60']}, free : true}, subCb);
                       }

                       subTaskSteps.updateBatchCount = ['totalCount', 'bcCount', 'unbcCount', function(subCb, data) {
                           var totalCount = data.totalCount;
                           var bcCount = data.bcCount;
                           var unbcCount = data.unbcCount;
                           var updateOptions = {freeCount : totalCount, availableCount: totalCount, bcCount: bcCount, unbcCount: unbcCount};
                           updateOptions.uuserid = user._id;
                           updateOptions.uusername = user.username;
                           updateOptions.urealName = user.realName;
                           updateOptions.utime = new Date();
                           customerImplBatchDao.update({_id : parseInt(batchId)}, updateOptions, subCb);
                       }];

                       async.auto(subTaskSteps, subNext);

                   }
                   i ++;
               }
           });

           async.parallel(task, next);
       }];

       async.auto(steps, function(err, result) {
           if (err) {
               res.json({msg: {type: dictionary.resMsgType.error, body: '数据库异常，回收失败'}});
           } else {
               res.json({msg: {type: dictionary.resMsgType.succ, body: '数据回收成功'}});
           }
       });
   } else {
       res.json({msg : {type : dictionary.resMsgType.error, body : '数据格式有误，回收失败'}});
   }

}

exports.reallocateData = function(req, res) {

    var customerIds = req.body.customerIds;
    var userId = req.body.userId;
    var user = req.session.user;
    var curDate = new Date();
    if(customerIds != undefined && userId != undefined) {
        var updator = {belongUser : userId, assignUser : user._id, assignTime : curDate};

        updator.uuserid = user._id;
        updator.uusername = user.username;
        updator.urealName = user.crealName;
        updator.utime = curDate;

        customerDao.reallocateData(customerIds, updator, function(err, result) {
            if(err) {
                res.json({msg : {type : dictionary.resMsgType.error, body : '数据库异常，分配失败'}});
            } else {
                res.json({msg : {type : dictionary.resMsgType.succ, body : '数据分配成功'}});
            }
        });
    } else {
        res.json({msg : {type : dictionary.resMsgType.error, body : '数据格式有误，分配失败'}});
    }

}

exports.reallocate = function(req, res) {
    var user = req.session.user;

    var busStatusList = dictModel.getDictByType(dictionary.dictTypes.customerStatus);
    var operRole = '';


    workGroupDao.findOne({'workers.userid' : user._id, 'workers.workerRoles' : {$all : [dictionary.workerRole.leader]}}, function(err, doc) {
        if(!err && doc != null) {
            var userIds = _.pluck(doc.workers, 'userid');
            operRole = dictionary.workerRole.leader;
            userDao.find({_id : {$in : userIds}, status : dictionary.userStatus.ok}, function(err, users) {
                if(!err) {
                    userDao.find({_id : {$in : userIds}, status : {$in : [dictionary.userStatus.delete, dictionary.userStatus.exitWork]}}, function(err, docs) {
                        if(err) {
                            res.json({workGroup : doc._id, groupUsers : [], statusList : busStatusList, role : operRole, users : users});
                        } else {
                            res.json({workGroup : doc._id, groupUsers : docs, statusList : busStatusList, role : operRole, users : users});
                        }
                    });
                } else {
                    res.json({groupUsers : [], statusList : [], users : []});
                }
            });
        } else {
            res.json({groupUsers : [], statusList : []});
        }
    });
}

exports.recycleList = function(req, res) {

    var workGroup = req.query.workGroup;
    var groupUser = req.query.groupUser;
    var status = req.query.status;

    //console.log(req.query);
    if(groupUser != undefined) {
        var steps = {};

        steps.groupUserDoc = function(next) {
            userDao.findById(groupUser, next);
        };

        steps.customers = function(next) {
            var where = {free : false, belongUser : parseInt(groupUser)};
            if(status) {
                where.status = status;
            } else {
                where.status = {$nin: [null, '']};
            }
            customerDao.find(where, function(err, docs) {
                if(err) {
                    next(null, []);
                } else {
                    next(null, docs);
                }
            });
        }

        steps.noCallCustomers = ['groupUserDoc', function(next, data) {
            if(status) {
                next(null, []);
            } else {
                var where = {free : false, belongUser : parseInt(groupUser)};
                where.status = {$in: [null, '']};
                customerDao.client.aggregate(
                    {$match: where},
                    {$group:{_id: '$belongUser', count: {$sum: 1}}}
                ).exec(function(err, docs) {
                    if(err) {
                        next(null, []);
                    } else {
                        _.each(docs, function(doc) {
                            doc.userName = data.groupUserDoc.realName;
                        });
                        next(null, docs);
                    }
                });
            }
        }];

        async.auto(steps, function(err, data) {
            if(err) {
                res.json({data : {bc :[], nocall : []}});
            } else {
                _.each(data.customers, function(customer) {
                    customer._doc.statusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, customer.status).name;
                });
                res.json({data : {bc : data.customers, nocall : data.noCallCustomers}});
            }
        });

    } else {
        var steps = {};
        var condition = {};
        if(workGroup != undefined) {
            condition._id = workGroup;

            steps.workGroups = function(next) {
                workGroupDao.find(condition, next);
            };

            steps.departingUsers = ['workGroups', function(next, data) {
                var workGroupUserIds = _.pluck(_.flatten(_.pluck(data.workGroups, 'workers')), 'userid');
                userDao.find({status : {$in : [dictionary.userStatus.delete, dictionary.userStatus.exitWork]}, _id : {$in : workGroupUserIds}}, next);
            }];
        } else {
            steps.departingUsers = function(next) {
                userDao.find({status : {$in : [dictionary.userStatus.delete, dictionary.userStatus.exitWork]}}, next);
            };
        }

        steps.customers = ['departingUsers', function(next, data) {
            var userIds = _.pluck(data.departingUsers, '_id');
            var where = {free : false, belongUser : {$in : userIds}};
            if(status) {
                where.status = status;
            } else {
                where.status = {$nin: [null, '']};
            }
            customerDao.find(where, function(err, docs) {
                if(err) {
                    next(null, []);
                } else {
                    var userMap = _.indexBy(data.departingUsers, '_id');
                    _.each(docs, function(doc) {
                        doc._doc.belongUserName = userMap[doc.belongUser].realName;
                    });
                    next(null, docs);
                }
            });
        }];

        steps.noCallCustomers = ['departingUsers', function(next, data) {
            var userIds = _.pluck(data.departingUsers, '_id');
            var where = {free : false, belongUser : {$in : userIds}};
            if(status) {
                next(null, []);
            } else {
                where.$or = [{status : {$exists : false}}, {status : ''}];
                customerDao.client.aggregate(
                    {$match: where},
                    {$group:{_id: '$belongUser', count: {$sum: 1}}}
                ).exec(function(err, docs) {
                    if(err) {
                        next(null, []);
                    } else {
                        var userMap = _.indexBy(data.departingUsers, '_id');
                        _.each(docs, function(doc) {
                            doc.userName = userMap[doc._id].realName;
                        });

                        next(null, docs);
                    }
                });
            }
        }];

        async.auto(steps, function(err, data) {
            if(err) {
                res.json({data : {bc :[], nocall : []}});
            } else {
                _.each(data.customers, function(customer) {
                    customer._doc.statusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, customer.status).name;
                });
                res.json({data : {bc : data.customers, nocall : data.noCallCustomers}});
            }
        });
    }

}

exports.filterRecycleCallList = function(req, res) {
    res.json({});
};

exports.addList = function(req, res) {
    var data = {};
    data.levels = dictModel.getDictByType(dictionary.dictTypes.customerLevel);
    data.identityDocTypes = dictModel.getDictByType(dictionary.dictTypes.identityDocType);
    data.areas = areaModel.getAreas();
    data.sexList = dictModel.getDictByType(dictionary.dictTypes.sex);
    res.json(data);
};

exports.create = function(req, res){
    var params = req.body;
    var user = req.session.user;
    var belongArea = params.area.split(',');
    if(params.telNo) {
        params.telNo = params.telNo.trim();
    }
    var telNo = params.telNo;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;
    params.belongUser = user._id;
    params.assignUser = user._id;
    params.ImpBatchId = 0;
    params.free = false;
    delete params.area;
    params.random = [Math.random() * 180, 0];
    params.belongArea= {areaCode : belongArea[0], areaName : belongArea[1]};
    params.addType = dictionary.customerAddType.add;

    var step = {};

    step.findCustByTel = function(next) {
        customerDao.findOne({telNo: telNo}, function(err, doc) {
            if(doc)
                next(null, doc._doc);
            else
                next(null, null);
        });
    };

    if(params.optType == 'changeBelonger') {
        step.changeBelonger = ['findCustByTel', function(next, data) {
            if(isCustomer(data.findCustByTel)) {
                next(null, false);
            } else {
                delete params.addType;
                params.belongUser = req.session.user._id;
                params.status = dictionary.customerStatus.potential;
                customerDao.modifyById(data.findCustByTel._id, params, function(err, res) {
                    if(err) {
                        logger.error('customer.create.changeBelonger : ' + err.stack);
                        next(err);
                    } else {
                        next(null, res);
                    }
                })
            }
        }];
    } else {
        step.add = ['findCustByTel', function(next, data) {
            if(!_.isEmpty(data.findCustByTel)) {
                next(null, false);
            }else {
                customerDao.add(params, next);
            }
        }];
    }

    async.auto(step, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            if(params.optType == 'changeBelonger') {
                if(result.changeBelonger) {
                    res.json({msg : {type : dictionary.resMsgType.succ, body : '该客户已成功变更为您的跟进客户。'}});
                } else if(isCustomer(result.findCustByTel)) {
                    res.json({msg : {type : dictionary.resMsgType.error, body : '该客户已属于其它顾问，并且当前状态不允许变更归属人。'}});
                } else {
                    res.json({msg : {type : dictionary.resMsgType.error, body : '变更归属人失败。'}});
                }
            } else {
                if(result.add) {
                    res.json({msg : {type : dictionary.resMsgType.succ, body : '添加客户成功。'}});
                } else {
                    if(result.findCustByTel.belongUser == req.session.user._id
                        && result.findCustByTel.free == false) {
                        if(isCustomer(result.findCustByTel)) {
                            res.json({msg : {type : dictionary.resMsgType.waring, body : '该客户已经在您的客户列表中。'}});
                        } else {
                            res.json({msg : {type : dictionary.resMsgType.waring, body : '该客户已经在您的外拨列表中。'}});
                        }

                    } else if(isCustomer(result.findCustByTel)) {
                        res.json({msg : {type : dictionary.resMsgType.error, body : '该客户已属于其它顾问，不能添加。'}});
                    } else {
                        result.findCustByTel.birthdayStr = moment(result.findCustByTel.birthday).format('YYYY-MM-DD');
                        res.json({
                            customer : result.findCustByTel,
                            msg : {type : dictionary.resMsgType.waring, body : '该客户已存在，目前状态还可以变更归属人。'},
                            potential : true
                        });
                    }
                }
            }
        }
    });

};

exports.editList = function(req, res){
    var data = {};
    var user = req.session.user;
    customerDao.findById(req.query.id, function(err, doc){
        if(err) res.json(500, {err : err.stack});
        else {
            if(user._id == doc.belongUser || user._id == doc.manager) {
                data.sexList = dictModel.getDictByType(dictionary.dictTypes.sex);
                data.investmentPreferences = dictModel.getDictByType(dictionary.dictTypes.customerInvestmentPreferenceTypes);
                data.houseInfos = dictModel.getDictByType(dictionary.dictTypes.customerHouseInfos);
                data.professionTypes = dictModel.getDictByType(dictionary.dictTypes.customerProfessionTypes);
                data.investmentTimePreferences = dictModel.getDictByType(dictionary.dictTypes.customerInvestmentTimePreference);
                data.venturePreferences = dictModel.getDictByType(dictionary.dictTypes.customerVenturePreference);
                data.bodyMassList = dictModel.getDictByType(dictionary.dictTypes.customerBodyMass);
                var customerStatus = dictModel.getDictByType(dictionary.dictTypes.customerStatus);
                data.statusList = _.without(customerStatus, _.findWhere(customerStatus, {key: 'potential'}));
                data.customer = doc;
            }
            res.json(data);
        }

    });

};

exports.edit = function(req, res){
    var params = req.body;
    var oldCustomer = {};
    var changeCustomerStatus = params.status;
    var optional = {};
    var changeStatus = params.status;
    optional.customerId = params._id;
    var user = req.session.user;
    optional.user = user;
    optional.operateType = dictionary.customerHistoryOperateType.edit;
    params.investmentPreference = {type: params.investmentPreferenceType, describe: params.investmentPreferenceDescribe};
    delete params.investmentPreferenceType;
    delete params.investmentPreferenceDescribe;
    params.profession = {type: params.professionType, describe: params.professionDescribe};
    delete params.professionType;
    delete params.professionDescribe;
    var id = parseInt(params._id);
    delete params._id;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;
    params.utime = Date.now();
    var step = {};

    var customerAdvancedLevel = [dictionary.customerStatus.vip, dictionary.customerStatus.diamondVip, dictionary.customerStatus.crownedVip];

    step.customerHistory = function(next) {
        customerHistory.backupCustomer(optional, next);
    };

    step.modifyCustomer = function(next) {
        customerDao.findById(id, function(err, docs) {
            if(err) {
                logger.error('crm.customer.edit.modifyCustomer.findOne error:'+ err.stack);
                next(err);
            }else {
                oldCustomer = _.clone(docs);
                if(_.contains(customerAdvancedLevel, params.status) && !_.contains(customerAdvancedLevel, docs.status)) {
                    params.status = docs.status;
                    params.reviewStatus = dictionary.customerReviewStatus.reviewing;
                }
                docs = _.extend(docs, params);
                docs.save(function(err, result) {
                    if(err) {
                        logger.error('crm.customer.edit.modifyCustomer.save error: ' +err.stack);
                        next(err);
                    }else {
                        next(null, result._doc);
                    }
                })
            }
        });
    };

    step.updateCustomerHistory = ['modifyCustomer', 'customerHistory', function(next, data) {
        if(!_.isEmpty(data.modifyCustomer) && !_.isEmpty(data.customerHistory)) {
            var customerHistory = data.customerHistory;
            var customer = data.modifyCustomer;
            var changeColumns = updateCustomerHistory(customer, customerHistory);
            customerHistoryDao.modifyById(customerHistory._id, {changeColumns: changeColumns, changeCustomer: customer}, next);
        }else {
            next(null, false);
        }
    }];

    var customerStatus = dictModel.getDictByType(dictionary.dictTypes.customerStatus);
    var customerStatusArray = _.without(_.pluck(customerStatus, 'key'), dictionary.customerStatus.potential, dictionary.customerStatus.bc20, dictionary.customerStatus.bc40);

    if(_.contains(customerStatusArray, params.status)) {

        step.auditTaskId = ['modifyCustomer', function(next, data) {
            if(changeCustomerStatus != oldCustomer.status) {
                idg.next(taskDao.client.collection.name, next);
            }else {
                next(null, false);
            }
        }];

        step.audit = ['auditTaskId', function(next, data) {
            if(data.auditTaskId) {
                var audit = {};
                audit.type = changeStatus;
                audit.taskId = parseInt(data.auditTaskId.toString());
                audit.customer = {};
                audit.customer.customerId = oldCustomer._id;
                audit.customer.name = oldCustomer.name;
                audit.customer.telNo = oldCustomer.telNo;
                audit.customer.status = oldCustomer.status;
                audit.customer.wechatNo = oldCustomer.wechatNo;
                audit.call = {};
                audit.call.callTime = Date.now();
                audit.call.callUser = {};
                audit.call.callUser.userid = req.session.user._id;
                audit.call.callUser.username = req.session.user.username;
                audit.call.callUser.realName = req.session.user.realName;
                audit.done = false;
                customerAuditRecordDao.client.add(audit, idg, next);
            }else {
                next(null, false);
            }
        }];

        step.auditor = ['audit', function(next, data) {
            if(data.audit) {
                userDao.findAuditor(next);
            }else {
                next(null, false);
            }
        }];

        step.auditTask = ['auditor', function(next, data) {
            if(data.auditor) {
                var task = {};
                task._id = parseInt(data.auditTaskId.toString());
                task.refId = data.audit._id;
                task.type = dictionary.taskType.customerAuditRecord;
                if(data.auditor) {
                    task.belongUser = _.pluck(data.auditor, '_id');
                }
                task.done = false;
                task.ctime = Date.now();
                task.refObj = {};
                task.refObj.type = data.audit.type;
                task.refObj.callTime = Date.now();
                task.refObj.customer = {};
                task.refObj.customer.id = oldCustomer._id;
                task.refObj.customer.name = oldCustomer.name;
                task.refObj.customer.code = oldCustomer.code;
                task.refObj.customer.status = oldCustomer.status;
                task.refObj.callUser = {};
                task.refObj.callUser.id = req.session.user._id;
                task.refObj.callUser.username = req.session.user.username;
                task.refObj.callUser.realName = req.session.user.realName;
                taskDao.add(task, next);
            }else {
                next(null, false);
            }
        }];
    }

    if(_.contains(customerAdvancedLevel, params.status)) {

        step.customerLevelPromotionTaskId = ['modifyCustomer', function(next, data) {
            if(changeCustomerStatus != oldCustomer.status) {
                idg.next(taskDao.client.collection.name, next);
            }else {
                next(null, false);
            }

        }];

        step.productor = ['customerLevelPromotionTaskId', function(next, data) {
            if(data.customerLevelPromotionTaskId) {
                userDao.findProdctor(next);
            }else {
                next(null, false);
            }

        }];

        step.customerLevelPromotionTask = ['productor', function(next, data) {
            if(data.productor) {
                var task = {};
                task._id = parseInt(data.customerLevelPromotionTaskId.toString());
                task.type = dictionary.taskType.customerLevelPromotion;
                if(data.productor) {
                    task.belongUser = _.pluck(data.productor, '_id');
                }
                task.refId = 0;
                task.done = false;
                task.ctime = Date.now();
                task.refObj = {};
                task.refObj.type = changeStatus;
                task.refObj.callTime = Date.now();
                task.refObj.customer = {};
                task.refObj.customer.id = oldCustomer._id;
                task.refObj.customer.name = oldCustomer.name;
                task.refObj.customer.code = oldCustomer.code;
                task.refObj.customer.status = oldCustomer.status;
                task.refObj.updateUser = {};
                task.refObj.updateUser.id = req.session.user._id;
                task.refObj.updateUser.username = req.session.user.username;
                task.refObj.updateUser.realName = req.session.user.realName;
                taskDao.add(task, next);
            }else {
                next(null, false);
            }

        }];
    }

    async.auto(step, function(err, result) {
        if(err) {
            res.json({msg : {type : dictionary.resMsgType.error, body : '更新客户失败'}});
        }else {
            if(result.updateCustomerHistory < 1) {
                res.json({msg : {type : dictionary.resMsgType.error, body : '更新客户失败'}});
            }else {
                res.json({msg : {type : dictionary.resMsgType.succ, body : '更新客户成功'}});
            }
        }
    });
};

exports.attachmentList = function(req, res) {
    var customerId = req.param('id');
    res.json({customerId : customerId});
};

exports.attachmentAdd = function(req, res){
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    customerAttachmentDao.create(req.files, params, function(err, result) {
        if(!err) {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '添加附件成功'}});
        } else {
            res.json({msg : {type : dictionary.resMsgType.error, body : '添加附件失败'}});
        }
    });
};

exports.tag = function(req, res) {
    var customerId = req.query.id;
    var step = {};

    step.customerTagStr = function(next){
        customerDao.findById(customerId, next);
    };

    step.findByType = function(next) {
        tag.tags(tag.type.CUSTOMER, next);
    };

    async.parallel(step, function(err, result) {
        if(err) {
            logger.error(err.stack);
            res.json({
                err : {msg : '查询客户标签异常'}
            });
        } else {
            //var allTagStr = '';
            var tagStr = '';
            //var docs = result.findByType;
            var customerTagStr = result.customerTagStr._doc.tags;
//            for(var i in docs) {
//                if(i == 0) {
//                    allTagStr += docs[i].name;
//                } else {
//                    allTagStr += ',' + docs[i].name;
//                }
//            }
            _.each(customerTagStr, function(key, value) {
                if(value == 0) {
                    tagStr += key;
                }else {
                    tagStr +=',' + key;
                }
            });
            res.json({ customerTagStr : tagStr, id : customerId });
        }
    });
};

exports.tagModify = function(req, res) {
    var tagStr = req.param('tagStr');
    var id = req.param('id');
    var optional = {};
    optional.customerId = id;
    var user = req.session.user;
    optional.user = user;
    optional.operateType = dictionary.customerHistoryOperateType.tag;
    var step = {};

    step.customerHistory = function(next) {
        customerHistory.backupCustomer(optional, next);
    };

    step.modifyTag = ['customerHistory', function(next, data) {
        if(!_.isEmpty(data.customerHistory)) {
            if(id) {
                var tagList = tagStr.split(',');
                customerDao.client.update(
                    {_id : id},
                    {$set : {tags : tagList}},
                    null, next);
            }else {
                next(null);
            }
        }else {
            next(null);
        }
    }];

    step.customer = ['modifyTag', function(next, data) {
        if(!_.isEmpty(data.modifyTag)) {
            customerDao.findById(id, next);
        }else {
            next(null);
        }
    }];

    step.updateCustomerHistory = ['customer', function(next, data) {
        if(!_.isEmpty(data.customer)) {
            var customerHistory = data.customerHistory;
            var customer = data.customer._doc;
            var changeColumns = updateCustomerHistory(customer, customerHistory);
            customerHistoryDao.modifyById(customerHistory._id, {changeColumns: changeColumns, changeCustomer: customer}, next);
        }else {
            next(null);
        }

    }];

    async.auto(step, function(err, result) {
        if(err) {
            logger.error(err.stack);
            res.json({msg : {type : dictionary.resMsgType.error, body : '系统异常，修改客户标签失败'}});
        } else {
            if(result.updateCustomerHistory < 1) {
                res.json({msg : {type : dictionary.resMsgType.error, body : '修改客户标签失败'}});
            }else {
                res.json({msg : {type : dictionary.resMsgType.succ, body : '修改客户标签成功'}});
            }

        }
    });
};

exports.orderDataList = function(req, res){
    async.parallel({
        products : function(cb) {
            productDao.findName(cb)
    },
        customer : function(cb){
            customerDao.findById(req.query.id, cb)
    }
    }, function(err, results){
        if(err) res.json({});
        else {
            res.json(results);
        }
    });
};

exports.orderAdd = function(req, res){
    var orderObj = {};
    var customerServiceObj = {};
    var params = req.body;
    var user = req.session.user;
    var customer = params.customerMsg.split(',');
    orderObj.customer = { customerId : parseInt(customer[0]),  name : customer[1], telNo : customer[2]};
    var product = params.customerOrderProduct.split(',');
    orderObj.product = { productId : parseInt(product[0]),  name : product[1], type : product[2]};
    orderObj.status = params.status;
    orderObj.cuserid = user._id;
    orderObj.cusername = user.username;
    orderObj.crealName = user.realName;
    orderObj.uuserid = user._id;
    orderObj.uusername = user.username;
    orderObj.urealName = user.realName;
    orderObj.belongOrg = user.orgCode;
    orderObj.amount = params.amount;
    orderObj.comment = params.comment;

    customerServiceObj.customerId = parseInt(customer[0]);
    customerServiceObj.customerStatus = customer[3];
    customerServiceObj.investmentPreference = params.investmentPreference;
    customerServiceObj.bodyMass = params.bodyMass;
    customerServiceObj.cuserid = user._id;
    customerServiceObj.cusername = user.username;
    customerServiceObj.crealName = user.realName;
    customerServiceObj.ctime = Date.now();
    customerServiceObj.type = params.type;
    customerServiceObj.comment = params.comment
    async.parallel([
        function(cb) {
            orderDao.add(orderObj, cb)
        },
        function(cb) {
            customerServiceRecordDao.add(customerServiceObj, cb)
        }
    ], function(err, result){
        if(!err) {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '添加订单成功'}});
        }else {
            res.json({msg : {type : dictionary.resMsgType.error, body : '添加订单失败'}});
        }
    })
};

exports.actionPlanAdd = function(req, res){
    var task = {};
    var refObj = {};
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;

    refObj.type = params.type;
    refObj.actionDate = params.actionDate;
    refObj.comment = params.comment;
    task.type = dictionary.taskType.customerActionPlan;
    task.belongUser = user._id;
    if(params.type != 'meet'){
        delete params.rm;
        delete params.dateAddress;
        delete params.addressType;
        delete params.meetType;
    }else {
        params.rm = parseInt(params.rm);
    }
    params.customerId = parseInt(params.customerId);

    var step = {};

    step.customer = function(next){
        customerDao.findById(params.customerId, next);
    };

    step.actionPlanId = function(next){
        idg.next(customerActionPlanDao.client.collection.name, next);
    };

    step.taskId = function(next){
        idg.next(taskDao.client.collection.name, next);
    };

    step.addCount = function(next){
        customerDao.modifyById(params.customerId, {$inc : {unDoActionPlanCount : 1}}, next);
    };

    step.addActionPlan = ['actionPlanId','taskId', function(next, data) {
        params._id = parseInt(data.actionPlanId.toString());
        params.taskId = parseInt(data.taskId.toString());
        customerActionPlanDao.add(params, next)
    }];

    step.addTask = ['actionPlanId', 'taskId', 'customer', function(next, data) {
        task._id = parseInt(data.taskId.toString());
        task.refId = parseInt(data.actionPlanId.toString());
        refObj.customer = {id : params.customerId, name : data.customer.name};
        task.refObj =refObj;
        taskDao.add(task, next);
    }];

    async.auto(step, function(err, result){
        if(err){
            res.json({msg : {type : dictionary.resMsgType.error, body : '添加失败'}});
        }else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '添加成功'}});
        }
    })
}

exports.actionPlanList = function(req, res){
    var data = {};
    var id = req.param('id');
    var steps = {};

    steps.RM = function(next) {
        userDao.findRM(next);
    };

    steps.customer = function(next) {
        customerDao.findById(id, next);
    };

    steps.user = ['customer', function(next, data) {
        var cust = data.customer;
        if(cust.manager) {
            userDao.findById(cust.manager, next);
        }else {
            next(null, null);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.customer.actionPlanList'+err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({users: result.RM, user: result.user, customerId: id});
        }
    });
};

exports.myRecord = function(req, res) {
    res.json({username: req.session.user.username, callCenter : appCfg.callCenter});
};

exports.myRecordModal = function(req, res) {
    var ucid = req.param('ucid');
    res.json({ucid : ucid, callCenter : appCfg.callCenter});
};

exports.customerAdvancedList = function(req, res) {
    var data = {};

    data.statusList = dictModel.getListByTypes([
        dictionary.dictTypes.customerStatus
    ]);

    data.callStatusList = dictModel.getListByTypes([
        dictionary.dictTypes.customerCallStatus
    ]);

    data.auditStatusList = dictModel.getListByTypes([
        dictionary.dictTypes.customerAuditStatus
    ]);

    var steps = {};

    steps.consultants = function(next) {
        userDao.find({position: {$in: [dictionary.userPosition.consultant, dictionary.userPosition.rm]}}, next);
    };

    steps.rms = function(next) {
        userDao.find({position: {$in: [dictionary.userPosition.consultant, dictionary.userPosition.rm]}}, next);
    };

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.customer.customerAdvancedList error:'+error.stack);
            res.json(500, {err: err.stack});
        }else {
            data.consultants = result.consultants;
            data.rms = result.rms;
            res.json({data: data});
        }
    })
};

exports.customerAdvancedListTable = function(req, res) {
    var pagination = new Pagination(req);
    var condition = pagination.condition;
    var steps = {};

    if(condition.telOrNameOrCode) {
        condition.$or = [{telNo: new RegExp(pagination.condition.telOrNameOrCode)}, {name: new RegExp(pagination.condition.telOrNameOrCode)}, {code: new RegExp(pagination.condition.telOrNameOrCode)}];
        delete condition.telOrNameOrCode;
    }

    if(!_.isEmpty(condition.customerImplSearch)) {
        steps.impBatch = function(next) {
            customerImplBatchDao.findOne({name: condition.customerImplSearch}, next);
        }
    }else {
        steps.impBatch = function(next) {
            next(null);
        }
    }

    steps.users = function(next) {
        userDao.find({}, next);
    };

    steps.customers = ['impBatch', 'users', function(next, data) {
        var impBatch = data.impBatch;
        var userIds = _.pluck(data.users, '_id');
        if(condition.consultant) {
            if(condition.consultant == 'empty') {
                condition.belongUser = {$nin: userIds};
            }else {
                condition.belongUser = condition.consultant;
            }
            delete condition.consultant;
        }
        if(condition.rm) {
            if(condition.rm == 'empty') {
                condition.manager = {$nin: userIds};
            }else {
                condition.manager = condition.rm;
            }
            delete condition.rm;
        }
        if(!_.isEmpty(impBatch)) {
            condition.ImpBatchId = impBatch._id;
            delete condition.customerImplSearch;
        }
        customerDao.client.findByPage(pagination, next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.customer.customerAdvancedListTable error:'+err.stack);
            res.json(500, {err: err.stack});
        }else {
            var customers = _.pluck(result.customers, '_doc');
            var users = _.pluck(result.users, '_doc');
            _.each(customers, function(key) {
                if(key.status) {
                    key.statusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, key.status).name;
                }else {
                    key.statusName = '无';
                }
                if(key.belongUser) {
                    key.belongUserInfo = _.findWhere(users, {_id: key.belongUser});
                }else {
                    key.belongUserInfo = null;
                }
                if(key.manager) {
                    key.managerInfo = _.findWhere(users, {_id: key.manager});
                }else {
                    key.managerInfo = null;
                }
            });
            var pageTotal = pagination.total;
            var flag = 0;
            if(parseInt(pageTotal/10000) >=1 ) {
                var count = parseInt(pageTotal/10000);
                var i = 0;
                var array = [];

                while(i < count) {
                    var arrayVal = {};
                    arrayVal.key = i;
                    arrayVal.val = i*10000+1 + '~' + (i+1)*10000;
                    array.push(arrayVal);
                    i++;
                }
                var remainder = {};
                remainder.key = i;
                remainder.val = i*10000+1 + '~' +pageTotal;
                array.push(remainder);
                flag = 1;
            }
            res.json({pagination: pagination, customers: customers, flag: flag, arrays: array});
        }
    });
};

exports.appointConsultant = function(req, res) {
    var id = req.param('id');
    var user = {};

    var steps = {};

    steps.customer = function(next) {
        customerDao.findById(parseInt(id), next);
    };

    steps.deal = ['customer', function(next, data) {
        var customer = data.customer;
       if(customer.manager == req.session.user._id) {
           var step = {};
           step.users = function(next) {
               userDao.find({status : dictionary.userStatus.ok}, next);
           };
           step.consultant = ['users', function(next, data) {
               if(customer.belongUser) {
                   user = _.findWhere(data.users, {_id: parseInt(customer.belongUser)});
                   if(_.isEmpty(user)) {
                       userDao.findConsultant(next);
                   }else {
                       next(null, 'consultant');
                   }
               }else {
                   userDao.findConsultant(next);
               }
           }];
           async.auto(step, next);
       }else {
           next(null, 'manager');
       }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.customer.appointConsultant error:'+err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(result.deal.consultant == 'consultant') {
                res.json({msg: {type:  dictionary.resMsgType.error, body: '只有当该客户的RM是自己,并且顾问不存在或已离职才能指定顾问'}});
            }else if(result.deal == 'manager') {
                res.json({msg: {type:  dictionary.resMsgType.error, body: '只有当该客户的RM是自己,并且顾问不存在或已离职才能指定顾问'}});
            }else {
                res.json({consultants: result.deal.consultant, customerId: id, msg: {type:  dictionary.resMsgType.succ}});
            }
        }
    });
};

exports.editBelongUser = function(req, res) {
    var params = req.body;
    var id = req.param('id');
    customerDao.modifyById(parseInt(id), params, function(err, result) {
        if(err) {
            logger.error('crm.customer.editBelongUser error:'+err.stack);
            res.json({msg : {type : dictionary.resMsgType.error, body : '修改失败'}});
        }else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '修改成功'}});
        }
    })

};

exports.basicInfo = function(req, res) {
    var id = req.param('id');
    customerDao.findById(id, function(err, result) {
        if(err) {
            logger.error('crm.customer.basicInfo error:'+err.stack);
            res.json(500, {err: err.stack});
        }else {
            var customer = _.property('_doc')(result);
            //console.log(customer);
            if(customer.houseInfo) {
                customer.houseInfoName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerHouseInfos, customer.houseInfo).name;
            }else {
                customer.houseInfoName = '未知';
            }
            if(!_.isEmpty(customer.profession)) {
                if(customer.profession.type) {
                    customer.professionName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerProfessionTypes, customer.profession.type).name;
                }else if(customer.profession.describe) {
                    customer.professionName = customer.profession.describe;
                }else {
                    customer.professionName ='未知';
                }
            }else {
                customer.professionName = '未知';
            }
            if(customer.status) {
                customer.statusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, customer.status).name;
            }else {
                customer.statusName = '未知';
            }
            if(customer.callStatus) {
                customer.callStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerCallStatus, customer.callStatus).name;
            }else {
                customer.callStatusName = '未知';
            }
            if(customer.auditStatus) {
                customer.auditStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAuditStatus, customer.auditStatus).name;
            }else {
                customer.auditStatusName = '未知';
            }
            res.json({customer: customer});
        }
    })
};

exports.customerStatus = function(req, res) {
    var params = req.param('id').split(',');
    var id = params[0];
    var status = params[1];
    var statusList = dictModel.getDictByType(dictionary.dictTypes.customerStatus);
    var customerStatus = _.findWhere(statusList, {key: status});
    res.json({id: id, customerStatus: customerStatus, statusList: statusList});
};

exports.editStatus = function(req, res) {
    var params = req.body;
    var id = req.param('id');
    var steps = {};
    var customerAdvanced = customerAdvancedParam(req, params, id);

    customerAdvanced.type = dictionary.customerAdvancedOpType.statusModify;

    customerAdvanced.opDetail = [];
    var opDetail = {};
    opDetail.displayName = '状态';
    opDetail.preValue = params.oldStatus;
    opDetail.postValue = params.newStatus;
    customerAdvanced.opDetail.push(opDetail);

    steps.modifyCustomer = function(next) {
        customerDao.modifyById(id, {$set: {status: params.newStatus}}, next);
    };

    steps.addAdvancedOpLog = function(next) {
        customerAdvancedOpLogDao.add(customerAdvanced, next);
    };

    async.parallel(steps, function(err, result) {
        if(err) {
            logger.error('crm.customer.editStatus error:'+err.stack);
            res.json({msg : {type : dictionary.resMsgType.error, body : '修改失败'}});
        }else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '修改成功'}});
        }
    });
};

exports.customerConsultant = function(req, res) {
    var params = req.param('id').split(',');
    var id = params[0];
    var belongUser = params[1];

    userDao.find({status: dictionary.userStatus.ok}, function(err, result) {
        if(err) {
            logger.error('crm.customer.costomerConsultant error:'+err.stack);
            res.json(500, {err: err.stack});
        }else {
            var users = _.pluck(result, '_doc');
            var consultant = _.findWhere(users, {_id: parseInt(belongUser)});
            var consultantList = _.where(users, {position : dictionary.userPosition.consultant});
            res.json({customerId: id, consultant: consultant, consultantList: consultantList});
        }
    });

};

exports.editConsultant = function(req, res) {
    var params  = req.body;
    var id = req.param('id');
    var steps = {};
    var customerAdvanced = customerAdvancedParam(req, params, id);

    customerAdvanced.type = dictionary.customerAdvancedOpType.consultantModify;

    customerAdvanced.opDetail = [];
    var opDetail = {};
    opDetail.displayName = '顾问';
    opDetail.preValue = params.oldConsultant;
    opDetail.postValue = params.newConsultant;
    customerAdvanced.opDetail.push(opDetail);

    steps.customer = function(next) {
        customerDao.findById(parseInt(id), next);
    };

    steps.modifyCustomer = ['customer', function(next, data) {
        if(!params.newConsultant && !data.customer.manager)  {
            next(null, false);
        }else {
            customerDao.modifyById(id, {$set: {belongUser: params.newConsultant, free: false}}, next);
        }
    }];

    steps.addAdvancedOpLog = ['modifyCustomer' , function(next, data) {
        if(data.modifyCustomer) {
            customerAdvancedOpLogDao.add(customerAdvanced, next);
        }else {
            next(null, false);
        }
    }];

    steps.refreshBatchCount = ['customer', 'modifyCustomer', function(next, data) {
        if(data.customer.ImpBatchId && data.customer.free == true) {
            customerImplBatchDao.refreshBatchCount([data.customer.ImpBatchId], next);
        }else {
            next(null, false);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.customer.editConsultant error:'+err.stack);
            res.json({msg : {type : dictionary.resMsgType.error, body : '修改失败'}});
        }else {
            if(result.addAdvancedOpLog) {
                res.json({msg : {type : dictionary.resMsgType.succ, body : '修改成功'}});
            }else {
                res.json({msg: {type: dictionary.resMsgType.error, body: '顾问和RM不能同时为空。修改失败!'}});
            }
        }
    });

};

exports.customerRM = function(req, res) {
    var params = req.param('id').split(',');
    var id = params[0];
    var managerId = params[1];

    userDao.find({status: dictionary.userStatus.ok}, function(err, result) {
        if(err) {
            logger.error('crm.customer.customerRM error:'+err.stack);
            res.json(500, {err: err.stack});
        }else {
            var users = _.pluck(result, '_doc');
            var manager = _.findWhere(users, {_id: parseInt(managerId)});
            var managerList = _.where(users, {position : dictionary.userPosition.rm});
            res.json({customerId: id, manager: manager, managerList: managerList});
        }
    });
};

exports.editRM = function(req, res) {
    var params  = req.body;
    var id = req.param('id');
    var steps = {};
    var customerAdvanced = customerAdvancedParam(req, params, id);

    customerAdvanced.type = dictionary.customerAdvancedOpType.rmModify;

    customerAdvanced.opDetail = [];
    var opDetail = {};
    opDetail.displayName = 'RM';
    opDetail.preValue = params.oldManager;
    opDetail.postValue = params.newManager;
    customerAdvanced.opDetail.push(opDetail);

    steps.customer = function(next) {
        customerDao.findById(parseInt(id), next);
    };

    steps.modifyCustomer = ['customer', function(next, data) {
        if(!params.newManager && !data.customer.belongUser)  {
            next(null, false);
        }else {
            customerDao.modifyById(id, {$set: {manager: params.newManager, free: false}}, next);
        }
    }];

    steps.addAdvancedOpLog = ['modifyCustomer', function(next, data) {
        if(data.modifyCustomer) {
            customerAdvancedOpLogDao.add(customerAdvanced, next);
        }else {
            next(null, false);
        }
    }];

    steps.refreshBatchCount = ['customer', 'modifyCustomer', function(next, data) {
        if(data.customer.ImpBatchId && data.customer.free == true) {
            customerImplBatchDao.refreshBatchCount([data.customer.ImpBatchId], next);
        }else {
            next(null, false);
        }
    }];


    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.customer.editRM error:'+err.stack);
            res.json({msg : {type : dictionary.resMsgType.error, body : '修改失败'}});
        }else {
            if(result.addAdvancedOpLog) {
                res.json({msg : {type : dictionary.resMsgType.succ, body : '修改成功'}});
            }else {
                res.json({msg: {type: dictionary.resMsgType.error, body: '顾问和RM不能同时为空。修改失败!'}});
            }
        }
    });
};

exports.statisticList = function(req, res) {
    customerDao.aggregateStatisticInExist(function(err, result) {
        if(err) {
            logger.error('crm.customer.statisticList.aggregateStatisticInExist error: ' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            var other = {};
            other._id = '其他';
            other.statusList =  {};
            _.each(result, function(key) {
                other.statusList[key._id] = key.count;
            });

            customerDao.aggregateStatisticExist(function(err, doc) {
                if(err) {
                    logger.error('crm.customer.statisticList error: '+ err.stack);
                    res.json(500, {err: err.stack});
                }else {
                    _.each(doc, function(key) {
                        var data = key.data;
                        key.statusList = {};
                        _.each(data, function(value) {
                            key.statusList[value.status] = value.count;
                        });
                        delete key.data;
                    });
                    doc.push(other);
                    res.json({statisticList: doc});
                }
            })
        }
    });
};

exports.exportCustomerList = function(req, res) {
    var params = req.body.condition;
    var index = parseInt(params.index);
    delete params.index;

    var steps = {};

    if(params.telOrNameOrCode) {
        params.$or = [{telNo: new RegExp(params.telOrNameOrCode)}, {name: new RegExp(params.telOrNameOrCode)}, {code: new RegExp(params.telOrNameOrCode)}];
        delete params.telOrNameOrCode;
    }

    if(!_.isEmpty(params.customerImplSearch)) {
        steps.implBatch = function(next) {
            customerImplBatchDao.findOne({name: params.customerImplSearch}, next);
        }
    }else {
        steps.implBatch = function(next) {
            next(null);
        }
    }

    steps.customerImplBatch = function(next) {
        customerImplBatchDao.find({}, next);
    };

    steps.user = function(next) {
        userDao.find({}, next);
    };

    steps.customers = ['implBatch', 'user', function(next, data) {
        var implBatch = data.implBatch;
        var userIds = _.pluck(data.user, '_id');
        if(params.consultant) {
            if(params.consultant == 'empty') {
                params.belongUser = {$nin: userIds};
            }else {
                params.belongUser = params.consultant;
            }
            delete params.consultant;
        }
        if(params.rm) {
            if(params.rm == 'empty') {
                params.manager = {$nin: userIds};
            }else {
                params.manager = params.rm;
            }
            delete params.rm;
        }
        if(!_.isEmpty(implBatch)) {
            params.ImpBatchId = implBatch._id;
            delete params.customerImplSearch;
        }
        customerDao.client.find(params).limit(10000).skip(index*10000).sort({_id: 1}).exec(next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            var customerList = _.pluck(result.customers, '_doc');
            var customerImplBatchList = _.pluck(result.customerImplBatch, '_doc');
            var userList = _.pluck(result.user, '_doc');
            createExcel(customerList, userList, customerImplBatchList, res);
        }
    });
};

exports.multiModifyInfo = function(req, res) {
    var totalCount = req.param('totalCount');

    var steps = {};

    steps.consultants = function(next) {
        userDao.find({position: dictionary.userPosition.consultant, status: dictionary.userStatus.ok}, next);
    };

    steps.rms = function(next) {
        userDao.find({position: dictionary.userPosition.rm, status: dictionary.userStatus.ok}, next);
    };

    async.auto(steps, function(err, docs){
        if(err) {
            logger.error('crm.customer.multiModifyInfo error: ' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({totalCount: totalCount, consultants: docs.consultants, rms: docs.rms});
        }
    })
};

exports.confirmNumberOverVlaue = function(req, res) {
    var params = req.body;
    var steps = {};
    var telNos = [];
    var multiTel = [];
    var notExistTel = [];
    var illegal = [];
    //console.log(params);

    if(req.files.bathModify) {
        steps.readFile = function(next) {
            var fileName = G.UPLOAD_TMP_PATH + req.files.bathModify.name;

            var readStream = fs.createReadStream(fileName);
            readStream = byline.createStream(readStream);

            readStream.on('readable', function() {
                var chunk;
                while( null !== (chunk = readStream.read())) {
                    if(invalid(chunk.toString())) {
                        if(!_.contains(telNos, chunk.toString())) {
                            telNos.push(chunk.toString());
                        }else {
                            multiTel.push(chunk.toString());
                        }
                    }else {
                        illegal.push(chunk.toString());
                    }
                }
            }).on('end', function() {
                fs.unlink(fileName);
                params.telNo = {$in: telNos};
                next(null, true);
            });
        }
    }else {
        steps.readFile = function(next) {
            next(null, false);
        }
    }

    if(params.telOrNameOrCode) {
        params.$or = [{telNo: new RegExp(params.telOrNameOrCode)}, {name: new RegExp(params.telOrNameOrCode)}, {code: new RegExp(params.telOrNameOrCode)}];
        delete params.telOrNameOrCode;
    }

    if(!_.isEmpty(params.customerImplSearch)) {
        steps.impBatch = function(next) {
            customerImplBatchDao.findOne({name: params.customerImplSearch}, next);
        }
    }else {
        steps.impBatch = function(next) {
            next(null);
        }
    }

    steps.users = function(next) {
        userDao.find({}, next);
    };

    steps.customers = ['impBatch', 'readFile', 'users', function(next, data) {
        var impBatch = data.impBatch;
        var userIds = _.pluck(data.users, '_id');

        if(params.consultant) {
            if(params.consultant == 'empty') {
                params.belongUser = {$nin: userIds};
            }else {
                params.belongUser = parseInt(params.consultant);
            }
            delete params.consultant;
        }
        if(params.rm) {
            if(params.rm == 'empty') {
                params.manager = {$nin: userIds};
            }else {
                params.manager = parseInt(params.rm);
            }
            delete params.rm;
        }
        if(!_.isEmpty(impBatch)) {
            params.ImpBatchId = impBatch._id;
            delete params.customerImplSearch;
        }
        //console.log(params);
        customerDao.client.count(params, next);
    }];

    steps.users = function(next) {
        userDao.find({}, next);
    };

    async.auto(steps, function(err, docs) {
        if(err) {
            logger.error('crm.customer.confirmNumberOverVlaue error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(docs.customers > 1000) {
                res.json({msg: {type: dictionary.resMsgType.error, body: '查询客户数据量不应大于1000,请缩小查询范围!'}});
            }else {
                //var telNos = [];
                if(!_.isEmpty(telNos)) {
                    async.map(telNos, function(value, cb){
                        customerDao.findOne({telNo: value}, function(err, doc) {
                            if(err) {
                                cb(err);
                            }else {
                                if(!doc) {
                                    notExistTel.push(value);
                                }
                                cb(null, doc);
                            }
                        });
                    }, function(err, result) {
                        if(err) {
                            logger.error('crm.customer.confirmNumberOverVlaue.find customer error: ' +err.stack);
                            res.json(500, {err: err.stack});
                        }else {
                            result = _.without(result, null);
                            var customers = [];
                            _.each(result, function(value) {
                                customers.push(value._doc);
                            });
                            respValHandler(customers, docs, params, multiTel, notExistTel, illegal, res);
                        }
                    })
                }else {
                    customerDao.find(params, function(err, result) {
                        if(err) {
                            logger.error('crm.customer.confirmNumberOverVlaue.find customer error: ' +err.stack);
                            res.json(500, {err: err.stack});
                        }else {
                            var customers = _.pluck(result, '_doc');
                            respValHandler(customers, docs, params, [], [], [], res);
                        }
                    })
                }
            }
        }
    })
};

function respValHandler(customers, docs, params, multiTel, notExistTel, illegal, res) {
    var users = _.pluck(docs.users, '_doc');
    _.each(customers, function (customer) {
        //telNos.push(customer.telNo);
        if (customer.status) {
            customer.statusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, customer.status).name;
        } else {
            customer.statusName = '未知';
        }
        var consultant = _.findWhere(users, {_id: customer.belongUser});
        if (!_.isEmpty(consultant)) {
            customer.oldBelongUserName = consultant.username + '(' + consultant.realName + ')';
        } else {
            customer.oldBelongUserName = '空';
        }
        var manager = _.findWhere(users, {_id: customer.manager});
        if (!_.isEmpty(manager)) {
            customer.oldManagerName = manager.username + '(' + manager.realName + ')';
        } else {
            customer.oldManagerName = '空';
        }
    });
    var newBelongUser = {};
    if (params.belongUserId) {
        if (params.belongUserId == 'empty') {
            newBelongUser = {flag: 'empty'};
        } else {
            newBelongUser = _.findWhere(users, {_id: parseInt(params.belongUserId)});
        }
    } else {
        newBelongUser = {flag: 'old'};
    }
    var newManager = {};
    if (params.managerId) {
        if (params.managerId == 'empty') {
            newManager = {flag: 'empty'};
        } else {
            newManager = _.findWhere(users, {_id: parseInt(params.managerId)});
        }
    } else {
        newManager = {flag: 'old'};
    }
    res.json({msg: {type: dictionary.resMsgType.succ}, newBelongUser: newBelongUser, newManager: newManager, customers: customers, totalCount: docs.customers, multiTel: multiTel, notExistTel: notExistTel, illegal: illegal});
}

exports.multiModifyTable = function(req, res) {
    var params = req.param('data');
    var conditions = {};
    var steps = {};

    setParams(params, conditions);

    if(!_.isEmpty(params.customerImplSearch)) {
        steps.impBatch = function(next) {
            customerImplBatchDao.findOne({name: params.customerImplSearch}, next);
        }
    }else {
        steps.impBatch = function(next) {
            next(null);
        }
    }

    steps.users = function(next) {
        userDao.find({}, next);
    };

    steps.customers = ['impBatch', 'users', function(next, data) {
        var impBatch = data.impBatch;
        var userIds = _.pluck(data.users, '_id');

        if(params.consultant) {
            if(params.consultant == 'empty') {
                conditions.belongUser = {$nin: userIds};
            }else {
                conditions.belongUser = parseInt(params.consultant);
            }
        }
        if(params.rm) {
            if(params.rm == 'empty') {
                conditions.manager = {$nin: userIds};
            }else {
                conditions.manager = parseInt(params.rm);
            }
        }
        if(!_.isEmpty(impBatch)) {
            conditions.ImpBatchId = impBatch._id;
            delete conditions.customerImplSearch;
        }
        customerDao.find(conditions, next);
    }];

    async.auto(steps, function(err, docs) {
        if(err) {
            logger.error('crm.customer.multiModifyTabel error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            var customers = _.pluck(docs.customers, '_doc');
            var users = _.pluck(docs.users, '_doc');

            _.each(customers, function (customer) {
                if (customer.status) {
                    customer.statusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, customer.status).name;
                } else {
                    customer.statusName = '未知';
                }
                var consultant = _.findWhere(users, {_id: customer.belongUser});
                if (!_.isEmpty(consultant)) {
                    customer.oldBelongUserName = consultant.username + '(' + consultant.realName + ')';
                } else {
                    customer.oldBelongUserName = '空';
                }
                var manager = _.findWhere(users, {_id: customer.manager});
                if (!_.isEmpty(manager)) {
                    customer.oldManagerName = manager.username + '(' + manager.realName + ')';
                } else {
                    customer.oldManagerName = '空';
                }
            });

            res.json({customers: customers});
        }
    })
};

function setParams(params, conditions) {
    if(params.telNos) {
        conditions.telNo = {$in : params.telNos.split(',')};
    }

    if(params.telOrNameOrCode) {
        conditions.$or = [{telNo: new RegExp(params.telOrNameOrCode)}, {name: new RegExp(params.telOrNameOrCode)}, {code: new RegExp(params.telOrNameOrCode)}];
    }

    if(params.customerImplSearch) {
        conditions.customerImplSearch = params.customerImplSearch;
    }
    if(params.free) {
        conditions.free = params.free;
    }
    if(params.status) {
        conditions.status =  params.status;
    }
    if(params.callStatus) {
        conditions.callStatus = params.callStatus;
    }
    if(params.auditStatus) {
        conditions.auditStatus = params.auditStatus;
    }
}

exports.multiModifyCust = function(req, res) {
    var params = req.body;

    async.each(params.selectDataList, function(value, callback) {
        var step = {};

        var belongUserPreValue = '';
        var managerPreValue = '';

        step.customer = function(cb) {
            customerDao.findById(parseInt(value.customerId), function(err, docs) {
                if(err) {
                    logger.error('crm.customer.multiModifyCust.modifyCustomer_'+ value+ '_findById error: ' +err.stack);
                    cb(err);
                }else {
                    belongUserPreValue = docs.belongUser;
                    managerPreValue = docs.manager;

                    if(value.belongUserId) {
                        if(value.belongUserId == 'empty') {
                            docs.belongUser = '';
                        }else {
                            docs.belongUser = parseInt(value.belongUserId);
                        }
                    }

                    if(value.managerId) {
                        if(value.managerId == 'empty') {
                            docs.manager = '';
                        }else {
                            docs.manager = parseInt(value.managerId);
                        }
                    }

                    docs.free = false;

                    docs.save(function(err) {
                        if(err) {
                            logger.error('crm.customer.multiModifyCust.modifyCustomer_'+ value+ '_save error: ' +err.stack);
                            cb(err);
                        }else {
                            cb(null, docs);
                        }
                    })
                }
            });
        };

        if(value.belongUserId || value.managerId) {
            step.customerAdvancedOpLog = ['customer', function(cb, data) {
                var customerAdvanced = {};

                customerAdvanced.customerId = parseInt(value.customerId);
                customerAdvanced.reason = '批量修改';
                var opDetailConsultant = {};
                var opDetailRM = {};
                if(value.belongUserId && !value.managerId) {
                    customerAdvanced.type = dictionary.customerAdvancedOpType.consultantAndrmModify;
                    customerAdvanced.opDetail = [];

                    opDetailConsultant.displayName = '顾问';
                    opDetailConsultant.preValue = belongUserPreValue;
                    opDetailConsultant.postValue = data.customer.belongUser;
                    customerAdvanced.opDetail.push(opDetailConsultant);

                }else if(!value.belongUserId && value.managerId) {
                    customerAdvanced.type = dictionary.customerAdvancedOpType.rmModify;
                    customerAdvanced.opDetail = [];

                    opDetailRM.displayName = 'RM';
                    opDetailRM.preValue = managerPreValue;
                    opDetailRM.postValue = data.customer.manager;
                    customerAdvanced.opDetail.push(opDetailRM);

                }else {
                    customerAdvanced.type = dictionary.customerAdvancedOpType.consultantAndrmModify;
                    customerAdvanced.opDetail = [];

                    opDetailConsultant.displayName = '顾问';
                    opDetailConsultant.preValue = belongUserPreValue;
                    opDetailConsultant.postValue = data.customer.belongUser;

                    customerAdvanced.opDetail.push(opDetailConsultant);

                    opDetailRM.displayName = 'RM';
                    opDetailRM.preValue = managerPreValue;
                    opDetailRM.postValue = data.customer.manager;

                    customerAdvanced.opDetail.push(opDetailRM);
                }
                var opUser = {};
                opUser.uid = req.session.user._id;
                opUser.username = req.session.user.username;
                opUser.realName = req.session.user.realName;
                customerAdvanced.opUser = opUser;
                customerAdvanced.opTime = new Date();
                customerAdvancedOpLogDao.add(customerAdvanced, function(err, result) {
                    if(err) {
                        logger.error('crm.customer.multiModifyCust.customerAdvancedOpLog.add error: ' +err.stack);
                        cb(err);
                    }else {
                        cb(null, result);
                    }
                });
            }]
        }
        async.auto(step, callback);
    }, function(err) {
        if(err) {
            logger.error('crm.customer.multiModifyCust error: ' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '修改成功'}});
        }
    });
};

function invalid(telNo) {
    if(telNo == null || telNo == '') {
        return false;
    }
    if(!/^1\d{10}$/g.test(telNo)) {
        return false;
    }
    return true;
}
function datenum(v, date1904) {
    if (date1904) v += 1462;
    var epoch = Date.parse(v);
    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function sheet_from_array_of_arrays(data, opts) {
    var ws = {};
    var range = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};
    for (var R = 0; R != data.length; ++R) {
        for (var C = 0; C != data[R].length; ++C) {
            if (range.s.r > R) range.s.r = R;
            if (range.s.c > C) range.s.c = C;
            if (range.e.r < R) range.e.r = R;
            if (range.e.c < C) range.e.c = C;
            var cell = {v: data[R][C]};
            if (cell.v == null) continue;
            var cell_ref = XLSX.utils.encode_cell({c: C, r: R});
            if (typeof cell.v === 'number') cell.t = 'n';
            else if (typeof cell.v === 'boolean') cell.t = 'b';
            else if (cell.v instanceof Date) {
                cell.t = 'n';
                cell.z = XLSX.SSF._table[14];
                cell.v = datenum(cell.v);
            }
            else cell.t = 's';
            ws[cell_ref] = cell;
        }
    }
    if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
    return ws;
}
function Workbook() {
    if (!(this instanceof Workbook)) return new Workbook();
    this.SheetNames = [];
    this.Sheets = {};
}

function createExcel(customerList, userList, customerImplBatchList, res) {
    async.map(customerList, function(value, cb) {
        var customerRow = [];
        customerRow.push(value._id);

        customerRow.push(value.code);

        customerRow.push(value.name);

        var sex = '';
        if(value.sex) {
            var objSex = dictModel.getDictByTypeAndKey(dictionary.dictTypes.sex, value.sex);
            if(!_.isEmpty(objSex)) {
                sex = objSex.name;
            }
        }
        customerRow.push(sex);

        customerRow.push(value.telNo);
        customerRow.push(moment(value.birthday).format('YYYY-MM-DD'));
        if(value.email) {
            customerRow.push(value.email);
        }else {
            customerRow.push('');
        }

        if(!_.isEmpty(value.belongUser)) {
            customerRow.push(value.belongUser.areaName);
        }else {
            customerRow.push('');
        }

        var customerAddType = '';
        if(value.addType) {
            customerAddType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAddType, value.addType).name;
        }
        customerRow.push(customerAddType);

        var customerImplBatch = _.findWhere(customerImplBatchList, {_id: value.ImpBatchId});
        if(!_.isEmpty(customerImplBatch)) {
            customerRow.push(customerImplBatch.name);
        }else {
            customerRow.push('');
        }

        var consultant = '';
        if(value.belongUser) {
            var belongUser = _.findWhere(userList, {_id: value.belongUser});
            if(!_.isEmpty(belongUser)) {
                consultant = belongUser.username+ '-' +belongUser.realName;
            }
        }
        customerRow.push(consultant);

        var rm = '';
        if(value.manager) {
            var manager = _.findWhere(userList, {_id: value.manager});
            if(!_.isEmpty(manager)) {
                rm = manager.username+ '-' + manager.realName;
            }
        }
        customerRow.push(rm);

        var customerStatus = '';
        if(value.status) {
            customerStatus = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerStatus, value.status).name;
        }
        customerRow.push(customerStatus);

        var customerCallStatus = '';
        if(value.callStatus) {
            customerCallStatus = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerCallStatus, value.callStatus).name;
        }
        customerRow.push(customerCallStatus);

        var customerAuditStatus = '';
        if(value.auditStatus) {
            customerAuditStatus = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAuditStatus, value.auditStatus).name;
        }
        customerRow.push(customerAuditStatus);

        if(!_.isEmpty(value.tags)) {
            var tagStr = '';
            for(var i = 0; i < value.tags.length; i++){
                if(i == 0) {
                    tagStr = value.tags[i];
                }else {
                    tagStr += ','+value.tags[i];
                }
            }
            customerRow.push(tagStr);
        }else {
            customerRow.push('');
        }

        var houseInfo = '';
        if(value.houseInfo) {
            houseInfo = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerHouseInfos, value.houseInfo).name;
        }
        customerRow.push(houseInfo);

        var profession = '';
        if(!_.isEmpty(value.profession)) {
            if(value.profession.type) {
                profession = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerProfessionTypes, value.profession.type).name;
            }
        }
        customerRow.push(profession);

        if(value.workAddress) {
            customerRow.push(value.workAddress);
        }else {
            customerRow.push('');
        }

        if(value.wechatNo) {
            customerRow.push(value.wechatNo);
        }else {
            customerRow.push('');
        }

        if(value.carType) {
            customerRow.push(value.carType);
        }else {
            customerRow.push('');
        }

        if(value.comment) {
            customerRow.push(value.comment);
        }else {
            customerRow.push('');
        }

        var investmentTimePreference = '';
        if(value.investmentTimePreference) {
            investmentTimePreference = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerInvestmentTimePreference, value.investmentTimePreference).name;
        }
        customerRow.push(investmentTimePreference);
        var venturePreference = '';
        if(value.venturePreference) {
            venturePreference = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerVenturePreference, value.venturePreference).name;
        }
        customerRow.push(venturePreference);
        if(value.isLikeAction) {
            customerRow.push('是');
        }else {
            customerRow.push('否');
        }
        var bodyMass = '';
        if(value.bodyMass) {
            bodyMass = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerBodyMass, value.bodyMass).name;
        }
        customerRow.push(bodyMass);
        var investmentPreference = '';
        if(!_.isEmpty(value.investmentPreference)) {
            if(value.investmentPreference.type) {
                investmentPreference = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerInvestmentPreferenceTypes, value.investmentPreference.type).name;
            }
        }
        customerRow.push(investmentPreference);
        if(value.free) {
            customerRow.push('是');
        }else {
            customerRow.push('否');
        }

        if(value.callTimes) {
            customerRow.push(value.callTimes);
        }else {
            customerRow.push('');
        }


        if(value.wechatAuth) {
            customerRow.push('是');
        }else {
            customerRow.push('否');
        }

        var assignUser = '';
        if(value.assignUser) {
            var user = _.findWhere(userList, {_id: value.assignUser});
            if(!_.isEmpty(user)) {
                assignUser = user.username+ '-' + user.realName;
            }
        }
        customerRow.push(assignUser);

        if(value.assignTime) {
            customerRow.push(moment(value.assignTime).format('YYYY-MM-DD HH:mm:ss'));
        }else {
            customerRow.push('');
        }

        var lastCall = '';
        if(!_.isEmpty(value.lastCall)) {
            var lastCallUser = _.findWhere(userList, {_id: value.lastCall.lastCallUID});
            if(!_.isEmpty(lastCallUser)) {
                lastCall = lastCallUser.username + '-' + lastCallUser.realName;
            }
        }
        customerRow.push(lastCall);

        if(!_.isEmpty(value.lastCall)) {
            customerRow.push(moment(value.lastCall.lastCallDate).format('YYYY-MM-DD HH:mm:ss'));
        }else {
            customerRow.push('');
        }

        customerRow.push(value.cusername+ '-' + value.crealName);
        customerRow.push(moment(value.ctime).format('YYYY-MM-DD HH:mm:ss'));
        customerRow.push(value.uuserid+ '-' +value.urealName);
        customerRow.push(moment(value.utime).format('YYYY-MM-DD HH:mm:ss'));
        cb(null, customerRow);
    }, function(err, docs) {
        if(err) {
            logger.error('crm.customer.function.createExcel: ' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            var customerRows = [];
            setExcelConf(customerRows);
            var data = _.union(customerRows, docs);

            var ws_name = "SheetJS";
            var wb = new Workbook(), ws = sheet_from_array_of_arrays(data);
            wb.SheetNames.push(ws_name);
            wb.Sheets[ws_name] = ws;
            var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:false, type: 'binary'});
            res.json({wbout: wbout});
            //nodeExcel.execute(conf, function(err, result) {
            //    if(err) {
            //        logger.error('crm.customer.function.createExcel error:'+err.stack);
            //        res.json(500, {err: err.stack});
            //    }else {
            //        res.setHeader('Content-Type', 'application/xlsx');
            //        res.setHeader('Set-Cookie', 'fileDownload=true; path=/');
            //        res.setHeader("Content-Disposition", "attachment; filename=" +date+ encodeURI("导出数据.xlsx"));
            //        res.end(result, 'binary');
            //    }
            //});
        }
    });
}



function setExcelConf(customerRows) {
    var customerRow = [];
    customerRow.push('Id');
    customerRow.push('客户编号');
    customerRow.push('客户姓名');
    customerRow.push('性别');
    customerRow.push('手机号');
    customerRow.push('生日');
    customerRow.push('邮件');
    customerRow.push('归属');
    customerRow.push('添加方式');
    customerRow.push('批次号');
    customerRow.push('顾问');
    customerRow.push('RM');
    customerRow.push('客户状态');
    customerRow.push('拨打状态');
    customerRow.push('质检状态');
    customerRow.push('标签');
    customerRow.push('住房信息');
    customerRow.push('职业');
    customerRow.push('工作地址');
    customerRow.push('微信号');
    customerRow.push('车型');
    customerRow.push('备注');
    customerRow.push('投资期限偏好');
    customerRow.push('风险偏好');
    customerRow.push('是否愿意参加活动');
    customerRow.push('资金体量');
    customerRow.push('投资经验');
    customerRow.push('是否在公共池');
    customerRow.push('拨打次数');
    customerRow.push('是否微信认证');
    customerRow.push('分配人');
    customerRow.push('分配时间');
    customerRow.push('最后联系人');
    customerRow.push('最后联系时间');
    customerRow.push('创建人');
    customerRow.push('创建时间');
    customerRow.push('最后更新人');
    customerRow.push('最后更新时间');
    customerRows.push(customerRow);
}

function customerAdvancedParam(req, params, id) {
    var customerAdvanced = {};
    var opUser = {};
    opUser.uid = req.session.user._id;
    opUser.username = req.session.user.username;
    opUser.realName = req.session.user.realName;
    customerAdvanced.opUser = opUser;
    customerAdvanced.customerId = id;
    customerAdvanced.reason = params.reason;
    return customerAdvanced;
}

function isCustomer(customer) {
    if(_.isEmpty(customer) || _.isEmpty(customer.status)) {
        return false;
    }
    var customerStatusList = dictModel.getListByTypes([dictionary.dictTypes.customerStatus]);
    if(_.contains(_.pluck(customerStatusList, 'key'), customer.status)) {
        return true;
    } else {
        return false;
    }
}

function updateCustomerHistory(customer, customerHistory) {
    var changeColumns = [];
    delete customer._id;
    for(var col in customer) {
        if(_.isDate(customer[col])) {
            if(!_.isEqual(customer[col], customerHistory[col])){
                changeColumns.push(col);
            }
        }else if(_.isObject(customer[col])) {
            if(!_.isEqual(customer[col], customerHistory[col])){

            }
        }else {
            if(customer[col] != customerHistory[col]) {
                changeColumns.push(col);
            }
        }

    }
    return changeColumns;
}

exports.isCustomer = isCustomer;
