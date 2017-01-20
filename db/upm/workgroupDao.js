/**
 * Created by wangnan on 14-4-18.
 */
var orgModel = require('../../app/portal/orgModel');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var Workgroup = exports.client = model.upm_workgroup;
var idg = require('../../db/idg');
var dictionary = require('../../lib/dictionary');

var dictionary = require('../../lib/dictionary');

var async = require('async');
var _ = require('underscore'),
    _s = require('underscore.string');

exports.create = function(params, cb) {
    idg.next(Workgroup.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = result.toString();
            params.code = id;
            if(!params._id) {
                params._id = parseInt(id);
            }
            console.log(params);
            Workgroup(params).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
}

exports.findAll = function(cb) {
    Workgroup.find({}, {}, cb);
}

exports.findByOrg = function(orgCode, cb) {
    var orgCodes = orgModel.getOrgCodesByParentCode(orgCode);
    orgCodes.push(orgCode);
    Workgroup.find({orgCode : {$in : orgCodes}}, {}, cb);
}

exports.findById = function(id, cb) {
    Workgroup.findById(id, cb);
}

exports.findOneByUserId = function(userid, cb) {
    Workgroup.findOne({workers : {$elemMatch : {userid : userid}}}, cb);
}

exports.findByLeaders = function(leaders, cb) {
    Workgroup.find({isDel : {$ne: true}, workers : {$elemMatch : {
        userid : {$in : leaders},
        workerRoles : {$in : [dictionary.workerRole.leader]}}}}, cb);
}

exports.findOne = function(where, cb) {
    Workgroup.findOne(where, {}, cb);
}

exports.find = function(where, cb) {
    Workgroup.find(where, {}, cb);
}


exports.findWechatAccountByUser = function(userId, cb) {
    Workgroup.findOne({type : dictionary.workGroupType.wechat}, {'workers' : {$elemMatch : {userid : userId}}}, function(err, doc) {
        if(err) {
            cb(null, []);
        } else {
            if(doc.workers.length > 0 && _.has(doc.workers[0]._doc, 'assignAccounts')) {
                cb(null, doc.workers[0]._doc.assignAccounts);
            } else {
                cb(null, []);
            }
        }
    });
}

exports.findUsersByWechat = function(wechatNo, cb) {
    Workgroup.find({type : dictionary.workGroupType.wechat, 'workers.assignAccounts.code' : wechatNo}, function(err, docs) {
        if(err) {
            cb(null, []);
        } else {
            var workers = _.flatten(_.pluck(docs, 'workers'));
            var userIds = [];
            _.each(workers, function(worker) {
                var linkWorker = _.find(worker.assignAccounts, function(account) {
                    return account.code == wechatNo;
                });
                if(linkWorker) {
                    userIds.push(worker.userid);
                }
            });
            cb(null, userIds);
        }
    });
}

exports.update = function(id, params, cb) {
    Workgroup.update({_id: id}, params, cb);
}
