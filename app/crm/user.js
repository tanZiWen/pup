
var tag = require('./tag');
var dictionary = require('../../lib/dictionary');
var _ = require('underscore');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var userDao = require('../../db/upm/userDao');
var roleDao = require('../../db/upm/roleDao');
var functionDao = require('../../db/upm/functionDao');
var employeeDao = require('../../db/crm/employeeDao');
var workGroupDao = require('../../db/upm/workgroupDao');
var Pagination = require('../../lib/Pagination');
var orgModel = require('../portal/orgModel');
var areaModel = require('../portal/areaModel');
var dictModel = require('../portal/dictModel');
var roleModel = require('../portal/roleModel');
var appModel = require('../portal/appModel');
var functionModel = require('../portal/functionModel');
var customerDao = require('../../db/crm/customerDao');
var idg = require('../../db/idg');
var taskDao = require('../../db/crm/taskDao');
var workgroupDao = require('../../db/upm/workgroupDao');
var cryptoHelper = require('../../lib/cryptoHelper');
var mailHelper = require('../../lib/mailHelper');
var utils = require('../../lib/utils');
var redis = require('redis');
var appCfg = require('../../app.cfg.js');
var redisClient = redis.createClient(appCfg.redis.port, appCfg.redis.host, {});
var async = require('async');

exports.list = function (req, res) {
    if(req.query.workGroupId != null && req.query.workGroupId != undefined) {
        userDao.findByWorkGroup(req.query.workGroupId, function(err, docs) {
            if(err) {
                logger.error('crm.user.list.findByWorkGroup error: ' +err.stack);
                res.json(500, {err: err.stack});
            }else {
                var users = _.pluck(docs, '_doc');
                async.map(users, function(value, cb) {
                    customerDao.client.count({belongUser: value._id, callStatus: dictionary.customerCallStatus.noCall, free: false, status: {$nin: [ "potential", "bc20", "bc40", "bc60", "bc80", "deal", "vip", "diamondVip", "crownedVip"]}}, function(err, noCallCount) {
                        if(err) {
                            logger.error('crm.user.list.customer.count error:' +err.stack);
                            cb(err);
                        }else {
                            value.noCallCount = noCallCount;
                            cb(null, value);
                        }
                    });

                }, function(err, result) {
                    if(err) {
                        logger.error('crm.user.list.async.map error:' +err.stack);
                        res.json(500, {err: err.stack});
                    }else {
                        res.json({data: result});
                    }
                });
            }
        });
    } else {
        userDao.findByUser(req.query.userId, function(err, docs) {
            if(err) {
                logger.error('crm.user.list.findByUser error:' + err.stack);
                res.json(500, {err: err.stack});
            }else {
                var users = _.pluck(docs, '_doc');
                customerDao.client.count({belongUser: req.query.userId, callStatus: dictionary.customerCallStatus.noCall, free: false, status: {$nin: [ "potential", "bc20", "bc40", "bc60", "bc80", "deal", "vip", "diamondVip", "crownedVip"]}}, function(err, noCallCount) {
                    if(err) {
                        logger.error('crm.user.list.findByUser.count error:' + err.stack);
                        res.json(500, {err: err.stack});
                    }else {
                        users[0].noCallCount = noCallCount;
                        res.json({data: users});
                    }
                });
            }
        });
    }

};

exports.userListByArea = function(req, res) {
    var orgCodes = orgModel.getOrgCodesByParentCode(req.query.orgCode);
    orgCodes.push(req.query.orgCode);
    userDao.find({orgCode : {$in : orgCodes}}, function(err, result) {
        if(err) res.json({data : []});
        else {
            res.json({data : result});
        }
    })
}

