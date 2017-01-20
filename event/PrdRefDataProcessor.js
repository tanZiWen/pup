
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

var orderPRDSignDao = require('../db/crm/orderPRDSignDao.js'),
    dictionary = require('./../lib/dictionary.js'),
    idg = require('../db/idg.js'),
    sender = require('../routes/sender.js'),
    commonProcessor = require('./CommonProcessor.js');
var model = exports.model = require('../db/crm/model');
var Product = exports.client = model.crm_product;
var Order = exports.client = model.crm_order;
var OrderPRDSign = exports.client = model.crm_orderPRDSign;

//质检
exports.handleMsg = function(io, models, task, msg, next) {
    //var msg = {'type' : 'prdRefData', body: {receiverIds:[10000], type: 'fileSign', model: 'orderPRDSign', data:{prdouctId:111, name:'123'}, referenceId: 100001}};

    var steps = {};

    steps.getProduct = function(next) {
        Product.find({productId : msg.body.data.productId}, {}, next);
    };

    steps.getOrders = function(next) {
        //TODO insert other querying condition
        Order.find({'product.productId' : msg.body.data.productId}, {}, next);
    }

    steps.savePrdOrderSign = ['getProduct', 'getOrders', function(next, data) {
        var subSteps = {};
        var i = 0;
        _.each(data.getOrders, function(order) {
            i ++;
            var fnName = 'fn' + i;
            subSteps[fnName] = function(next) {
                idg.next(orderPRDSignDao.model.collection.name, function (err, idBuf){
                    if(err) {
                        next(err);
                    } else {
                        var prdOrderSign = {};
                        prdOrderSign._id = parseInt(idBuf.toString());
                        prdOrderSign.orderId = order._id;
                        prdOrderSign.customer = order.customer;
                        prdOrderSign.product = {productId : data.getProduct._id, name : data.getProduct.name, type : data.getProduct.type};
                        prdOrderSign.status = dictionary.orderPRDSgin.unsigned;
                        prdOrderSign.productRefData = {refDataId: msg.body.data._id, name : msg.body.data.name};
                        prdOrderSign.ctime = new Date();
                        OrderPRDSign(prdOrderSign).save(next);
                    }
                });
            }
        });

        async.parallel(subSteps, next);
    }];

    async.auto(steps, function(err, result) {
        if(!err) {
            //send online msg
            commonProcessor.handleMsg(io, models, task, msg, next);
        } else {
            console.log(err);
            next(err, task._id);
        }
    });
};

