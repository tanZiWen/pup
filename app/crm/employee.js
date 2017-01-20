/**
 *
 * User: wuzixiu
 * Date: 2/16/14
 * Time: 1:09 PM
 */

var model = exports.model = require('../../db/crm/model'),
    db = exports.db = model.db,
    Employee = exports.client = model.crm_employee,
    employeeDao = require('../../db/crm/employeeDao'),
    taskDao = require('../../db/crm/taskDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore'),
    idg = require('../../db/idg'),
    Pagination = require('../../lib/Pagination'),
    dictModel = require('../portal/dictModel'),
    orgModel = require('../portal/orgModel'),
    userDao = require('../../db/upm/userDao'),
    workgroupDao = require('../../db/upm/workgroupDao'),
    async = require('async'),
    customerAdvancedOpLogDao = require('../../db/crm/customerAdvancedOpLog'),
    asyncProcessor = require('../../lib/MessageProcessor');


var XLSX = require('xlsx');
var md5 = require('MD5');

var wechatAccountContactDao = require('../../db/crm/wechatAccountContactDao');
var wechatTelNoDao = require('../../db/crm/wechatTelNoDao');
var customerDao = require('../../db/crm/customerDao');
var customerImplBatchDao = require('../../db/crm/customerImplBatchDao');

var logger = require('../../lib/logFactory').getModuleLogger(module);

var _ = require('underscore'),
    _s = require('underscore.string');

exports.list = function (req, res) {
    var sexList = dictModel.getDictByType(dictionary.dictTypes.sex);
    var statusList = dictModel.getDictByType(dictionary.dictTypes.employeeStatus);
    var rootOrg = orgModel.getRootOrgs();
    var departments;
    if(rootOrg.length == 0){
        departments = [];
    }else {
        departments = orgModel.getDepartsByParentCode(rootOrg[0].code);
    }
    var data = {};

    data.sexList = sexList;
    data.statusList = statusList;
    data.rootOrg = rootOrg;
    data.departments = departments;
    res.json(data);
};

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