exports.findAllByOrg = function (req, res) {
    var id = req.params.id;
    console.log('find users of org:', id);

    if(!id) {
        res.status(400).send({});
        return;
    }

    //TODO: pick fields to omit unused ones, especially password for risk of security
    userDao.find({'orgCode': id, status: dictionary.userStatus.ok, position: {$in: ['rm', 'consultant']}}, function(err, result) {
        if(err) {
            res.json(500, {err : err.stack});
            return;
        }
        var docs = _.pluck(result, '_doc');
        _.each(docs, function(value) {
            value.positionName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.userPosition, value.position).name;
        });
        res.json({'users' : docs});
    });
};

exports.departingLeaveUsers = function(req, res) {
    var steps = {};

    var workGroupId = req.query.workGroup;
    if(workGroupId != undefined && workGroupId != '') {
        steps.workGroup = function(next) {
            workGroupDao.findById(workGroupId, next);
        };

        steps.departingUsers = ['workGroup', function(next, data) {
            var workGroupUserIds = _.pluck(data.workGroup.workers, 'userid');
            userDao.find({status : {$in : [dictionary.userStatus.delete, dictionary.userStatus.exitWork]}, _id : {$in : workGroupUserIds}}, next);
        }];

        async.auto(steps, function(err, data) {
            if(err) {
                res.json({users : []});
            } else {
                res.json({users : data.departingUsers});
            }
        });
    } else {
        userDao.find({status : {$in : [dictionary.userStatus.delete, dictionary.userStatus.exitWork]}}, function(err, data) {
            if(err) {
                res.json({users : []});
            } else {
                res.json({users : data});
            }
        });
    }
};

exports.listInfo = function(req, res) {
    var data = {};
    data.areaList = orgModel.getRootOrgs();
    data.positionList = dictModel.getDictByType(dictionary.dictTypes.userPosition);



    data.roleCodeList = getFilterRole();
    employeeDao.find({status: dictionary.employeeStatus.working}, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            data.employees = result;
            res.json(data);
        }
    });

};


exports.listData = function(req, res) {
    var pagination = new Pagination(req);
    pagination.condition.status = 'ok';
    if(pagination.condition.username) {
        pagination.condition.$or = [{username: new RegExp(req.query.page.condition.username)}, {realName: new RegExp(req.query.page.condition.username)}];
        delete pagination.condition.username;
    }
    //console.log(pagination.condition);
    userDao.client.findByPage(pagination, function(err, docs) {
        if(err) {
            res.json(500, {err: err.stack})
        }else {
            _.each(docs, function(key, value) {
                var org = orgModel.getOrgByCode(key.orgCode);
                if(org) {
                    key._doc.orgName = org.name;
                }else {
                    key._doc.orgName = '未知';
                }
                var position = dictModel.getDictByTypeAndKey(dictionary.dictTypes.userPosition, key.position);
                if(position) {
                    key._doc.positionName = position.name;
                }else {
                    key._doc.positionName = '未知';
                }
                key._doc.password = '';
                var roles = roleModel.getRoleByCode(key.roleCodes);
                if(!_.isEmpty(roles)) {
                    _.each(roles, function(key1, value) {
                        if(value == 0) {
                            key._doc.roleName = key1.name
                        }else {
                            key._doc.roleName +=',' + key1.name;
                        }

                    });
                }else {
                    key._doc.roleName = '未知';
                }
            });
            res.json({users: docs, pagination: pagination});
        }
    })
}

exports.data = function(req, res) {
    var params = req.body;
    var id = params.id;
    var orgCode = params.orgCode;

    var steps = {};

    steps.workGroup = function(next) {
        workGroupDao.find({orgCode: orgCode, isDel: {$in: [false, null]}}, next);
    };

    steps.employee = function(next) {
        employeeDao.findById(id, next);
    };

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            var employee = result.employee;
            var workGroup = result.workGroup;
            employee._doc.parentCode = orgModel.getOrgByCode(employee.orgCode).parentCode;
            employee._doc.workGroup = workGroup;
            res.json({type: dictionary.resMsgType.succ, employee: employee});
        }
    })
};

