/**
 * Created by wangnan on 14-5-15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var MsgTask = exports.client = model.crm_msgTask;
var userDao = require('../upm/userDao');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = MsgTask;

exports.create = function (mskTypeObj, cb) {
    idg.next(MsgTask.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            if(!mskTypeObj._id) {
                mskTypeObj._id = id;
            }
            MsgTask(mskTypeObj).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.find = function (where, cb) {
    MsgTask.find(where, cb);
}

exports.handleSucc = function(id, cb) {
    MsgTask.update({_id: id}, {$set: {status: 1}}, cb);
}
