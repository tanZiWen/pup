/**
 * Created by wangnan on 14-7-11.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var CustomerHistory = exports.client = model.crm_customer_history;

exports.modifyById = function(id, updator, cb) {
    CustomerHistory.update({_id: id}, updator, function(err, doc) {
        if(err) {
            cb(err);
        } else {
            cb(null, doc);
        }
    });
}