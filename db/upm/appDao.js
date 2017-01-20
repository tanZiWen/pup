/**
 * Created by wangnan on 14-4-23.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var App = exports.client = model.upm_app;

exports.findAll = function(callback) {
    App.find({}, callback);
}

exports.findByCode = function(code, callback) {
    App.findOne({code : code}, callback);
}
