/**
 * Created by michael on 5/30/14.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var OrderPRDSign = exports.client = model.crm_orderPRDSign;
var userDao = require('../upm/userDao');
var customerDao = require('../crm/customerDao');
var taskDao = require('../../db/crm/taskDao');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = OrderPRDSign;


exports.create = function(orderPRDSign, cb) {

    idg.next(OrderPRDSign.collection.name, function (err, idBuf){
        if(err) {
            cb(err);
        } else {
            orderPRDSign._id = parseInt(idBuf.toString());
            OrderPRDSign(orderPRDSign).save(cb);
        }
    });
}

exports.signForConsultant = function(_id, params, cb) {

    var steps = {};

    steps.updateOrderPRDSign = function(next) {
        OrderPRDSign.update({_id : _id}, params, next);
    };

    steps.getPRDSign = function(next) {
        OrderPRDSign.findById(_id, next);
    };

    steps.taskDone = ['getPRDSign', function(next, data) {
        if(data.getPRDSign) {
            taskDao.done(data.getPRDSign.taskId, next);
        } else {
            next(null);
        }
    }];

    async.auto(steps, cb);

}

exports.signForPM= function(_id, params, cb) {

    var steps = {};

    steps.taskId = function(atomCb) {
        idg.next(taskDao.model.collection.name, function (err, idBuf){
            if(err) {
                atomCb(err);
            } else {
                atomCb(null, idBuf.toString());
            }
        });
    };

    steps.updateOrderPRDSign = ['taskId', function(next, data) {
        params.taskId = data.taskId;
        OrderPRDSign.update({_id : _id}, params, next);
    }];

    steps.getPRDSign = ['updateOrderPRDSign', function(next, data) {
        OrderPRDSign.findById(_id, next);
    }];

    steps.cutomerConsultant = ['getPRDSign', function(next, data) {
        customerDao.findById(data.getPRDSign.customer.customerId, function(err, result) {
            if(err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    }];


    //create task for consultant whose customer is this order's
    steps.createTask = ['taskId', 'getPRDSign', 'cutomerConsultant', function(next, data) {
        if(!_s.isBlank(data.cutomerConsultant)) {
            var task = {};
            task._id = data.taskId;
            task.refId = data.getPRDSign._id;
            task.refObj = {orderId : data.getPRDSign.orderId, product : {id: data.getPRDSign.product.productId,
                name : data.getPRDSign.product.name, type : data.getPRDSign.product.type},
                productRefData : {refDataId : data.getPRDSign.productRefData.refDataId, name : data.getPRDSign.productRefData.name},
                customer : {id : data.getPRDSign.customer.customerId, name : data.getPRDSign.customer.name}};
            task.type = dictionary.taskType.orderPRDSign;
            task.belongUser = data.cutomerConsultant.belongUser;
            task.done = false;
            task.ctime = new Date();
            taskDao.add(task, function(err, result) {
                if(err) {
                    cb(err);
                } else {
                    cb(null, result);
                }
            });
        } else {
            cb(null);
        }
    }];

    async.auto(steps, cb);

}