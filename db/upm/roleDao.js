/**
 * Created by wangnan on 14-4-18.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Role = exports.client = model.upm_role;

exports.findByUser = function(user, callback) {
    Role.find({"code" : {"$in" : user.roleCodes}}, callback);
}

exports.findAllRoles = function(cb) {
    Role.find({}, cb);
}

exports.findById = function(id, cb) {
    Role.findOne({_id: id}, cb);
}