exports.dataList = function (req, res) {

//    customerDao.client.find({status : {$in : ['bc20', 'bc40', 'bc60']}, wechatCurScanStatus : 0, telNo : /^(130|131|132|134|135|136|137|138|139|147|150|151|152|155|156|157|158|159|185|186|187|188)\d{8}$/}, {_id: 1, telNo : 1, sex : 1, profession : 1, bodyMass : 1}, {skip : 0, limit : 20000}, function(err, customers) {
//        var index = 0;
//        var customerIds = [];
//        async.map(customers, function(customer, cb) {
//            customerIds.push(customer._id);
//            var customerRow = [];
//            customerRow.push(md5('86' + customer.telNo));
//            if(customer.sex) {
//                customerRow.push(dictModel.getDictByTypeAndKey('sex', customer.sex).name);
//            } else {
//                customerRow.push('');
//            }
//            if(customer._doc.bodyMass) {
//                customerRow.push(dictModel.getDictByTypeAndKey('customerBodyMass', customer.bodyMass).name);
//            } else {
//                customerRow.push('');
//            }
//            if(_.has(customer._doc, 'profession') && _.has(customer._doc.profession, 'type')) {
//                customerRow.push(dictModel.getDictByTypeAndKey('customerProfessionTypes', customer.profession.type).name);
//            } else {
//                customerRow.push('');
//            }
//            index ++;
//            console.log(index);
//            cb(null, customerRow);
//        }, function(err, docs) {
//            customerDao.client.update({_id: {$in : customerIds}}, {wechatCurScanStatus : 1}, {multi : true}, function(err, result) {
//                console.log(result);
//            });
//            if(err) {
//                logger.error('export excel data error: ' + err.stack);
//            }else {
//                var customerRows = [['手机号', '性别', '体量', '职业']];
//                var data = _.union(customerRows, docs);
//
//                var ws_name = "SheetJS";
//                var wb = new Workbook(), ws = sheet_from_array_of_arrays(data);
//                wb.SheetNames.push(ws_name);
//                wb.Sheets[ws_name] = ws;
//                XLSX.writeFile(wb, '/work/商机客户统计信息.xlsx');
//                console.log('export data successfully.');
//            }
//        });
//
//    });

//    var userIds = [1000035];
//    var i = 0;
//    //    customerDao.client.find({$or : [{'businessIndex.connectedCount' : {$gt : 0}}, {'businessIndex.refusedCount' : {$gt : 0}}], 'belongArea.areaCode': 'SH', tags : {$nin:['分级']}, free : true}, {_id:1}, {skip : 0, limit : 2000},function(err, docs) {
//    customerDao.client.find({'businessIndex' : {$exists : false}, 'belongArea.areaCode': 'SH', free : true}, {_id:1}, {skip : 0, limit : 2000}, function(err, docs) {
//        var steps = {};
//        _.each(docs, function(customer) {
//            steps[customer._id + ''] = function(next) {
//                i ++;
//                console.log(i);
//                if(i <= 2000) {
//                    customerDao.client.update({_id : customer._id}, {free : false, belongUser : 1000003, callStatus: 'noCall', assignTime: new Date()}, next);
//                } else {
//                    next(null, true);
//                }
//            }
//        });
//        async.parallelLimit(steps, 1, function(err ,result) {
//            console.log('successful');
//        });
//    });


//    var excludeAccountCodes = ['1'];
//    wechatAccountContactDao.client.find({'belongAccount.accountCode' : {$nin : excludeAccountCodes}}, {comment : 1}, function(err, docs) {
//        if(!err) {
//            var telNos = [];
//            _.each(docs, function(doc) {
//                var telNo = doc.comment.trim();
//                if(!_s.include(telNo, "a") && !_s.include(telNo, "A")) {
//                    telNo = telNo.substring(telNo.length - 11);
//                    if(!_.contains(telNos, telNo)) {
//                        telNos.push({telNo : telNo});
//                    }
//                }
//            });
//            wechatTelNoDao.client.create(telNos, function(err, result) {
//                if(!err) {
//                    console.log('Create telNos of account successful');
//                }
//            });
//        }
//    });


//    var excludeAccountCodes = ['1'];
//    wechatAccountContactDao.client.find({'belongAccount.accountCode' : {$nin : excludeAccountCodes}}, {comment : 1}, function(err, docs) {
//        if(!err) {
//            var telNos = [];
//            _.each(docs, function(doc) {
//                var telNo = doc.comment.trim();
//                telNo = telNo.substring(telNo.length - 11);
//                if(!_.contains(telNos, telNo)) {
//                    telNos.push({telNo : telNo});
//                }
//            });
//            customerDao.client.find({wechatAuth:true, wechatManager: null}, {telNo:1}, function(err, docs) {
//                if(!err) {
//                    var vallidTelNos = _.pluck(docs, 'telNo');
//                    telNos = [];
//                    _.each(vallidTelNos, function(telNo) {
//                        if(!_.contains(telNos, telNo)) {
//                            telNos.push({telNo : telNo});
//                        }
//                    });
//                    wechatTelNoDao.client.create(telNos, function(err, result) {
//                        if(!err) {
//                            console.log('Create telNos of account successful');
//                        }
//                    });
//                }
//            });
//        }
//    });


//    customerImplBatchDao.model.find({}, function(err, batchs) {
//        var subTask = {};
//
//        _.each(batchs, function(batch) {
//            subTask['resetDataCount' + batch._doc._id] = function(subNext) {
//                var steps = {};
//
//                steps.totalCount = function(cb) {
//                    customerDao.client.count({ImpBatchId: batch._doc._id, free : true, callStatus : {$ne: dictionary.customerCallStatus.vacant}}, cb);
//                }
//
//                steps.unbcCount = function(cb) {
//                    customerDao.client.count({ImpBatchId: batch._doc._id, status : {$in : [null, '', dictionary.customerStatus.potential]}, free : true, callStatus : {$ne: dictionary.customerCallStatus.vacant}}, cb);
//                }
//
//                steps.bcCount = function(cb) {
//                    customerDao.client.count({ImpBatchId: batch._doc._id, status : {$in : ['bc20', 'bc40']}, free : true}, cb);
//                }
//
//                steps.callCount = function(cb) {
//                    customerDao.client.count({ImpBatchId: batch._doc._id, status : {$in : [null, '', dictionary.customerStatus.potential]}, free : true, callStatus : {$ne: dictionary.customerCallStatus.vacant}, lastCall : {$ne : null}}, cb);
//                }
//
//                steps.updateBatchCount = ['totalCount', 'bcCount', 'unbcCount', 'callCount', function(cb, data) {
//                    var totalCount = data.totalCount;
//                    var bcCount = data.bcCount;
//                    var unbcCount = data.unbcCount;
//                    var callCount = data.callCount;
//                    var noCallCount = unbcCount - callCount;
//                    customerImplBatchDao.model.update({_id : batch._doc._id}, {freeCount : totalCount, availableCount: totalCount, bcCount: bcCount, unbcCount: unbcCount, callCount: callCount, noCallCount: noCallCount}, cb);
//                }];
//
//                async.auto(steps, subNext);
//
//            }
//        });
//        async.parallel(subTask, function(err) {
//            console.log('successful');
//        });
//    });



//    var user = req.session.user;
//    wechatTelNoDao.client.find({}, function(err, docs) {
//        if(!err) {
//            var telNos = _.pluck(docs, 'telNo');
//            customerDao.client.count({telNo : {$in : telNos}, free: true, tags:{$nin:['微信认证']}}, function(err, count) {

//                if(!err) {
//                    console.log(count);
//                    var tasks = {};
//                    tasks.id = function(next) {
//                        idg.next(customerImplBatchDao.model.collection.name, next);
//                    }
//
//                    tasks.insertBatch = ['id', function(next, data) {
//                        var id = parseInt(data.id.toString());
//                        var buyer = null;
//                        var batch = {};
//                        batch._id = id;
//                        batch.name = '微信导入名单14-12-11';

//                        batch.dataLevel = 'A';
//                        if(buyer != null && buyer != undefined)
//                            batch.buyer = {userid : buyer._id, username : buyer.username, realName : buyer.realName};
//                        batch.belongArea = {areaCode : 'SH', areaName : '上海'};
//                        batch.totalCount = count;
//                        batch.successCount = count;
//                        batch.freeCount = count;

//                        batch.unbcCount = count;
//                        batch.bcCount = 0;
//                        batch.availableCount = count;
//                        batch.callCount = count;
//                        batch.noCallCount = 0;
//                        batch.assign = [];
//                        batch.comment = '';
//
//                        batch.cuserid = user._id;
//                        batch.cusername = user.username;
//                        batch.crealName = user.realName;
//                        batch.uuserid = user._id;
//                        batch.uusername = user.username;
//                        batch.urealName = user.realName;
//                        batch.ctime = Date.now();
//                        batch.utime = Date.now();
//
//                        (customerImplBatchDao.model)(batch).save(function(err, result){
//                            if(!err) {
//                                next(null, true);
//                            } else {
//                                next(err);
//                            }
//                        });
//                    }];
//
//                    tasks.updateBatchId = ['id', 'insertBatch', function(next, data) {
//                        customerDao.client.update({telNo : {$in : telNos}, free: true, tags : {$nin : ['微信认证']}}, {ImpBatchId : parseInt(data.id.toString())}, {multi : true}, next);
//                    }];
//
//                    tasks.updateCustomerTags = ['id', 'insertBatch', 'updateBatchId', function(next, data) {
//                        customerDao.client.update({telNo : {$in : telNos}, free:true, tags : {$nin : ['微信认证']}}, {$push : {tags : '微信认证'}}, {multi : true}, next);
//                    }];
//
//
//                    async.auto(tasks, function(err, result) {
//                        if(!err) {
//                            console.log('successful');
//                        }
//                    });
//                }
//            });
//        }
//    });



    var pagination = new Pagination(req);
    if(req.query.page.condition != undefined){
        pagination.condition.name = new RegExp(req.query.page.condition.name);
    }
    employeeDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            _.each(docs, function(employee) {
                var org = orgModel.getOrgByCode(employee.orgCode);
                var area = orgModel.getOrgByCode(employee.area);
                if(org) {
                    employee._doc.areaName = area.name;
                    employee._doc.orgName = org.name;
                } else {
                    employee._doc.orgName = "";
                    employee._doc.areaName = "";
                }
            });
            res.json({data : docs, pagination : pagination});
        }
    });
}

