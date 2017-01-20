/**
 * Created by wangnan on 14-5-15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var CustomerAuditRecord = exports.client = model.crm_customer_audit_record;
var userDao = require('../upm/userDao');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = CustomerAuditRecord;

exports.create = function (obj, cb) {
    idg.next(CustomerAuditRecord.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            if(!obj._id) {
                obj._id = id;
            }
            CustomerAuditRecord(obj).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.find = function (where, cb) {
    CustomerAuditRecord.findOne(where, cb);
}

exports.modifyById = function(where, params, cb) {
    CustomerAuditRecord.update(where, params, cb);
}

exports.findAll = function(where, cb) {
    CustomerAuditRecord.find(where, cb);
}