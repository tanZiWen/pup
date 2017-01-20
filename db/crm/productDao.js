/**
 * Created by wangnan on 14-5-15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var Product = exports.client = model.crm_product;

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = Product;


exports.create = function(productData, cb) {
    var id = 0;
    idg.next(Product.collection.name, function (err, result) {
        if (err) {
            cb(err, null);
        } else {
            id = parseInt(result.toString());
            productData._id = id;
            console.log(productData)
            Product(productData).save(cb);
        }
    });
};

exports.findById = function(_id, cb) {
    Product.findById(_id, cb);
};

exports.modify = function(params, cb) {
    console.log('params:', params);
    var _id = parseInt(params._id);
    delete params._id;
    Product.update({_id : _id}, params, cb);
};

exports.findName = function(cb){
    Product.find({status : {$in : ['hot','selling']}}, cb);
};

exports.find = function(params, cb) {
    Product.find(params, cb);
};

