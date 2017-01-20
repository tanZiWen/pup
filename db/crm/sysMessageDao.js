/**
 * Created by wangnan on 14-5-15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var SysMessage = exports.client = model.crm_sys_message;
var userDao = require('../upm/userDao');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = SysMessage;

exports.add = function (params, cb) {
    idg.next(SysMessage.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            SysMessage(params).save(function(err){
                if(!err) {
                   cb(null, result);
                } else {
                   cb(err);
                }
            });
        }
    })

};

exports.modify = function(params, cb) {
    var _id = parseInt(params._id);
    delete params._id;
    SysMessage.update({_id : _id}, params, cb);
};

exports.find = function(where, cb) {
    SysMessage.find(where, cb);
};

exports.findById = function(id, cb) {
    SysMessage.findById(id, cb);
}

exports.countUnreadMsgByUserId = function(userId, cb) {
    SysMessage.count({'receiver.userid' : userId, read : false}, cb);
};