exports.dataList = function (req, res) {
    var pagination = new Pagination(req);
    if(req.query.page.condition != undefined){
        pagination.condition.name = new RegExp(req.query.page.condition.name);
    }
    pagination.condition.status = dictionary.employeeStatus.working;
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
};

exports.dataInfo = function(req, res) {
    console.log(req.param);
    var data = {};
    var orgList = orgModel.getRootOrgs();
    var sexList = dictModel.getDictByType(dictionary.dictTypes.sex);
    var positionList = dictModel.getDictByType(dictionary.dictTypes.userPosition);
    var roleCodesList = getFilterRole();
    data.orgList = orgList;
    data.sexList = sexList;
    data.positionList = positionList;
    data.roleCodesList = roleCodesList;
    res.json(data);


};

exports.add = function(req, res) {
    var params = req.body;
    var position = params.position;
    var workGroup = params.workGroup;
    delete params.workGroup;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;
    params.status = dictionary.userStatus.ok;
    params.online = false;

    var cacheChangePwdKey;
    var step = {};
    var con = {};

    step.findUser = function(next) {
        userDao.findByUserName(params.username, next);
    };

    step.encrypt = function(next) {
        cryptoHelper.encrypt(generatePwd(), next);
    };

    step.addUser = ['findUser', 'encrypt', function(next, data) {
        if(_.isEmpty(data.findUser)){
            params.password = data.encrypt;
            var email = params.email;
            if(email.substring(email.length - 11, email.length) == 'prosnav.com') {
                userDao.add(params, next);
            }else {
                next(null, 'illegalEmail')
            }
        }else {
            next(null, false);
        }
    }];

    step.sendMail = ['addUser', function(next, data) {
        if(data.addUser) {
            con.email = params.email;
            con.realName = params.realName;
            con.username = params.username;
            cacheChangePwdKey = utils.generateSession();
            console.log(cacheChangePwdKey)
            con.session = cacheChangePwdKey;
            con.type = 'add';
            mailHelper.sendMail(con, next);
        }else {
            next(null, false);
        }
    }];

    step.restoreUser = ['sendMail', function(next, data) {
        if(data.sendMail) {
            cacheChangePwdKey = 'ps:changePwd:' + cacheChangePwdKey;
            console.log('cacheChangePwdKey', cacheChangePwdKey);
            redisClient.set(cacheChangePwdKey, data.addUser, function(err, reply) {
                if(err) {
                    next(err)
                }else {
                    redisClient.expire(cacheChangePwdKey, appCfg.sessionTimeout.setPwd, next);
                }
            });
        }else {
            next(null, false);
        }
    }];

    if(position == dictionary.userPosition.rm || position == dictionary.userPosition.consultant) {
        step.workGroup = ['addUser', function(next, data) {
            if(data.addUser) {
                var userid = parseInt(data.addUser.toString());
                workGroupDao.update(workGroup, {$push: {workers: {userid: userid, workerRoles: [dictionary.workerRole.worker]}}}, next);
            }else {
                next(null, false);
            }
        }]
    }

    async.auto(step, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            if(result.findUser) {
                res.json({msg: {type: dictionary.resMsgType.error, body: '用户名已存在,添加失败'}})
            }else {
                if(result.addUser == 'illegalEmail') {
                    res.json({msg: {type: dictionary.resMsgType.error, body: '邮箱格式不正确,必须是公司内部邮箱!'}});
                }else {
                    res.json({msg: {type: dictionary.resMsgType.succ, body: '添加成功'}})
                }
            }
        }
    });
};

