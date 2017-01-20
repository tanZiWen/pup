/**
 * Created by wangnan on 14-5-15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var CustomerImplBatch = exports.client = model.crm_customerImpl_batch;
var Customer = exports.client = model.crm_customer;
var userDao = require('../upm/userDao');
var taskDao = require('../../db/crm/taskDao');
var callListRequestDao = require('../../db/crm/callListRequestDao');

var importCustomerDao = require('../../db/crm/importCustomerDao');
var customerDao = require('../../db/crm/customerDao');

var areaModel = require('../../app/portal/areaModel');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var util = require('../../lib/utils');
var sender = require('../../routes/sender');
var sioHelper = require('../../lib/sioHelper');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string'),
    fs = require('fs'),
    G = require('../../lib/global'),
    http = require('http'),
    XLSX = require('xlsx');

exports.model = CustomerImplBatch;

exports.fileUpload = function(req, cb) {
    cb(null, req.files.file.name);
}

exports.create = function (req, cb) {
    var buyerId = req.body.buyer;
    var dataLevel = req.body.dataLevel;
    var belongAreaCode = req.body.area;
    var area = areaModel.getAreaByCode(belongAreaCode);
    var name = req.body.name;
    var comment = req.body.comment;
    var user = req.session.user;

    var tmpPath = G.UPLOAD_TMP_PATH + req.body.filename;


   var tasks = {};
    console.time("importData");
    tasks.buyer = function(next) {
        if(buyerId) {
            userDao.findById(buyerId, next);
        } else {
            next(null, null);
        }
        cb(null, true);

    }

    tasks.id = function(next) {
        idg.next(CustomerImplBatch.collection.name, next);
    }

    tasks.parseCustomers = function(next) {
//

        var data = '';

        var options = {
            host : G.DATE_IMPORT_SERVER_HOST,
            port : G.DATE_IMPORT_SERVER_PORT,
            path : '/v1/import/excel/' + req.body.filename,
            method : 'GET'
        };

        var importReq = http.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (resultData) {
                try{
                    console.log(resultData);
                    next(null, JSON.parse(resultData));
                } catch(e) {
                    next('parseErr', '文件格式有误，解析出错');
                }
            });
        });

        importReq.on('error', function(err) {
            console.log('problem with request: ' + err.message);
            next(err);
        });

        // write data to request body
        importReq.write('data\n');
        importReq.write('data\n');
        importReq.end();
    }

    tasks.importData = ['id', 'parseCustomers', function(next, data) {
        var batchId = parseInt(data.id.toString());
        var customerData = data.parseCustomers;
        var totalCount = customerData.totalNum;
        var tmpBatchId = customerData.batchNo;
        var successCount = 0;
        try{

            var steps = {};

            steps.tmpTotalCount = function(subNext) {
                importCustomerDao.client.count({batchNo : tmpBatchId}, subNext);
            }

            steps.saveCustomersFormTmpTable = ['tmpTotalCount', function(subNext, data) {
                var tmpSuccessCount = data.tmpTotalCount;

                var maxSize = 500;
                var loopCount = parseInt(Math.ceil(tmpSuccessCount / maxSize));

                var asyncSaveCustomerTask = {};
                var index = -1;
                var counter = 0;
                for(var loop = 0; loop < loopCount; loop ++) {
                    asyncSaveCustomerTask['asyncSaveCustomer' + loop] = function(atomNext) {
                        index ++;
                        importCustomerDao.client.find({batchNo : tmpBatchId}, {_id : 0, batchNo : 0}, {skip: index * maxSize, limit: maxSize}, function(err, docs) {
                            if(err) {
                                atomNext(err);
                            } else {
                                var telNos = [];
                                var records = [];
                                _.each(docs, function(doc) {
                                    telNos.push(_s.trim(doc.mobile));
                                    var customer = {};
                                    customer.name = _s.trim(doc.name);
                                    customer.telNo = _s.trim(doc.mobile);
                                    if(_.has(doc._doc, 'city')) {
                                        customer.city = _s.trim(doc.city);
                                    }
                                    if(_.has(doc._doc, 'sex')) {
                                        var sex = doc.sex;
                                        if( _s.trim(sex) == '男' || _s.trim(sex) == '先生') {
                                            customer.sex = dictionary.sex.male;
                                        }
                                        if( _s.trim(sex) == '女' || _s.trim(sex) == '女士') {
                                            customer.sex = dictionary.sex.female;
                                        }
                                    }
                                    records.push(customer);
                                });

                                customerDao.client.find({telNo : {$in : telNos}}, {_id : 1, telNo : 1}, function(err, docs) {
                                    if(err) {
                                        atomNext('dbErr', null);
                                    } else {
                                        var existTelNos = _.pluck(docs, 'telNo');
                                        var validRecords = [];
                                        _.each(records, function(record) {
                                            if(!_.contains(existTelNos, record.telNo)) {
                                                validRecords.push(record);
                                            }
                                        });

                                        var batchGenerator = [];

                                        _.each(validRecords, function(record) {
                                            var genId = function(atomCb) {
                                                idg.next(Customer.collection.name, function(err, result) {
                                                    if(!err) {
                                                        record._id = parseInt(result.toString());
                                                        record.code = util.strFill(record._id, '0', 'left', 10);
//                                                        record.status = dictionary.customerCallStatus.noCall;
                                                        record.preid = parseInt(result.toString());
                                                        record.belongArea = {areaCode : area.code, areaName : area.name};
                                                        record.wechatAuth = false;
                                                        record.callTimes = 0;
                                                        record.free = true;
                                                        record.ImpBatchId = batchId;
                                                        record.addType = dictionary.customerAddType.batch;
                                                        //record.random = [Math.random() * 180, Math.random() * 180];

                                                        record.cuserid = user._id;
                                                        record.cusername = user.username;
                                                        record.crealName = user.realName;
                                                        record.uuserid = user._id;
                                                        record.uusername = user.username;
                                                        record.urealName = user.realName;
                                                        record.ctime = Date.now();
                                                        record.utime = Date.now();
                                                        successCount ++;
                                                        atomCb(null, true);
                                                    } else {
                                                        atomCb(err, null);
                                                    }
                                                });
                                            }
                                            batchGenerator.push(genId);
                                        });
                                        //batch generate cutomer id
                                        if(batchGenerator.length > 0) {
                                            async.parallelLimit(batchGenerator, 2, function(err, results) {
                                                if(!err) {
                                                    Customer.create(validRecords, function(err, result) {
                                                        counter ++;
                                                        if(!err) {
                                                            atomNext(null, true);
                                                        } else {
                                                            atomNext(err, null);
                                                        }
                                                    });
                                                } else {
                                                    atomNext(err, null);
                                                }
                                            })
                                        } else {
                                            atomNext(null, true);
                                        }
                                    }
                                });
                            }
                        });
                    }

                }

                async.parallelLimit(asyncSaveCustomerTask, 2, function(err, result) {
                    if(err) {
                        subNext(err);
                    } else {
                        subNext(null, {totalCount : totalCount, successCount : successCount});
                    }
                });

            }];

            async.auto(steps, function(err, data) {
                if(err) {
                    next('dbErr', '数据库插入异常');
                } else {
                    next(null, data.saveCustomersFormTmpTable);
                }
            });
        } catch(e) {
            next('parseErr', '文件格式有误，解析出错');
        }
    }];

    tasks.removeTmpData = ['parseCustomers', 'importData', function(next, data) {
        var customerData = data.parseCustomers;
        var tmpBatchId = customerData.batchNo;
        importCustomerDao.client.remove({batchNo : tmpBatchId}, function(err) {
            if(err) {
                logger.error(err.stack);
            }
            next(null, true);
        });
    }];


    tasks.insertBatch = ['id', 'importData', 'buyer', function(next, data) {
        var id = parseInt(data.id.toString());
        var importData = data.importData;
        var buyer = data.buyer;
        var batch = {};
        batch._id = id;
        batch.name = name;
        batch.dataLevel = dataLevel;
        if(buyer != null && buyer != undefined)
            batch.buyer = {userid : buyer._id, username : buyer.username, realName : buyer.realName};
        batch.belongArea = {areaCode : area.code, areaName : area.name};
        batch.totalCount = importData.totalCount;
        batch.successCount = importData.successCount;
        batch.freeCount = importData.totalCount;
        batch.unbcCount = batch.successCount;
        batch.bcCount = 0;
        batch.noCallCount = batch.successCount;
        batch.callCount = 0;
        batch.availableCount = batch.successCount;
        batch.assign = [];
        batch.comment = comment;

        batch.cuserid = user._id;
        batch.cusername = user.username;
        batch.crealName = user.realName;
        batch.uuserid = user._id;
        batch.uusername = user.username;
        batch.urealName = user.realName;
        batch.ctime = Date.now();
        batch.utime = Date.now();

        CustomerImplBatch(batch).save(function(err, result){
            if(!err) {
                next(null, {totalCount : importData.totalCount, successCount : importData.successCount, batch : result});
            } else {
                next(err);
            }
        });

    }];

    if(fs.existsSync(tmpPath)) {
        async.auto(tasks, function(err, data) {
            fs.unlink(tmpPath);
            console.timeEnd("importData");
            if(err) {
                logger.error(err.stack);
            } else {
                logger.info('totalCount :' + data.insertBatch.totalCount + ', successCount :' + data.insertBatch.successCount);
            }
//            if(err) {
//                if(data.importData != undefined) {
//                    cb(err, data.importData);
//                } else if(data.insertBatch != undefined) {
//                    cb(err, data.insertBatch);
//                } else {
//                    cb(err);
//                }
//            } else {
//                cb(null, data.insertBatch);
//            }
        });
    } else {
        logger.info('文件不存在');
//        cb('noFile', '文件不存在');
    }

};

exports.findOne = function(where, cb) {
    CustomerImplBatch.findOne(where, cb);
}

exports.modify = function (params, cb) {
    var _id = parseInt(params._id);
    delete params._id;
    CustomerImplBatch.update({_id : _id}, params, cb);
};

exports.find = function (where, cb) {
    CustomerImplBatch.find(where, {}, cb);
}

exports.findAndSort = function (where, sort, cb) {
    CustomerImplBatch.find(where).sort(sort).exec(cb);
}


exports.count = function (where, cb) {
    CustomerImplBatch.aggregate(
        {$match: where},
        {$group:{_id: null, count: {$sum: '$availableCount'}}}
    ).exec(cb);
}

exports.availableCount = function (where, cb) {
    CustomerImplBatch.aggregate(
        {$match: where},
        {$group:{_id: null, count: {$sum: '$availableCount'}}}
    ).exec(cb);
}

exports.bcCount = function (where, cb) {
    CustomerImplBatch.aggregate(
        {$match: where},
        {$group:{_id: null, count: {$sum: '$bcCount'}}}
    ).exec(cb);
}

exports.unbcCount = function (where, cb) {
    CustomerImplBatch.aggregate(
        {$match: where},
        {$group:{_id: null, count: {$sum: '$unbcCount'}}}
    ).exec(cb);
}

exports.callCount = function (where, cb) {
    CustomerImplBatch.aggregate(
        {$match: where},
        {$group:{_id: null, count: {$sum: '$callCount'}}}
    ).exec(cb);
}

exports.noCallCount = function (where, cb) {
    CustomerImplBatch.aggregate(
        {$match: where},
        {$group:{_id: null, count: {$sum: '$noCallCount'}}}
    ).exec(cb);
}

exports.findById = function (_id, cb) {
    CustomerImplBatch.findById(_id, cb);
}

exports.modifyById = function(id, params, cb) {
    CustomerImplBatch.update({_id: id}, params, cb);
}


exports.delete = function (_id, cb) {

}

/**
 * 数据分配
 * @param params
 * @param cb
 */
