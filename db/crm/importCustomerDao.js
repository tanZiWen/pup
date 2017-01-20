/**
 * Created by wangnan on 14-5-15.
 */
var model = exports.model = require('./model');
var db = exports.db = model.db;
var ImportCustomer = exports.client = model.crm_import_customer;

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = ImportCustomer;

exports.find = function (where, cb) {
    ImportCustomer.find(where, cb);
}
