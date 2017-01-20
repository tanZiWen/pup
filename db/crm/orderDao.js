/**
 * Created by wangnan on 14-5-15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var Order = exports.client = model.crm_order;
var userDao = require('../upm/userDao');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = Order;

exports.add = function (params, cb) {
    idg.next(Order.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            params.code = id;
            Order(params).save(function(err){
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
    Order.update({_id : _id}, params, cb);
};

exports.find = function(where, cb) {
    Order.find(where, cb);
}

exports.findById = function(_id, cb) {
    Order.findById(_id, cb);
}

exports.delete = function(_id, cb) {
    Order.update({_id : _id}, {status : dictionary.orderStatus.cancel}, cb);
}

exports.dividend = function(dividend, cb) {
    var _id = dividend.orderId;
    delete dividend.orderId;
    Order.update({_id : _id}, {$push : {dividend : dividend}}, cb);
}

exports.sumOrderAmountByPrd = function(productId, cb) {
    Order.aggregate(
        {$match: {status : {$ne : dictionary.orderStatus.cancel}, 'product.productId': parseInt(productId)}},
        {$group:{_id: null, count: {$sum: '$amount'}}}
    ).exec(function(err, result) {
        if(err) {
            cb(err);
        } else {
            if(result && result.length > 0) {
                cb(null, result[0].count);
            } else {
                cb(null, 0);
            }
        }
    });
}