exports.assign = function(params, user, cb) {
    var steps = {};
    var batchIds = params.batchIds;
    var status = params.status;
    var totalCount = params.totalCount;
    var assignData = params.assignData;
    var requestId = params.requestId;
    var clearPotential = params.clearPotential;
    var bcRuleType = params.bcRuleType;
    var callType = params.callType;

    var potentialPercent = 0.005;
    var potentialData = [];
    var realUserPotentialMap = [];
    var totalPotentialCount = 0;
    var noCallAssignData = [];
    //console.log(params);

    steps.userData = function(next) {
        var userIds = _.pluck(assignData, 'userId');
        userDao.find({_id : {$in : userIds}}, next);
    };

    if(status != '1') {
        steps.parseData = function(next) {
            _.each(assignData, function(assignItem) {
                var curPotentialCount = parseInt(Math.floor(assignItem.count * potentialPercent));
                potentialData.push({userId : assignItem.userId, count : curPotentialCount});
                totalPotentialCount += curPotentialCount;
            });
            next(null, true);
        };

        steps.potentialCount = function(next) {
            if(callType && callType == '1') {
                next(null, 0);
            } else {
                var where = { free : true, status : dictionary.customerStatus.potential, callStatus : {$ne : dictionary.customerCallStatus.vacant}};
                if(_.contains(batchIds, '0') && params['belongArea.areaCode']) {
                    var filterBatchIds = _.without(batchIds, '0');
                    where['$or'] = [{ImpBatchId : {$in : filterBatchIds}}, {ImpBatchId : 0, 'belongArea.areaCode' : params['belongArea.areaCode']}];
                } else {
                    where.ImpBatchId = {$in : batchIds};
                }
                Customer.count(where, next);
            }

        };

        steps.potentialFilter = ['parseData', 'potentialCount', function(next, data) {
            if(callType && callType == '1') {
                totalPotentialCount = 0;
                next(null, []);
            } else {
                totalPotentialCount = data.potentialCount >= totalPotentialCount ? totalPotentialCount : data.potentialCount;
                var where = { free : true, status : dictionary.customerStatus.potential, callStatus : {$ne : dictionary.customerCallStatus.vacant}};
                if(_.contains(batchIds, '0') && params['belongArea.areaCode']) {
                    var filterBatchIds = _.without(batchIds, '0');
                    where['$or'] = [{ImpBatchId : {$in : filterBatchIds}}, {ImpBatchId : 0, 'belongArea.areaCode' : params['belongArea.areaCode']}];
                } else {
                    where.ImpBatchId = {$in : batchIds};
                }

                Customer.find(where,
                    {'_id' : 1, 'ImpBatchId' : 1}, {sort: [{'lastCall.lastCallDate' : 1}], skip : 0, limit : totalPotentialCount}, next);
            }
        }];

        steps.etlPotentialData = ['potentialFilter', function(next, data) {
            //console.log(data.unassigneds);
            var customerIds = data.potentialFilter;
            var i = 1;
            var batchMap = {};
            var userMap = {};
            var batchUserMap = {};
            var index = 0;
            var curUserId = parseInt(potentialData[index].userId);
            var assignCount = parseInt(potentialData[index].count);
            userMap[curUserId] = [];

            _.each(customerIds, function(doc) {
                var customerId = doc._id;
                var batchId = doc.ImpBatchId;
                if(i <= assignCount) {
                    userMap[curUserId].push(customerId);
                } else {
                    index ++;
                    i = 1;
                    if(assignData.length > index) {
                        curUserId = assignData[index].userId;
                        assignCount = assignData[index].count;
                        userMap[curUserId] = [];
                        userMap[curUserId].push(customerId);
                    }
                }

                if(_.has(realUserPotentialMap, curUserId + '')) {
                    realUserPotentialMap[curUserId + ''] ++;
                } else {
                    realUserPotentialMap[curUserId + ''] = 1;
                }

                if(_.has(batchUserMap, batchId + "-" + curUserId)) {
                    batchUserMap[batchId + "-" + curUserId] ++;
                } else {
                    batchUserMap[batchId + "-" + curUserId] = 1;
                }

                if(_.has(batchMap, batchId + '')) {
                    var batchData = batchMap[batchId + ''];
                    batchData.totalCount += 1;
                    if(!_.contains(batchData.userIds, curUserId)) {
                        batchData.userIds.push(curUserId);
                    }
                } else {
                    batchMap[batchId + ''] = {totalCount: 1, userIds : [curUserId]};
                }
                i ++;
            });

            next(null, {userMap : userMap, batchMap : batchMap, batchUserMap : batchUserMap});
        }];

        steps.separateUserData = ['etlPotentialData', function(next, data) {
            _.each(assignData, function(assignItem) {
                var curUserId = parseInt(assignItem.userId);
                var assignCount = parseInt(assignItem.count);
                if(_.has(realUserPotentialMap, curUserId + '')) {
                    noCallAssignData.push({userId : curUserId, count : assignCount - realUserPotentialMap[curUserId + '']});
                } else {
                    noCallAssignData.push({userId : curUserId, count : assignCount});
                }
            });
            next(null, true);
        }];

        steps.unassigneds = ['potentialFilter', function(next, data) {

            var where = {free : true, callStatus : {$ne : dictionary.customerCallStatus.vacant}};
            if(callType) {
                if(callType == '0') {
                    where.lastCall = {$ne : null};
                } else {
                    where.lastCall = null;
                }
            }

            if(_.contains(batchIds, '0') && params['belongArea.areaCode']) {
                var filterBatchIds = _.without(batchIds, '0');
                where['$or'] = [{ImpBatchId : {$in : filterBatchIds}}, {ImpBatchId : 0, 'belongArea.areaCode' : params['belongArea.areaCode']}];
            } else {
                where.ImpBatchId = {$in : batchIds};
            }

            where.status = {$in : [null, '']};

            Customer.find(where,
                {'_id' : 1, 'ImpBatchId' : 1}, {sort: [{'lastCall.lastCallDate' : 1}], skip : 0, limit : totalCount - totalPotentialCount}, function(err, docs) {
                    next(err, {customerIds : docs, potentialCustomerIds : data.potentialFilter});
                });
        }];

        steps.etlNoCallData = ['unassigneds', 'separateUserData', function(next, data) {
            var customerIds = data.unassigneds.customerIds;
            var i = 1;
            var batchMap = {};
            var userMap = {};
            var batchUserMap = {};
            var index = 0;
            var curUserId = parseInt(noCallAssignData[index].userId);
            var assignCount = parseInt(noCallAssignData[index].count);
            userMap[curUserId] = [];
            _.each(customerIds, function(doc) {
                var customerId = doc._id;
                var batchId = doc.ImpBatchId;
                if(i <= assignCount) {
                    userMap[curUserId].push(customerId);
                } else {
                    index ++;
                    i = 1;
                    if(assignData.length > index) {
                        curUserId = noCallAssignData[index].userId;
                        assignCount = noCallAssignData[index].count;
                        userMap[curUserId] = [];
                        userMap[curUserId].push(customerId);
                    }
                }

                if(_.has(batchUserMap, batchId + "-" + curUserId)) {
                    batchUserMap[batchId + "-" + curUserId] ++;
                } else {
                    batchUserMap[batchId + "-" + curUserId] = 1;
                }

                if(_.has(batchMap, batchId + '')) {
                    var batchData = batchMap[batchId + ''];
                    batchData.totalCount += 1;
                    if(!_.contains(batchData.userIds, curUserId)) {
                        batchData.userIds.push(curUserId);
                    }
                } else {
                    batchMap[batchId + ''] = {totalCount: 1, userIds : [curUserId]};
                }
                i ++;
            });

            next(null, {userMap : userMap, batchMap : batchMap, batchUserMap : batchUserMap});
        }];

        steps.mergeData = ['etlPotentialData', 'etlNoCallData', function(next, data) {
            var noCallBatchMap = data.etlNoCallData.batchMap;
            var noCallUserMap = data.etlNoCallData.userMap;
            var noCallBatchUserMap = data.etlNoCallData.batchUserMap;

            var potentialBatchMap = data.etlPotentialData.batchMap;
            var potentialUserMap = data.etlPotentialData.userMap;
            var potentialBatchUserMap = data.etlPotentialData.batchUserMap;



            _.each(_.keys(potentialBatchMap), function(batchId) {
                if(_.has(noCallBatchMap, batchId)) {
                    noCallBatchMap[batchId].totalCount += potentialBatchMap[batchId].totalCount;
                    noCallBatchMap[batchId].userIds = _.union(noCallBatchMap[batchId].userIds, potentialBatchMap[batchId].userIds);
                } else {
                    noCallBatchMap[batchId] = potentialBatchMap[batchId];
                }
            });

            _.each(_.keys(potentialUserMap), function(userId) {
                if(_.has(noCallUserMap, userId)) {
                    noCallUserMap[userId] = _.union(noCallUserMap[userId], potentialUserMap[userId]);
                } else {
                    noCallUserMap[userId] = potentialUserMap[userId];
                }
            });

            _.each(_.keys(potentialBatchUserMap), function(batchUserId) {
                if(_.has(noCallBatchUserMap, batchUserId)) {
                    noCallBatchUserMap[batchUserId] += potentialBatchUserMap[batchUserId];
                } else {
                    noCallBatchUserMap[batchUserId] = potentialBatchUserMap[batchUserId];
                }
            });

            next(null, {userMap : noCallUserMap, batchMap : noCallBatchMap, batchUserMap : noCallBatchUserMap});

        }];

    } else {
        steps.unassigneds = function(next) {
            var where = {free : true, callStatus : {$ne : dictionary.customerCallStatus.vacant}};

            if(_.contains(batchIds, '0') && params['belongArea.areaCode']) {
                var filterBatchIds = _.without(batchIds, '0');
                where['$or'] = [{ImpBatchId : {$in : filterBatchIds}}, {ImpBatchId : 0, 'belongArea.areaCode' : params['belongArea.areaCode']}];
            } else {
                where.ImpBatchId = {$in : batchIds};
            }

            where.status = {$in : [dictionary.customerStatus.bc20, dictionary.customerStatus.bc40]};

            var options = {skip : 0, limit : totalCount};

            if(bcRuleType != undefined) {
                if(bcRuleType == '0') {
                    options.sort = [{'lastCall.lastCallDate' : -1}];
                } else if(bcRuleType == '1') {
                    options.sort = [{'lastCall.lastCallDate' : 1}];
                }
            }

            Customer.find(where,
                {'_id' : 1, 'ImpBatchId' : 1}, options, function(err, docs) {
                    next(err, {customerIds : docs, potentialCustomerIds : []});
                });
        };

        steps.etlData = ['unassigneds', function(next, data) {
            //console.log(data.unassigneds);
            var customerIds = data.unassigneds.customerIds;
            var i = 1;
            var batchMap = {};
            var userMap = {};
            var batchUserMap = {};
            var index = 0;
            var curUserId = parseInt(assignData[index].userId);
            var assignCount = parseInt(assignData[index].count);
            userMap[curUserId] = [];
            _.each(customerIds, function(doc) {
                var customerId = doc._id;
                var batchId = doc.ImpBatchId;
                if(i <= assignCount) {
                    userMap[curUserId].push(customerId);
                } else {
                    index ++;
                    i = 1;
                    if(assignData.length > index) {
                        curUserId = assignData[index].userId;
                        assignCount = assignData[index].count;
                        userMap[curUserId] = [];
                        userMap[curUserId].push(customerId);
                    }
                }

                if(_.has(batchUserMap, batchId + "-" + curUserId)) {
                    batchUserMap[batchId + "-" + curUserId] ++;
                } else {
                    batchUserMap[batchId + "-" + curUserId] = 1;
                }

                if(_.has(batchMap, batchId + '')) {
                    var batchData = batchMap[batchId + ''];
                    batchData.totalCount += 1;
                    if(!_.contains(batchData.userIds, curUserId)) {
                        batchData.userIds.push(curUserId);
                    }
                } else {
                    batchMap[batchId + ''] = {totalCount: 1, userIds : [curUserId]};
                }
                i ++;
            });


            next(null, {userMap : userMap, batchMap : batchMap, batchUserMap : batchUserMap});
        }];

        steps.mergeData = ['etlData', function(next, data) {
            next(null, data.etlData);
        }];
    }

    steps.refreshBatchRecord = ['mergeData', 'userData', function(next, data) {
        var batchMap = data.mergeData.batchMap;
        var batchUserMap = data.mergeData.batchUserMap;
        var userMap = _.indexBy(data.userData, '_id');
        var userCusMap = data.mergeData.userMap;

        var subTask = {};

        _.each(_.keys(batchMap), function(batchId) {
            if(batchId != '0') {
                subTask['saveRecord' + batchId] = function(subNext) {
                    var assignItem = {};
                    assignItem.assignCount = batchMap[batchId].totalCount;
                    assignItem.assignTo = [];
                    _.each(batchMap[batchId].userIds, function(userId) {
                        var assignToUser = {};
                        assignToUser.userid = userId;
                        assignToUser.username = userMap[userId].username;
                        assignToUser.realName = userMap[userId].realName;
                        assignToUser.count = batchUserMap[batchId + "-" + userId];
                        assignItem.assignTo.push(assignToUser);
                    });
                    assignItem.userid = user._id;
                    assignItem.username = user.username;
                    assignItem.realName = user.realName;
                    assignItem.ctime = new Date();

                    var updateOptions = {};

                    updateOptions.uuserid = user._id;
                    updateOptions.uusername = user.username;
                    updateOptions.urealName = user.realName;
                    updateOptions.utime = new Date();

                    updateOptions.$push = {assign : assignItem};
                    updateOptions.$inc = {freeCount : -(assignItem.assignCount), availableCount : -(assignItem.assignCount)};

                    CustomerImplBatch.update({_id : parseInt(batchId)}, updateOptions, function(err, result) {
                        if(err) {
                            logger.error(err.stack);
                            subNext(err);
                        } else {
                            subNext(null, true);
                        }
                    });
                }
            }
        });
        async.parallel(subTask, next);
    }];

    steps.assign = ['mergeData', function(next, data) {
        var userMap = data.mergeData.userMap;
        var subTask = {};
        _.each(_.keys(userMap), function(userId) {
            subTask[userId] = function(subNext) {
                var customerIds = userMap[userId];
                var updateOptions = {};
                
                updateOptions.free = false;
                updateOptions.belongUser = userId;
                updateOptions.callStatus = dictionary.customerCallStatus.noCall;
                updateOptions.assignUser = user._id;
                updateOptions.assignTime = new Date();
                if(clearPotential == '1' && status != '1') {
                    updateOptions.status = '';
                }

                Customer.update({_id : {$in : customerIds}}, updateOptions, {'multi' : true}, function(err, result) {
                    console.log(result + '-----' + userId);
                    if(err) {
                        logger.error(err.stack);
                        subNext(err);
                    } else {
                        subNext(null, true);
                    }
                });
            }
        });
        async.parallel(subTask, next);
    }];

    steps.resetBatchDataCount = ['assign', 'refreshBatchRecord', 'mergeData', function(next, data) {
        var batchMap = data.mergeData.batchMap;
        var subTask = {};

        _.each(_.keys(batchMap), function(batchId) {
            if(batchId != '0') {
                subTask['resetDataCount' + batchId] = function(subNext) {
                    var subTaskSteps = {};
                    subTaskSteps.totalCount = function(subCb) {
                        Customer.count({ImpBatchId: parseInt(batchId), free : true, callStatus : {$ne: dictionary.customerCallStatus.vacant}}, subCb);
                    };

                    subTaskSteps.unbcCount = function(subCb) {
                        Customer.count({ImpBatchId: parseInt(batchId), status : {$in : [null, '', dictionary.customerStatus.potential]}, callStatus : {$ne: dictionary.customerCallStatus.vacant}, free : true}, subCb);
                    };

                    subTaskSteps.bcCount = function(subCb) {
                        Customer.count({ImpBatchId: parseInt(batchId), status : {$in : ['bc20', 'bc40']}, free : true}, subCb);
                    };

                    subTaskSteps.callCount = function(cb) {
                        Customer.count({ImpBatchId: parseInt(batchId), status : {$in : [null, '', dictionary.customerStatus.potential]}, free : true, callStatus : {$ne: dictionary.customerCallStatus.vacant}, lastCall : {$ne : null}}, cb);
                    };

                    subTaskSteps.updateBatchCount = ['totalCount', 'unbcCount', 'bcCount', 'callCount', function(subCb, data) {
                        var totalCount = data.totalCount;
                        var bcCount = data.bcCount;
                        var unbcCount = data.unbcCount;
                        var callCount = data.callCount;
                        var noCallCount = unbcCount - callCount;
                        CustomerImplBatch.update({_id : parseInt(batchId)}, {freeCount : totalCount, availableCount: totalCount, bcCount: bcCount, unbcCount: unbcCount, callCount: callCount, noCallCount: noCallCount}, subCb);
                    }];

                    async.auto(subTaskSteps, subNext);

                }
            }
        });
        async.parallel(subTask, next);
    }];

    if(requestId != null && requestId != "" && requestId != undefined) {

        steps.callListRequest = function(next) {
            callListRequestDao.findById(requestId, next);
        };

        steps.resetCallListRequest = ['assign', function(next, data) {
            callListRequestDao.assign(requestId, next);
        }];

        steps.findTask = ['callListRequest', function(next, data) {
            taskDao.findOne({_id : data.callListRequest.taskId}, next);
        }];

        steps.taskDone = ['resetCallListRequest', 'findTask', function(next, data) {
            if(data.callListRequest) {
                taskDao.client.update({_id : data.callListRequest.taskId}, {done : true, doneTime : new Date(), 'refObj.status' : dictionary.callListRequestStatus.assigned}, function(err, result) {
                    if(err) {
                        logger.error('db.crm.customerImplBatchDao.assign.taskDone error: ' + err.stack);
                        next(err);
                    }else {
                        sender.refreshTaskCountByUserIds(sioHelper.get(), data.findTask.belongUser, {});
                        next(null, result);
                    }
                });
            } else {
                next(null);
            }
        }];
    }

    async.auto(steps, cb);
}

