/**
 * Created by wangnan on 14-4-18.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Organization = exports.client = model.upm_organization;

exports.findByCode = function(code, callback) {
    Organization.findOne({code : code}, callback);
}

exports.findAll = function(callback) {
    Organization.find({}, {}, {sort:{viewOrder: 1}}, callback);
}
