/**
 * Created by wangnan on 14-6-9.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var idg = require('../../db/idg');
var CustomerActionPlan = exports.client = model.crm_customer_action_plan;
var dictionary = require('../../lib/dictionary');

exports.add = function(params, cb){
    CustomerActionPlan(params).save(function(err){
       cb(err);
    });
};

exports.findUndoPlanForCustomers = function(user, customerIdList, callback) {
    var query = {};
    if(user.position == dictionary.userPosition.rm) {
        query['$or'] = [{customerId : {$in : customerIdList}}, {rm : user._id}];
    } else {
        query['customerId'] = {$in : customerIdList};
    }
    query['done'] = false;
    CustomerActionPlan.find(query, callback);
};

exports.findCustomerInfo = function(data, optional, cb) {
    CustomerActionPlan.loadRefFor(data, optional, cb);
}

exports.findPlanById = function(id, cb) {
    CustomerActionPlan.findById(id, cb);
}

exports.find = function(params, cb) {
    CustomerActionPlan.find(params, cb);
}



