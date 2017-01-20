/**
 * Created by wangnan on 14-5-15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var CallListRequest = exports.client = model.crm_callList_request;
var workGroupDao = require('../../db/upm/workgroupDao');
var userDao = require('../upm/userDao');
var taskDao = require('../../db/crm/taskDao');
var sender = require('../../routes/sender');
var sioHelper = require('../../lib/sioHelper');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = CallListRequest;

exports.add = function (params, cb) {

    var atomSteps = {};

    atomSteps.taskId = function(atomCb) {
        idg.next(taskDao.client.collection.name, function (err, idBuf){
            if(err) {
                atomCb(err);
            } else {
                atomCb(null, idBuf.toString());
            }
        });
    };

    atomSteps.saveCallListRequest = ['taskId', function(atomCb, data) {
        idg.next(CallListRequest.collection.name, function (err, result){
            if(err){
                atomCb(err);
            }
            else {
                var id = parseInt(result.toString());
                params._id = id;
                params.taskId = data.taskId;
                CallListRequest(params).save(function(err, result){
                    if(!err) {
                        atomCb(null, result);
                    } else {
                        atomCb(err);
                    }
                });
            }
        })
    }];

    atomSteps.dm = function(atomCb) {
        userDao.find({position : dictionary.userPosition.dm, status : dictionary.userStatus.ok}, atomCb);
    };

    atomSteps.saveTask = ['taskId', 'saveCallListRequest', 'dm', function(atomCb, data) {
        if(data.dm) {
            var task = {};
            task._id = data.taskId;
            task.refId = data.saveCallListRequest._id;
            task.refObj = {level : data.saveCallListRequest.level, count : data.saveCallListRequest.count,
                comment : data.saveCallListRequest.comment, ctime : data.saveCallListRequest.ctime, status : dictionary.callListRequestStatus.unassigned,
                requestUser:{id : data.saveCallListRequest.cuserid, realName : data.saveCallListRequest.crealName}};
            task.type = dictionary.taskType.callListRequest;
            var dms = data.dm;
            var dmsIds = _.pluck(dms, '_id');
            task.belongUser = dmsIds;
            task.done = false;
            task.ctime = new Date();
            taskDao.add(task, function(err, result) {
                if(err) {
                    atomCb(err);
                } else {
                    atomCb(null, result);
                }
            });
        } else {
            atomCb(null, true);
        }

    }];

    async.auto(atomSteps, cb);

};

exports.modify = function(params, cb) {
    var _id = parseInt(params._id);
    delete params._id;
    CallListRequest.update({_id : _id}, params, cb);
};

exports.find = function(where, cb) {
    CallListRequest.find(where, cb);
}

exports.count = function(where, cb) {
    CallListRequest.count(where, cb);
}

exports.findById = function(_id, cb) {
    CallListRequest.findById(_id, cb);
}

exports.findWithWorkGroupById = function (id, cb) {
    this.findById(id, function(err, result) {
        if(err) cb(err, null);
        else {
            workGroupDao.findOneByUserId(result.cuserid, function(err, doc) {
                if(err) cb(err, null);
                result._doc.workGroup = doc;
                cb(null, result);
            });
        }
    });
}

exports.delete = function(_id, cb) {

}

exports.cancel = function(_id, cb) {
    var task = {};
    task.cancel = function(next) {
        CallListRequest.update({_id : _id}, {status : dictionary.callListRequestStatus.canceled}, next);
    };

    task.findTask = function(next) {
        taskDao.findOne({refId: _id, type : dictionary.taskType.callListRequest}, next);
    };

    task.cancelTask = ['cancel', 'findTask', function(next, data) {
        sender.refreshTaskCountByUserIds(sioHelper.get(), data.findTask.belongUser, {});
        taskDao.client.update({type : dictionary.taskType.callListRequest, refId : _id}, {done : true, doneTime : new Date(), 'refObj.status' : dictionary.callListRequestStatus.canceled}, next);
    }];
    async.auto(task, cb);
}

exports.assign = function(id, cb) {
    CallListRequest.update({_id : id}, {status : dictionary.callListRequestStatus.assigned}, cb);
}

