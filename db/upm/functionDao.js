/**
 * Created by wangnan on 14-4-18.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Func = exports.client = model.upm_function;
var _ = require('underscore');

exports.findByApp = function(appCode, callback) {
    Func.find({appCode : appCode}).sort({_id : 1}).exec(callback);
}

exports.findAll = function(cb) {
    Func.find({}, cb);
}

exports.findByCode = function(code, cb) {
    Func.find({code: code}, cb);
}

exports.findByRoles = function(roles, callback) {
    var functionCodes = [];
    _.each(roles, function(role) {
        functionCodes = _.union(functionCodes, role.fnCodes);
    });
    Func.find({"code" : {"$in" : functionCodes}}).sort({_id : 1}).exec(callback);
}