/**
 * Created by michael on 14-5-26.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var ProductTrend = exports.client = model.crm_product_trend;

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = ProductTrend;

exports.latestNumber = 3;


exports.create = function(productTrendData, cb) {
    var id = 0;
    idg.next(ProductTrend.collection.name, function (err, result) {
        if (err) {
            cb(err, null);
        } else {
            id = parseInt(result.toString());
            productTrendData._id = id;
            ProductTrend(productTrendData).save(cb);
        }
    });
}

exports.getLatestRecords = function(productId, cb) {
    ProductTrend.find({productId: productId}, {}, {skip: 0, limit: this.latestNumber, sort: {ctime: -1}}, cb);
}