/**
 * Created by wangnan on 14-4-18.
 */
var async = require('async');
var _ = require('underscore');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var User = exports.client = model.upm_user;
var dictionary = require('../../lib/dictionary');
var workGroupDao = require('../../db/upm/workgroupDao');
var idg = require('../../db/idg');

exports.add = function(params, cb) {
    idg.next(User.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = result.toString();
            if(!params._id) {
                params._id = parseInt(id);
            }
            User(params).save(function(err){
                if(!err) {
                    cb(null, params._id);
                } else {
                    cb(err);
                }
            });
        }
    })
};
exports.findByUsername = function(username, cb) {
    User.findOne({username : username, status : 'ok'}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            if(result) {
                result.password = 0;
            }
            cb(null, result);
        }
    });
};

exports.findByUserName = function(username, cb) {
    User.findOne({username : username}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            if(result) {
                result.password = 0;
            }
            cb(null, result);
        }
    });
};


exports.deleteByEmployee = function(employeeId, cb) {
    User.update({employeeid: employeeId}, {status: dictionary.userStatus.delete}, cb);
};

exports.findRM = function(cb) {
    User.find({position : dictionary.userPosition.rm, status : dictionary.userStatus.ok}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            _.each(result, function(value) {
                value._doc.password = 0;
            });
            cb(null, result);
        }
    });
};

exports.findConsultant = function(cb) {
    User.find({position : dictionary.userPosition.consultant, status : dictionary.userStatus.ok}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            _.each(result, function(value) {
                value._doc.password = 0;
            });
            cb(null, result);
        }
    });
};

exports.findDM = function(cb) {
    User.find({position : dictionary.userPosition.dm, status : dictionary.userStatus.ok}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            _.each(result, function(value) {
                value._doc.password = 0;
            });
            cb(null, result);
        }
    });
};

exports.findAllSeller = function(cb) {
    User.find({
        position : {$in : [
            dictionary.userPosition.rm,
            dictionary.userPosition.consultant
        ]}, status : dictionary.userStatus.ok}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            _.each(result, function(value) {
                value._doc.password = 0;
            }) ;
            cb(null, result);
        }
    });
};

exports.findAuditor = function(cb) {
    User.find({roleCodes : {$in: ["AUDITOR"]}, status: dictionary.userStatus.ok}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            _.each(result, function(value) {
                value._doc.password = 0;
            });
            cb(null, result);
        }
    });
};

exports.findProdctor = function(cb) {
    User.find({roleCodes: {$in: ['PM']}, status: dictionary.userStatus.ok}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            _.each(result, function(value) {
                value._doc.password = 0;
            });
            cb(null, result);
        }
    });
};

exports.find = function(where, cb) {
    User.find(where, function(err, result) {
        if(err) {
            cb(err);
        }else {
            _.each(result, function(value) {
                value._doc.password = 0;
            });
            cb(null, result);
        }
    });
};

exports.findOne = function(where, cb) {
    User.findOne(where, cb);
};

exports.findByWorkGroup = function(groupId, cb) {
    var steps = [];
    var findWorkGroup = function(next) {
        workGroupDao.findById(groupId, next);
    };

    var findUsers = function(data, next) {
        var userIds = _.pluck(data.workers, 'userid');
        User.find({_id : {$in : userIds}, status : dictionary.userStatus.ok}, {}, function(err, result) {
            if(err) {
                next(err);
            }else {
                _.each(result, function(value) {
                    value._doc.password = 0;
                });
                next(null, result);
            }
        });
    };
    steps.push(findWorkGroup);
    steps.push(findUsers);
    async.waterfall(steps, cb);
};

exports.findByUser = function(userId, cb) {
    User.find({_id : userId}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            _.each(result, function(value) {
                value._doc.password = 0;
            });
            cb(null, result);
        }
    });
};

exports.findById = function(userId, cb) {
    User.findById({_id : userId}, function(err, result) {
        if(err) {
            cb(err);
        }else {
            result.password = 0;
            cb(null, result);
        }
    });
};

exports.findUserInfo = function(data, optional, cb) {
    User.loadRefFor(data, optional , cb);
};

exports.updateById = function(id, params, cb) {
    User.update({_id: id}, params, cb);
};

exports.update = function(where, params, cb) {
    User.update(where, params, { multi: true }, cb);
};

exports.authUser = function(username, cb) {
    User.findOne({username : username, status : 'ok'}, cb);
};
