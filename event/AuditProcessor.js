
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

var customerAuditRecordDao = require('../db/crm/customerAuditRecordDao.js'),
    dictionary = require('./../lib/dictionary.js'),
    idg = require('../db/idg.js'),
    sender = require('../routes/sender.js'),
    commonProcessor = require('./CommonProcessor.js');

//质检
exports.handleMsg = function(io, models, task, msg, next) {
    //var msg = {'type' : 'common', body: {receiverIds:[10000], type: 'notice', model: 'audit', referenceId: 100001, data: {}}};
    var auditObj = msg.body.data;
    customerAuditRecordDao.create(auditObj, function(err, result) {
        if(!err) {
            //send online msg
            commonProcessor.handleMsg(io, models, task, msg, next);
        } else {
            console.log(err);
            next(err, task._id);
        }
    });
};