exports.refreshBatchCount = function(batchIds, cb) {
    var subTask = {};
    batchIds = [10039];
    _.each(batchIds, function(batchId) {
        if(batchId != 0) {
            subTask['resetDataCount' + batchId] = function(subNext) {
                var subTaskSteps = {};
                subTaskSteps.totalCount = function(subCb) {
                    Customer.count({ImpBatchId: parseInt(batchId), free : true, callStatus : {$ne: dictionary.customerCallStatus.vacant}}, subCb);
                };

                subTaskSteps.unbcCount = function(subCb) {
                    Customer.count({ImpBatchId: parseInt(batchId), status : {$in : [null, '', dictionary.customerStatus.potential]}, free : true, callStatus : {$ne: dictionary.customerCallStatus.vacant}}, subCb);
                };

                subTaskSteps.bcCount = function(subCb) {
                    Customer.count({ImpBatchId: parseInt(batchId), status : {$in : ['bc20', 'bc40']}, free : true}, subCb);
                };

                subTaskSteps.callCount = function(cb) {
                    Customer.count({ImpBatchId: parseInt(batchId), status : {$in : [null, '', dictionary.customerStatus.potential]}, free : true, callStatus : {$ne: dictionary.customerCallStatus.vacant}, lastCall : {$ne : null}}, cb);
                };

                subTaskSteps.updateBatchCount = ['totalCount', 'unbcCount', 'bcCount', 'callCount', function(subCb, data) {
                    var totalCount = data.totalCount;
                    var bcCount = data.bcCount;
                    var unbcCount = data.unbcCount;
                    var callCount = data.callCount;
                    var noCallCount = unbcCount - callCount;
                    CustomerImplBatch.update({_id : parseInt(batchId)}, {freeCount : totalCount, availableCount: totalCount, bcCount: bcCount, unbcCount: unbcCount, callCount: callCount, noCallCount: noCallCount}, subCb);
                }];

                async.auto(subTaskSteps, subNext);

            }
        }
    });
    async.parallel(subTask, cb);
}

exports.update = function(where, updateOptions, cb) {
    CustomerImplBatch.update(where, updateOptions, cb);
}


