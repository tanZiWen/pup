/**
 * Created by wangnan on 14-5-15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var Employee = exports.client = model.crm_employee;
var userDao = require('../upm/userDao');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = Employee;

//exports.findByPage = function(pagination, where, cb) {
//
//    exports.findAndSortByPage(pagination, where, {}, cb);
//}

//exports.findAndSortByPage = function(pagination, where, sort, cb) {
//
//    var steps = [];
//
//    var countTotal = function(next) {
//        Employee.count(where, next);
//    }
//
//    var findRecords = function(count, next) {
//        if(count > 0) {
//            pagination.totalNum = count;
//            Employee.find(where, {}, {skip: pagination.skip, limit: pagination.items_per_page, sort: sort}, next);
//        } else {
//            next(null, []);
//        }
//    }
//    steps.push(countTotal);
//    steps.push(findRecords);
//
//    async.waterfall(steps, function(err, result) {
//        if(err) {
//            cb({page: pagination, data: []});
//        } else {
//            cb({page: pagination, data: result});
//        }
//    });
//}



exports.add = function (params, cb) {
    idg.next(Employee.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            Employee(params).save(function(err){
                if(!err) {
                   cb(null, result);
                } else {
                   cb(err);
                }
            });
        }
    })

};

exports.modify = function(params, cb) {
    var _id = parseInt(params._id);
    delete params._id;
    Employee.update({_id : _id}, params, {upsert: true}, cb);
};

exports.find = function(where, cb) {
    Employee.find(where, cb);
}

exports.findById = function(_id, cb) {
    Employee.findById(_id, cb);
}

exports.delete = function(_id, cb) {
    userDao.deleteByEmployee(_id, function(err, result) {
        if(err) {
            cb(err, null);
        } else {
            Employee.remove({_id: _id}, cb);
        }
    });
}

