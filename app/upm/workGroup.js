/**
 *
 * User: wuzixiu
 * Date: 8/27/14
 * Time: 1:09 PM
 */

var areaModel = require('../portal/areaModel');
var orgModel = require('../portal/orgModel');
var dictionary = require('../../lib/dictionary');
var _ = require('underscore');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var workGroupDao = require('../../db/upm/workgroupDao');
var userDao = require('../../db/upm/userDao');
var Pagination = require('../../lib/Pagination');
var async = require('async');
var dictModel = require('../portal/dictModel');

exports.list = function (req, res) {
    var data = {};
    data.areas = orgModel.getRootOrgs();
    res.send(data);
};

exports.listData = function (req, res) {
    var pagination = new Pagination(req);
    if(pagination.condition.name) {
        pagination.condition.name = new RegExp(pagination.condition.name);
    }
    pagination.condition.isDel = {$in: [false, null]};
    workGroupDao.client.findByPage(pagination, function(err, groups) {
        if(err) {
            res.json(500, {err: err.stack})
        }else {
            _.each(groups, function(group, index) {
                var org = orgModel.getOrgByCode(group.orgCode);
                if(org) {
                    group._doc.orgName = org.name;
                }else {
                    group._doc.orgName = '未知';
                }
            });
            var result = {groups: groups, pagination: pagination};

            res.json(result);
        }
    });
};

exports.get = function (req, res) {
    var data = {};
    var groupId = req.query.id;
    var orgCode = req.query.orgCode;
    var leader = null;

    if(groupId == null) {
        res.json(400, {});
        return;
    }
    var steps = {};

    steps.users = function(next) {
        userDao.find({orgCode: orgCode, status: dictionary.userStatus.ok, position: {$in: ['rm', 'consultant']}}, next);
    };

    steps.workGroup = function(next) {
        workGroupDao.findById(groupId, next)
    };

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
            return;
        }
        var group = result.workGroup;
        var users = [];
        _.each(result.users, function(value) {
            var position = dictModel.getDictByTypeAndKey(dictionary.dictTypes.userPosition, value.position);
            if(position) {
                value._doc.positionName = position.name;
            }else {
                value._doc.positionName = '未知';
            }
            _.each(group.workers, function(key) {
                if(!_.contains(key.workerRoles, dictionary.workerRole.leader)) {
                    if(key.userid == value._id) {
                        users.push(value);
                    }
                }else {
                    if(key.userid == value._id) {
                        leader = value;
                    }
                }
            })
        });

        result.users = _.difference(result.users, users);
        result.users = _.without(result.users, leader);
        group._doc.users = result.users;
        group._doc.leader = leader;
        data.areaList = orgModel.getRootOrgs();
        var org = orgModel.getOrgByCode(group.orgCode);
        if(org) {
            group._doc.orgName = org.name;
        }else {
            group._doc.orgName = '未知';
        }
        data.users = users;
        data.group = group;
        data.code = 200;
        //console.log(data.group);
        res.send(data);
    });
};

exports.create = function(req, res) {
    var params = req.body;
    delete params.user;
    params.workers = [];

    var members = params.members.split(',');
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;

    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;

    params.isDel = false;

    var steps = {};

    steps.users = function(next) {
        userDao.find({_id: {$in: members}}, next);
    };

    steps.create = ['users', function(next, data) {
        if(!_.isEmpty(data.users)) {
            _.each(data.users, function(value) {
                params.workers.push({userid: value._id, workerRoles: [dictionary.workerRole.worker]});
            });
        }
        params.workers.push({userid: parseInt(params.leaderId), workerRoles: [dictionary.workerRole.leader]});
        delete params.members;
        delete params.leaderId;
        workGroupDao.create(params, next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            if(result.create) {
                res.json({msg: {type: dictionary.resMsgType.succ, body: '添加成功'}});
            }else {
                res.json({msg: {type: dictionary.resMsgType.error, body: '添加失败'}});
            }
        }
    })
}

exports.edit = function(req, res) {
    var params = req.body;

    var id = params.id;
    params.workers = [];
    delete params.id;
    delete params.member;

    var user = req.session.user;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;
    params.utime = new Date();


    var steps = {};

    var members = params.members.split(',');
    steps.users = function(next) {
        userDao.find({_id: {$in: members}}, next);
    };

    steps.update = ['users', function(next, data) {
        if(!_.isEmpty(data.users)) {
            _.each(data.users, function(value) {
                params.workers.push({userid: value._id, workerRoles: [dictionary.workerRole.worker]});
            });

        }
        params.workers.push({userid: parseInt(params.leaderId), workerRoles: [dictionary.workerRole.leader]});
        delete params.leaderId;
        delete params.members;
        workGroupDao.update(id, params, next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
            return;
        }
        if(result.update) {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '更新成功'}});
        }else {
            res.json({msg: {type: dictionary.resMsgType.error, body: '更新失败'}});
        }
    })
}

exports.delete = function(req, res) {
    var id = req.param('id');
    workGroupDao.update(id, {isDel: true}, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
            return;
        }
        res.json({msg: {type: dictionary.resMsgType.succ, body: '删除成功'}})
    })

}