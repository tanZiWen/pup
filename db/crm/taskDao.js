/**
 * Created by wangnan on 14-6-24.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Task = exports.client = model.crm_task;
var idg = require('../../db/idg');
var sender = require('../../routes/sender');
var sioHelper = require('../../lib/sioHelper');

exports.model = Task;

exports.add = function (params, cb) {
    Task(params).save(function(err, doc) {
        cb(err, doc);
        if(!err)
            sender.refreshTaskCountByUserIds(sioHelper.get(), doc.belongUser, {});
    });
};

exports.done = function(_id, cb) {
    Task.update({_id: _id}, {done : true}, cb);
};

exports.countUndoByUserId = function(userId, cb) {
    Task.count({belongUser: {$in : [userId]}, done : false}, cb);
}

exports.modifyById = function(id, cb) {
    Task.update({_id: id}, {done : true, doneTime: new Date()}, cb);
};

exports.modify = function(id, params, cb) {
    Task.update({_id: id}, params, cb);
}

exports.findTask = function(params, cb) {
    Task.findOne(params, cb);
};
exports.find = function(params, cb) {
    Task.find(params, cb);
}
exports.findOne = function(params, cb) {
    Task.findOne(params, cb);
}

exports.update = function(id, params, cb) {
    Task.update(id, params, cb);
};





