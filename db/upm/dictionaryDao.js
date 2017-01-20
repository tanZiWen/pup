/**
 * Created by wangnan on 14-4-18.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Dictionary = exports.client = model.upm_dictionary;


exports.findAll = function(cb) {
    Dictionary.find({}, {}, {sort:{viewOrder: 1}}, cb);
}