exports.add = function (req, res) {
//    res.contentType('json');
    var condition = {};
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;
    params.ctime = Date.now();
    condition.workno = params.workno;

    employeeDao.find(condition, function(err, result){
        if(err) {
            res.json({msg :{type : dictionary.resMsgType.error, body : '添加失败'}});
        }else {
            if(result.length == 0){
                employeeDao.add(params, function(err, result) {
                    if(err) {
                        res.json({msg :{type : dictionary.resMsgType.error, body : '添加失败'}});
                    } else {
                        res.json({msg :{type : dictionary.resMsgType.succ, body : '添加成功'}});
                    }
                });
            }else {
                res.json({msg : {type : dictionary.resMsgType.error, body : '工号存在,添加失败'}});
            }
        }
    });
};

exports.view = function(req, res){
    //console.log(req.body._id);
    employeeDao.findById(parseInt(req.params.id), function(err, result){
        if(err) {
            res.json({msg :{type : dictionary.resMsgType.error, body : '查找失败'}});
        }else {
            result._doc.departments = orgModel.getOrgsByParentCode(result._doc.area);
            //console.log(result._doc);
            res.json({msg :{type : dictionary.resMsgType.succ, body : result}});
        }
    });
};

exports.modify = function(req, res) {
    var condition = {};
    var params = req.body;
    var user = req.session.user;
    var id = parseInt(params._id);
    var impBatchId = [];
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;
    params.utime = new Date();
    condition.workno = params.workno;
    condition._id = {$ne: params._id};

    var steps = {};

    //验证除该Id外是否有其他员工有该workno,workno唯一性
    steps.employee = function(next) {
        employeeDao.find(condition, next);
    };

    //根据ID查找该员工的信息
    steps.employeeById = ['employee', function(next, data) {
        if(_.isEmpty(data.employee)) {
            employeeDao.findById(id, next);
        }else {
            next(null ,false);
        }
    }];

    //根据id查找该员工对应的所有用户
    steps.users = ['employee', function(next, data) {
        if(_.isEmpty(data.employee)) {
            userDao.find({employeeid: id, roleCodes: {$in: ['CONSULTANT', 'RM']}}, next);
        }else {
            next(null ,false);
        }
    }];

    //更新员工信息
    steps.modifyEmployee = ['employeeById', function(next, data) {
        if(data.employeeById) {
            employeeDao.modify(params, next);
        }else {
            next(null, false)
        }
    }];

    //若该员工分公司更改，则该员工下所有用户的分公司也一同更改
    steps.modifyUserOrg = ['employeeById', 'employee', function(next, data) {
        if(_.isEmpty(data.employee) && data.employeeById.area != params.area) {
            userDao.update({employeeid: id}, {orgCode: params.area}, next);
        }else {
            next(null, false);
        }
    }];

    //若为员工离职,则回收员工的所有客户
    steps.recover = ['users', 'employee', 'modifyEmployee', function(next, data) {
        var users = data.users;
        if(!_.isEmpty(users) && _.isEmpty(data.employee) && params.status == dictionary.employeeStatus.exitWork && data.employeeById.status == dictionary.employeeStatus.working ) {
            async.map(users, function(key, cb) {
                var step = {};
                var modifyCustomerParams = {};

                step.customerLowPotential = function(next) {
                    customerDao.find({$or: [{belongUser: key._id}, {manager: key._id}], status: {$in: [null, '']}, free: false}, next);
                };

                step.customerUpPotential = function(next) {
                    customerDao.find({$or: [{belongUser: key._id}, {manager: key._id}], status: {$nin: [null, '']}, free: false}, next);
                };

                step.modifyLowPotentialFree = ['customerLowPotential', function(next, data) {
                    var processLowPotential = {};
                    var customerLowPotential = data.customerLowPotential;
                    modifyCustomerParams.uuserid = user._id;
                    modifyCustomerParams.uusername = user.username;
                    modifyCustomerParams.urealName = user.realName;
                    modifyCustomerParams.utime = new Date();
                    _.each(customerLowPotential, function(value) {
                        if(!value.manager || !value.belongUser) {
                            if(value.ImpBatchId) {
                                if(!_.contains(impBatchId, value.ImpBatchId)) {
                                    impBatchId.push(value.ImpBatchId);
                                }
                            }
                            processLowPotential['customer_'+value._id] = function(next) {
                                modifyCustomerParams.free = true;
                                customerDao.modifyById(value._id, modifyCustomerParams, next);
                            }
                        }else {
                            if(value.manager == key._id && value.belongUser == key._id) {
                                if(value.ImpBatchId) {
                                    if(!_.contains(impBatchId, value.ImpBatchId)) {
                                        impBatchId.push(value.ImpBatchId);
                                    }
                                }
                                processLowPotential['customer_'+value._id] = function(next) {
                                    modifyCustomerParams.free = true;
                                    customerDao.modifyById(value._id, modifyCustomerParams, next);
                                }
                            }else if(value.manager == key._id && value.belongUser != key._id){
                                processLowPotential['customer_'+value._id] = function(next) {
                                    modifyCustomerParams.manager = '';
                                    customerDao.modifyById(value._id, modifyCustomerParams, next);
                                }
                            }else {
                                processLowPotential['customer_'+value._id] = function(next) {
                                    modifyCustomerParams.belongUser = '';
                                    customerDao.modifyById(value._id, modifyCustomerParams, next);
                                }
                            }
                        }
                    });
                    async.parallel(processLowPotential, next);
                }];

                step.modifyUpPotentialFree = ['customerUpPotential', function(next, data) {
                    var customerUpPotential = data.customerUpPotential;
                    var customerAdvanced = {};

                    customerAdvanced.reason = '离职员工客户回收';
                    customerAdvanced.type = dictionary.customerAdvancedOpType.recycle;
                    var opUser = {};
                    opUser.uid = req.session.user._id;
                    opUser.username = req.session.user.username;
                    opUser.realName = req.session.user.realName;
                    customerAdvanced.opUser = opUser;
                    async.eachSeries(customerUpPotential, function(value, next) {
                        var paces = {};
                        if(!value.manager || !value.belongUser) {
                            if(value.ImpBatchId) {
                                if(!_.contains(impBatchId, value.ImpBatchId)) {
                                    impBatchId.push(value.ImpBatchId);
                                }
                            }
                            paces['customer_'+ value._id] = function(next) {
                                modifyCustomerParams.free = true;
                                customerDao.modifyById(value._id, modifyCustomerParams, next);
                            }
                        }else {
                            if (value.manager == key._id && value.belongUser == key._id) {
                                if (value.ImpBatchId) {
                                    if (!_.contains(impBatchId, value.ImpBatchId)) {
                                        impBatchId.push(value.ImpBatchId);
                                    }
                                }
                                paces['customer_' + value._id] = function (next) {
                                    modifyCustomerParams.free = true;
                                    customerDao.modifyById(value._id, modifyCustomerParams, next);
                                }
                            } else if (value.manager == key._id && value.belongUser != key._id) {
                                paces['customer_' + value._id] = function (next) {
                                    modifyCustomerParams.manager = '';
                                    customerDao.modifyById(value._id, modifyCustomerParams, next);
                                }
                            } else {
                                paces['customer_' + value._id] = function (next) {
                                    modifyCustomerParams.belongUser = '';
                                    customerDao.modifyById(value._id, modifyCustomerParams, next);
                                }
                            }
                        }
                        //可跟进以上形成操作日志记录
                        paces['customerAdvancedOpLog_' + value._id] = function (next) {
                            customerAdvanced.customerId = value._id;
                            customerAdvancedOpLogDao.add(customerAdvanced, next);
                        };
                        async.parallel(paces, next);
                    }, function(err) {
                        if(err) {
                            next(err);
                        }
                        next(null ,true)
                    });
                }];
                async.auto(step, cb);
            }, next);
        }else {
            next(null, false)
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.employee.modify error: '+ err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(!_.isEmpty(result.employee)) {
                res.json({msg : {type : dictionary.resMsgType.error, body : '工号存在,更新失败'}});
            }else {
                res.json({msg : {type : dictionary.resMsgType.succ, body : '更新成功'}});
            }
        }
    });

    ////查找员工对应用户是否都在组内，都在则继续执行否则终止执行其他操作
    //steps.leaders = ['users', 'employeeById', function(next, data) {
    //    if(params.status == dictionary.employeeStatus.exitWork && data.employeeById.status == dictionary.employeeStatus.working) {
    //        var users = data.users;
    //        if(!_.isEmpty(users)) {
    //            async.map(users, function(key, cb) {
    //                workgroupDao.find({'workers.userid': key._id}, cb);
    //            }, function(err, result) {
    //                if(err) {
    //                    logger.error('crm.employee.modify.leaders error: '+ err.stack);
    //                    next(err);
    //                }else {
    //                    for(var i in result) {
    //                        if(_.isEmpty(result[i])) {
    //                            if(!userInfo) {
    //                                userInfo += users[i].username+'#'+users[i].realName;
    //                            }else {
    //                                userInfo += '--' +users[i].username+'#'+users[i].realName;
    //                            }
    //                        }
    //                    }
    //
    //                    if(userInfo) {
    //                        next(null, 'leaderIsEmpty');
    //                    }else{
    //                        next(null, false);
    //                    }
    //
    //                }
    //            });
    //        }else {
    //            next(null, 'isNoUsers');
    //        }
    //    }else {
    //        next(null, 'isNotExitWork');
    //    }
    //}];

    //async.auto(steps, function(err, result) {
    //    if(err) {
    //        logger.error('crm.employee.modify.async.auto error: '+ err.stack);
    //        res.json(500, {err: err.stack});
    //    }else{
    //        if(_.isEmpty(result.employee)) {
    //            if(result.leaders == 'leaderIsEmpty') {
    //                res.json({msg : {type : dictionary.resMsgType.info, body:'更新失败!', message : '该员工的< '+ userInfo +' >账号不属于任何分组,请其归为相应分组!'}});
    //            }else {
    //                var pace = {};
    //
    //                //更新员工信息
    //                pace.modifyEmployee = function(next) {
    //                    employeeDao.modify(params, next);
    //                };
    //
    //                //若该员工分公司更改，则该员工下所有用户的分公司也一同更改
    //                if(result.employeeById.area != params.area) {
    //                    pace.modifyUserOrg = function(next) {
    //                        userDao.update({employeeid: id}, {orgCode: params.area}, next);
    //                    };
    //                }
    //
    //                if(result.leaders != 'isNotExitWork' && result.leaders != 'isNoUsers') {
    //
    //                    //更新用户信息
    //                    pace.modifyUser = ['modifyEmployee', function(next, data) {
    //                        if(data.modifyEmployee) {
    //                            userDao.update({employeeid: id}, {status: dictionary.userStatus.exitWork}, next);
    //                        }else {
    //                            next(null, false);
    //                        }
    //                    }];
    //
    //                    //生成任务,可跟进以下商机直接回收,可跟进以上商机给对应的leader
    //                    pace.modifyCustInfo = ['modifyUser', function(next, data) {
    //                        if(!_.isEmpty(result.users) && data.modifyUser) {
    //                            async.map(result.users, function(key, cb) {
    //                                var step = {};
    //                                var processLowPotential = {};
    //
    //                                step.customerLowPotential = function(next) {
    //                                    customerDao.find({$or: [{belongUser: key._id}, {manager: key._id}], status: {$in: [null, '']}, free: false}, next);
    //                                };
    //
    //                                step.customerUpPotential = function(next) {
    //                                    customerDao.find({$or: [{belongUser: key._id}, {manager: key._id}], status: {$nin: [null, '']}, free: false}, next);
    //                                };
    //
    //                                step.modifyFree = ['customerLowPotential', function(next, data) {
    //                                    var customerLowPotential = data.customerLowPotential;
    //                                    _.each(customerLowPotential, function(value) {
    //                                        if(!value.manager || !value.belongUser) {
    //                                            if(value.ImpBatchId) {
    //                                                if(!_.contains(impBatchId, value.ImpBatchId)) {
    //                                                    impBatchId.push(value.ImpBatchId);
    //                                                }
    //                                            }
    //                                            processLowPotential['customer'+value._id] = function(next) {
    //                                                customerDao.modifyById(value._id, {free: true}, next);
    //                                            }
    //                                        }else {
    //                                            if(value.manager == key._id && value.belongUser == key._id) {
    //                                                if(value.ImpBatchId) {
    //                                                    if(!_.contains(impBatchId, value.ImpBatchId)) {
    //                                                        impBatchId.push(value.ImpBatchId);
    //                                                    }
    //                                                }
    //                                                processLowPotential['customer'+value._id] = function(next) {
    //                                                    customerDao.modifyById(value._id, {free: true}, next);
    //                                                }
    //                                            }else if(value.manager == key._id && value.belongUser != key._id){
    //                                                processLowPotential['customer'+value._id] = function(next) {
    //                                                    customerDao.modifyById(value._id, {manager: ''}, next);
    //                                                }
    //                                            }else {
    //                                                processLowPotential['customer'+value._id] = function(next) {
    //                                                    customerDao.modifyById(value._id, {belongUser: ''}, next);
    //                                                }
    //                                            }
    //                                        }
    //                                    });
    //                                    async.parallel(processLowPotential, next);
    //                                }];
    //
    //                                step.leaderId = function(next) {
    //                                    workgroupDao.find({'workers.userid': key._id}, next);
    //                                };
    //
    //                                step.addTask = ['customerUpPotential', 'leaderId', function(next, data) {
    //                                    var leaderId = data.leaderId;
    //                                    if(!_.isEmpty(data.customerUpPotential)) {
    //                                        var process = {};
    //                                        process.recycleTaskId = function(next) {
    //                                            idg.next(taskDao.client.collection.name, next);
    //                                        };
    //                                        process.recycleTask = ['recycleTaskId', function(next, data) {
    //                                            var task = {};
    //                                            task._id = parseInt(data.recycleTaskId.toString());
    //                                            task.refId = parseInt(data.recycleTaskId.toString());
    //                                            task.type = dictionary.taskType.customerRecycleDistribution;
    //                                            task.belongUser = [];
    //
    //                                            var flag = true;
    //                                            _.each(leaderId, function(leader) {
    //                                                _.each(leader.workers, function(workers) {
    //                                                    if(_.contains(workers.workerRoles, dictionary.workerRole.leader) && workers.userid != key._id) {
    //                                                        task.belongUser.push(workers.userid);
    //                                                        flag = false;
    //                                                    }
    //                                                });
    //                                            });
    //
    //                                            if(flag) {
    //                                                task.belongUser.push(1000018);
    //                                            }
    //
    //                                            task.refObj = {};
    //                                            task.refObj.userid = key._id;
    //                                            task.refObj.username = key.username;
    //                                            task.refObj.realName = key.realName;
    //                                            task.refObj.customerRecycleDistributionType = dictionary.customerRecycleDistributionType.quitOffice;
    //                                            taskDao.add(task, next);
    //                                        }];
    //                                        async.auto(process, next);
    //                                    }else {
    //                                        next(null, false);
    //                                    }
    //                                }];
    //                                async.auto(step, cb);
    //                            }, function(err, result) {
    //                                if(err) {
    //                                    logger.error('crm.employee.modifyCustInfo error:'+err.stack);
    //                                    next(err);
    //                                }else {
    //                                    next(null, result);
    //                                }
    //                            });
    //                        }else {
    //                            next(null, false);
    //                        }
    //                    }];
    //
    //                    pace.modifyByImpBatchId = ['modifyCustInfo', function(next, data) {
    //                        if(data.modifyCustInfo) {
    //                            customerImplBatchDao.refreshBatchCount(impBatchId, next);
    //                        }else {
    //                            next(null, false);
    //                        }
    //                    }];
    //                }
    //
    //                async.auto(pace, function(err, doc) {
    //                    if(err) {
    //                        logger.error('crm.employee.modify.async.auto.async.auto error: '+ err.stack);
    //                        res.json(500, {err: err.stack});
    //                    }else {
    //                        res.json({msg : {type : dictionary.resMsgType.succ, body : '更新成功'}});
    //                    }
    //                });
    //            }
    //        }else {
    //            res.json({msg : {type : dictionary.resMsgType.error, body : '工号存在,更新失败'}});
    //        }
    //    }
    //});
};
exports.code = function(req, res){
    //console.log(orgModel.getOrgsByParentCode(req.body.code));
    res.json(orgModel.getDepartsByParentCode(req.body.code));
}

exports.delete = function(req, res) {
    var id = req.params.id;
    employeeDao.delete(id, function(err, result) {
        if(err) {
            res.json({msg : {type : dictionary.resMsgType.error, body : '删除失败'}});
        } else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '删除成功'}});
        }
    });
}

