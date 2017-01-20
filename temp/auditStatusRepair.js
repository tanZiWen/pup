/**
 * Created by tanyuan on 9/2/14.
 */

var customerDao = require('../db/crm/customerDao');
var customerAuditRecordDao = require('../db/crm/customerAuditRecordDao');

var async = require('async');

var _ = require('underscore');

exports.init = function(req, res) {
    var step = {};
    step.customers = function(next) {
        customerDao.find({}, next);
    };

    step.auditors = function(next) {
        customerAuditRecordDao.findAll({}, next);
    };

    step.update = ['customers', 'auditors', function(next, data) {
        var customers = _.pluck(data.customers, '_id');
        var auditors = _.pluck(_.pluck(data.auditors, 'customer'), 'customerId');
        console.log(customers);
        console.log(auditors);
        var customerId = _.difference(customers, auditors);
        console.log(customerId);
        customerDao.modifyByIds({_id: {$in : customerId}}, {$set: {auditStatus: ''}}, next);
    }];

    async.auto(step, function(err, result) {
        if(err) {
            console.log(err);
            res.json({result : 'error'})
        }else {
            res.json({result : 'success'})
//            var customers = _.pluck(result.customers, '_id');
//            var auditors = _.pluck(_.pluck(result.auditors, 'customer'), 'customerId');
//            console.log(customers);
//            console.log(auditors);
//            var customerId = _.difference(customers, auditors);
//            console.log(customerId);

        }
    });
}