exports.detail = function(req, res) {
    var id = req.param('id');

    var steps = {};

    steps.user = function(next) {
        userDao.findById(id, next);
    };

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            var user = result.user;

            var sexList = dictModel.getDictByType(dictionary.dictTypes.sex);
            var orgList = orgModel.getRootOrgs();
            var positionList = dictModel.getDictByType(dictionary.dictTypes.userPosition);
            var roleCodesList = getFilterRole();
            var roleCodes = [];
            _.each(roleCodesList, function(key) {
                if(_.contains(user.roleCodes, key.code)) {
                    roleCodes.push({code: key.code, name: key.name, flag: 1});
                }else {
                    roleCodes.push({code: key.code, name: key.name, flag: 0});
                }
            });
            var status = user.status;
            if(status) {
                user._doc.statusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.userStatus, status).name;
            }
            res.json({user: user, sexList: sexList, orgList: orgList, positionList: positionList, roleCodes: roleCodes });
        }
    });
};

exports.edit = function(req, res) {
    var params = req.body;
    var id = parseInt(params.id);
    delete params.id;

    params.utime = new Date();
    params.uuserid = req.session.user._id;
    params.uusername = req.session.user.username;
    params.urealName = req.session.user.realName;

    if(params.email) {
        delete params.email;
    }

    var steps = {};

    //查找用户信息
    steps.user = function(next) {
        userDao.findById(id, next);
    };

    //若用户升迁，则查找该用户是否属于某个分组
    steps.leader = ['user', function(next, data) {
        var user = data.user;
        if(user.position == dictionary.userPosition.consultant && params.position == dictionary.userPosition.rm) {
            workgroupDao.find({'workers.userid': id}, function(err, result) {
                if(err) {
                    logger.error('crm.user.edit.leader error:' +err.stack);
                    next(err);
                }else {
                    if(_.isEmpty(result)) {
                        next(null, 'leaderIsEmpty');
                    }else {
                        next(null, false);
                    }
                }
            });
        }else {
            next(null, 'isNotPromotion');
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.user.edit error:'+ err.stack);
            res.json({msg: {type: dictionary.resMsgType.error, body: '更新失败'}});
        }else {
            if(result.leader == 'leaderIsEmpty') {
                res.json({msg: {type: dictionary.resMsgType.info, body: '更新失败', message: '由顾问晋升为RM需要将该顾问划定到某个分组中.'}});
            }else {
                delete params.password;

                var pace = {};

                //更新用户信息
                pace.modifyUser = function(next) {
                    userDao.updateById(id, params, next);
                };

                if(result.leader != 'isNotPromotion') {
                    pace.recycleTask = ['modifyUser', function(next, data) {
                        var user = result.user;
                        var leaderId = result.leader;

                        var step = {};

                        step.customers = function(next) {
                            customerDao.find({belongUser: id, status: {$nin: [null, '']}, free: false}, next);
                        };

                        step.tasks = ['customers', function(next, data) {

                            if(!_.isEmpty(data.customers)) {
                                var process = {};

                                process.recycleTaskId = function(next) {
                                    idg.next(taskDao.client.collection.name, next);
                                };
                                process.task = ['recycleTaskId', function(next, data) {
                                    var task = {};
                                    task._id = parseInt(data.recycleTaskId.toString());
                                    task.refId = parseInt(data.recycleTaskId.toString());
                                    task.type = dictionary.taskType.customerRecycleDistribution;
                                    task.belongUser = [];
                                    var flag = true;

                                    _.each(leaderId, function(leader) {
                                        _.each(leader.workers, function(workers) {
                                            if(_.contains(workers.workerRoles, dictionary.workerRole.leader) && workers.userid != user._id) {
                                                task.belongUser.push(workers.userid);
                                                flag = false;
                                            }
                                        });
                                    });
                                    if(flag) {
                                        task.belongUser.push(1000018);
                                    }

                                    task.refObj = {};
                                    task.refObj.userid = user._id;
                                    task.refObj.username = user.username;
                                    task.refObj.realName = user.realName;
                                    task.refObj.customerRecycleDistributionType = dictionary.customerRecycleDistributionType.promotion;
                                    taskDao.add(task, next);
                                }];
                                async.auto(process, next);
                            }else {
                                next(null, false);
                            }
                        }];
                        async.auto(step, next);
                    }];
                }

                async.auto(pace, function(err, doc) {
                    if(err) {
                        logger.error('crm.user.edit.async.auto error:' +err.stack);
                        res.json({msg: {type: dictionary.resMsgType.error, body: '更新失败!'}});
                    }else {
                        res.json({msg: {type: dictionary.resMsgType.succ, body: '更新成功!'}});
                    }
                });
            }

        }
    });
};

