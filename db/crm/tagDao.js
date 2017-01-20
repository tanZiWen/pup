/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Tag = exports.client = model.crm_tag;

exports.findByType = function(type, callback) {
    Tag.find({type : type}, function(err, tags) {
        if(err)
            callback(err);
        else {
            callback(null, tags);
        }
    });
}