/**
 * Created by michael on 14-5-26.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var orderPRDSignDao = require('../../db/crm/orderPRDSignDao');
var customerDao = require('../../db/crm/customerDao');
var taskDao = require('../../db/crm/taskDao');
var orderDao = require('../../db/crm/orderDao');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var ProductRefData = exports.client = model.crm_product_ref_data;
var Product = exports.client = model.crm_product;
var Order = exports.client = model.crm_order;

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = ProductRefData;

exports.latestNumber = 3;


exports.create = function(productRefData, user, cb) {
    var steps = {};


    steps.generator = function(next) {
        idg.next(ProductRefData.collection.name, next);
    };


    steps.saveRefData = ['generator', function(next, data) {
        var id = parseInt(data.generator.toString());
        productRefData._id = id;
        ProductRefData(productRefData).save(function(err, result) {
            if(err) {
                next(err);
            } else {
                next(null, result);
            }
        });
    }];

    steps.getProduct = function(next) {
        Product.findById(productRefData.productId, {}, next);
    };

    steps.getOrders = function(next) {
        //TODO insert other querying condition
        orderDao.model.find({'product.productId' : productRefData.productId}, next);
    }

    steps.savePrdOrderSign = ['saveRefData', 'getProduct', 'getOrders', function(next, data) {
        var subSteps = {};
        var i = 0;
        _.each(data.getOrders, function(order) {
            i ++;
            var fnName = 'fn' + i;
            subSteps[fnName] = function(callback) {
                var prdOrderSign = {};
                prdOrderSign.orderId = order._id;
                prdOrderSign.taskId = 0;
                prdOrderSign.customer = {customerId: order.customer.customerId, name : order.customer.name, telNo : order.customer.telNo};
                prdOrderSign.product = {productId : data.getProduct._id, name : data.getProduct.name, type : data.getProduct.type};
                prdOrderSign.productorSigned = dictionary.orderPRDSgin.unsigned;
                prdOrderSign.salesSigned = dictionary.orderPRDSgin.unsigned;
                prdOrderSign.productRefData = {refDataId: data.saveRefData._id, name : data.saveRefData.name};
                prdOrderSign.signUserid = user._id;
                prdOrderSign.signUsername = user.username;
                prdOrderSign.signUserRealName = user.realName;
                prdOrderSign.signTime = new Date();
                prdOrderSign.ctime = new Date();
                orderPRDSignDao.create(prdOrderSign, function(err, result) {
                    if(err) {
                        callback(err);
                    } else {
                        callback(null, result);
                    }
                });
            }
        });

        async.parallel(subSteps, next);
    }];

    async.auto(steps, cb);

}

exports.getLatestRecords = function(productId, cb) {
    ProductRefData.find({productId: productId}, {}, {skip: 0, limit: this.latestNumber, sort: {ctime: -1}}, cb);
}