exports.delete = function(req, res) {
    var id = parseInt(req.body.id);
    userDao.updateById(id, {status: 'delete'}, function(err, result) {
        if(err) {
            res.json({msg: {type: dictionary.resMsgType.error, body: '删除失败'}});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '删除成功'}});
        }
    });
};

exports.roleList = function(req, res) {
    var pagination = new Pagination(req);
    if(req.query.page.condition != undefined){
        pagination.condition.name = new RegExp(req.query.page.condition.name);
    }
    roleDao.client.findByPage(pagination, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            _.each(result, function(key, value) {
                key._doc.appName = appModel.findAppByCode(key.appCode).name;
            });
            res.json({roles: result, pagination: pagination});
        }
    })
};

exports.functionList = function(req, res) {
    var id = req.param('id');
    var flag = 0;
    var arrayCRM = _.values(dictionary.menuCRM);
    var arrayUPM = _.values(dictionary.menuUPM);
    var step = {};
    var tree = [];
    var crm = {};
    var upm = {};
    step.role = function(next) {
        roleDao.findById(id, next);
    };

    step.viewTree = ['role', function(next, data) {
        if(data.role.fnCodes) {
            var fnCodes = data.role.fnCodes;
            if(fnCodes.length > 8) {
                flag =1;
            }
            if(!_.isEmpty(_.intersection(arrayCRM, fnCodes))) {
                crm.text = appModel.findAppByCode(dictionary.appCode.CRM).name;
                crm.icon = "glyphicon glyphicon-user";
                crm.nodes = [];
                var customer = {};
                if(_.contains(fnCodes, dictionary.menuCRM.customer)) {
                    customer.text = functionModel.getFunctionByCode(dictionary.menuCRM.customer).name;
                    customer.nodes = [];
                    if(_.contains(fnCodes, dictionary.fn.customerInfo)) {
                        customer.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.customerRequest).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    if(_.contains(fnCodes, dictionary.fn.customerRequest)) {
                        customer.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.customerRequest).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    crm.nodes.push(customer);
                }
                var product = {};
                if(_.contains(fnCodes, dictionary.menuCRM.product)) {
                    product.text = functionModel.getFunctionByCode(dictionary.menuCRM.product).name;
                    product.nodes = [];
                    if(_.contains(fnCodes, dictionary.fn.productList)) {
                        product.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.productList).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    crm.nodes.push(product);
                }
                var order = {};
                if(_.contains(fnCodes, dictionary.menuCRM.order)) {
                    order.text = functionModel.getFunctionByCode(dictionary.menuCRM.order).name;
                    order.nodes = [];
                    if(_.contains(fnCodes, dictionary.fn.orderList)) {
                        order.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.orderList).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    if(_.contains(fnCodes, dictionary.fn.signList)) {
                        order.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.signList).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    crm.nodes.push(order);
                }
                var audit = {};
                if(_.contains(fnCodes, dictionary.menuCRM.audit)) {
                    audit.text = functionModel.getFunctionByCode(dictionary.menuCRM.audit).name;
                    audit.nodes = [];
                    if(_.contains(fnCodes, dictionary.fn.auditList)) {
                        audit.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.auditList).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    crm.nodes.push(audit);
                }
                var employee = {};
                if(_.contains(fnCodes, dictionary.menuCRM.employee)) {
                    employee.text = functionModel.getFunctionByCode(dictionary.menuCRM.employee).name;
                    employee.nodes = [];
                    if(_.contains(fnCodes, dictionary.fn.employeeList)) {
                        employee.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.employeeList).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    crm.nodes.push(employee);
                }
                var dataManage = {};
                if(_.contains(fnCodes, dictionary.menuCRM.dataManage)) {
                    dataManage.text = functionModel.getFunctionByCode(dictionary.menuCRM.dataManage).name;
                    dataManage.nodes = [];
                    if(_.contains(fnCodes, dictionary.fn.callListManage)) {
                        dataManage.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.callListManage).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    if(_.contains(fnCodes, dictionary.fn.planManage)) {
                        dataManage.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.planManage).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    crm.nodes.push(dataManage);
                }
                var online = {};
                if(_.contains(fnCodes, dictionary.menuCRM.online)) {
                    online.text = functionModel.getFunctionByCode(dictionary.menuCRM.online).name;
                    online.nodes = [];
                    if(_.contains(fnCodes, dictionary.fn.onlineList)) {
                        online.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.onlineList).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    if(_.contains(fnCodes, dictionary.fn.accountList)) {
                        online.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.accountList).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    crm.nodes.push(online);
                }

            }
            if(!_.isEmpty(_.intersection(arrayUPM, fnCodes))) {
                upm.text = appModel.findAppByCode(dictionary.appCode.UPM).name;
                upm.icon = "glyphicon glyphicon-user";
                upm.nodes = [];
                var user = {};
                if(_.contains(fnCodes, dictionary.menuUPM.user)) {
                    user.text = functionModel.getFunctionByCode(dictionary.menuUPM.user).name;
                    user.nodes = [];
                    if(_.contains(fnCodes, dictionary.fn.userList)) {
                        user.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.userList).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    if(_.contains(fnCodes, dictionary.fn.roleList)) {
                        user.nodes.push({text: functionModel.getFunctionByCode(dictionary.fn.roleList).name, icon: "glyphicon glyphicon-leaf"});
                    }
                    upm.nodes.push(user);
                }
            }
            if(!_.isEmpty(crm)) {
                tree.push(crm);
            }
            if(!_.isEmpty(upm)) {
                tree.push(upm);
            }
            next(null, true);
        }else {
            next(null, false);
        }
    }];


    async.auto(step, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            if(result.viewTree) {
                res.json({viewTree: tree, flag: flag});
            }else {
                res.json({viewTree: null});
            }
        }
    });
};

