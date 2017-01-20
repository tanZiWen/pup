/**
 * Created by tanyuan on 11/17/14.
 */

var customerAuditRecordDao = require('../db/crm/customerAuditRecordDao');
var taskDao = require('../db/crm/taskDao');
var _ = require('underscore');
var async = require('async');

exports.init = function(req, res) {
    var steps = {};

    steps.auditRecords = function(next) {
        customerAuditRecordDao.findAll({}, next);
    };

    steps.tasks = function(next) {
        taskDao.find({}, next);
    };

    async.parallel(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            var auditRecords = _.pluck(result.auditRecords, '_doc');
            var tasks = _.pluck(result.tasks, '_doc');
            var step = {};
            _.each(auditRecords, function(key) {
                var isExsit = _.findWhere(tasks, {refId: key._id});
                if(_.isEmpty(isExsit)) {
                    step['remove'+key._id] = function(next) {
                        customerAuditRecordDao.client.remove({_id: key._id}, next);
                    }
                }
            });
            async.parallel(step, function(err, result) {
                if(err) {
                    res.json(500, {err: err.stack});
                }else {
                    res.json({success: '操作成功'});
                }
            });
        }
    });
};
