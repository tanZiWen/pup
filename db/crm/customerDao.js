/**
 * Created by wangnan on 14-5-30.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Customer = exports.client = model.crm_customer;
var idg = require('../../db/idg');
var dictionary = require('../../lib/dictionary');
var utils = require('../../lib/utils');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.add = function (customerObj, cb) {
    idg.next(Customer.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = result.toString();
            var code = id;
            customerObj.code = code;
            if(!customerObj._id) {
                customerObj._id = parseInt(id);
            }
            Customer(customerObj).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.find = function(where, cb) {
    Customer.find(where, {}, cb);

}

exports.findOne = function(where, cb) {
    Customer.findOne(where, {}, cb);
}

exports.findById = function(id, callback) {
    Customer.findById(id, function(err, doc) {
        if(err)
            callback(err);
        else
            callback(null, doc);
    });
}

exports.modifyById = function(id, updator, callback) {
    Customer.update({_id : id}, updator, callback);
}

exports.modifyByIds = function(ids, updator, callback) {
    Customer.update(ids, updator, { multi: true }, callback);
}


exports.recycleData = function(customerIds, updator, cb) {
    Customer.update({_id : {$in : customerIds}}, updator, {multi : true}, cb);
}

exports.reallocateData = function(customerIds, updator, cb) {
    Customer.update({_id : {$in : customerIds}}, updator, {multi : true}, cb);
}

exports.countUnDoPlan = function(userId, cb) {
    Customer.aggregate(
        {$match: {belongUser: userId}},
        {$group:{_id: '$belongUser', count: {$sum: 1}}}
    ).exec(function(err, result) {
        if(err) {
            cb(err);
        } else {
            var total = _.reduce(_.pluck(result, 'count'), function(memo, num){return memo + num;}, 0);
            cb(null, total);
        }
    });
}

exports.findCustomerByUser = function(userId, callback) {
    Customer.find({belongUser : userId, free : false}, callback);
}

exports.findRecycleDistributionByUser = function(userId, callback) {
    Customer.find({
        $or : [{belongUser : userId}, {manager : userId}],
        status : {$in : ['potential', 'bc20', 'bc40', 'bc60','bc80','deal','vip','diamondVip', 'crownedVip']}
    }, function(err, docs) {
        if(err) {
            callback(err);
        } else {
            var customers = null;
            if(docs) {
                customers = _.pluck(docs, '_doc');
            } else {
                customers = [];
            }
            callback(null, customers);
        }
    });
};

exports.findRecycleDistribution = function(userId, callback) {
    Customer.find({
        belongUser : userId,
        status : {$in : ['potential', 'bc20', 'bc40', 'bc60','bc80','deal','vip','diamondVip', 'crownedVip']}
    }, function(err, docs) {
        if(err) {
            callback(err);
        } else {
            var customers = null;
            if(docs) {
                customers = _.pluck(docs, '_doc');
            } else {
                customers = [];
            }
            callback(null, customers);
        }
    });
};

exports.aggregateStatisticExist = function(cb) {
    Customer.aggregate([
        {$match: {free: true, status: {$nin: [null, '', 'potential']}, lastCall: {$ne: null}}},
        {$group: {_id: {year: {$year: '$lastCall.lastCallDate'}, status: '$status'}, count: {$sum: 1}}},
        {$group: {_id: '$_id.year', data: {$push: {status : '$_id.status', count: '$count'}}}},
        {$sort: {_id: -1}}
    ]).exec(cb);
};

exports.aggregateStatisticInExist = function(cb) {
    Customer.aggregate([
        {$match: {free: true, status: {$nin: [null, '', 'potential']}, lastCall: null}},
        {$group: { _id: '$status', count: {$sum: 1}}}
    ]).exec(cb);
};