exports.restPwd = function(req, res) {
    var params = req.body;

    var steps = {};

    steps.user = function(next) {
        userDao.findById(parseInt(params.id), next);
    };

    steps.encrypt = ['user', function(next, data) {
        if(!data.user.email || data.user.email == '') {
            next(null, false);
        }else{
            cryptoHelper.encrypt(params.pwd, next);
        }

    }];

    steps.restPwd = ['encrypt', function(next, data) {
        if(data.encrypt) {
            userDao.updateById(params.id, {$set: {password: data.encrypt}}, next)
        }else {
            next(null, false);
        }
    }];

    steps.sendMail = ['restPwd', function(next, data) {
        if(data.restPwd) {
            mailHelper.sendMail(params.pwd, data.user.email, data.user.realName, next);
        }else {
            next(null, false);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.user.restPwd error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(result.sendMail) {
                res.json({msg: {type: dictionary.resMsgType.succ, body: '重置成功!'}});
            }else {
                res.json({msg: {type: dictionary.resMsgType.error, body: '邮箱未设置!'}});
            }
        }
    })
};


function getFilterRole() {
    var filterArr = ['test', '_crmadmin', '_upmadmin', '_upmadmin', 'DM' ];
    return _.filter(roleModel.getAllRoles(), function(value) {
        return !_.contains(filterArr, value.code);
    });
}

function generatePwd() {
    var code = "";
    var codeLength = 10;
    var selectChar = new Array(0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z')
    for(var i=0; i<codeLength; i++) {
        var charIndex = Math.floor(Math.random()*36);
        code += selectChar[charIndex];
    }
    return code
}