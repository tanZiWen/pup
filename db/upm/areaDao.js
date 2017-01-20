/**
 * Created by wangnan on 14-4-18.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Area = exports.client = model.upm_area;

exports.findByCode = function(code, callback) {
    Area.findOne({code : code}, callback);
}

exports.findAll = function(callback) {
    Area.find({}, {}, callback);
}
