/**
 * Created by wangnan on 14-8-14.
 */

var recordingDao = require('../../db/crm/recordingDao.js');
var idg = require('../../db/idg.js');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var _ = require('underscore');
var async = require('async');

exports.add = function(req, res) {
    var user = req.session.user;
    var customerId = req.param('customerId');
    var recordId = req.param('recordId');
    var recording = {};
    recording.customerId = customerId;

    recording.userId = user._id;

    var steps = {};
    steps.recordings = function(next) {
        recordingDao.client.find({recordId: recordId}, next);
    };

    steps.add = ['recordings', function(next, data) {
        if(!data || _.isEmpty(data.recordings)) {
            if(recordId) {
                recording.recordId = recordId;
                recordingDao.client.add(recording, idg, next);
            } else {
                next(null, false);
            }
        }else {
            next(null, false);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('recording.add : err : ' + err.stack + ', userId : ' + user._id + ', extNo : ' + user.extNo + ', customerId : ' + customerId);
            res.json({toast : {type : 'error', body : '保存录音记录异常'}});
        } else {
            if(result.add) {
                res.json({toast : {type : 'success', body : '录音记录已保存'}});
            }else {
                res.json({toast : {type : 'error', body : '保存录音记录异常'}});
            }
        }
    });
};