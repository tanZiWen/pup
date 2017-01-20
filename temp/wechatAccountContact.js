/**
 * Created by tanyuan on 5/11/15.
 */


var wechatAccountContact = require('../db/crm/wechatAccountContactDao');

var wechatAccount = require('../db/crm/wechatAccountDao');

var async = require('async');


exports.init = function(req, res) {
    wechatAccountContact.client.find({}, function(err, docs) {
        if(err) {
            res.json({err: err.stack});
        }else {
            var steps = {};
            _.each(docs, function(value) {
                steps['wehcatAccountContact'+value._id] = function(next) {
                    var telNo = value.telNo;
                    telNo = telNo.substring(telNo.length - 11);
                    wechatAccountContact.client.update({_id: value._id}, {telNo: telNo}, next);
                }
            });
            async.parallel(steps, function(err, cb) {
                if(err) {
                    res.json({err: err.stack});
                }else {
                    res.json({success: 'success'});
                }
            })

        }
    });
};

exports.delete = function(req, res) {
    wechatAccountContact.client.aggregate([
        {$group: {_id: {accountId: '$belongAccount.accountId', telNo: '$telNo'}, count: {$sum: 1}}},
        {$match: {count: {$gt: 1}}},
        {$sort: {count: -1}}
    ], function(err, docs) {
        if(err) {
            res.json({err: err.stack});
        }else {
            var steps = {};
            _.each(docs, function(value) {
                steps['wechatAccountContact'+ value._id.accountId] = function(next) {
                    wechatAccountContact.client.remove({'belongAccount.accountId': value._id.accountId, telNo: value._id.telNo}, next);
                };
                async.parallel(steps, function(err, cb) {
                    if(err) {
                        res.json({err: err.stack});
                    }else {
                        res.json({success: 'success'});
                    }
                })
            })
        }
    })
};

exports.drop = function(req, res) {
    wechatAccountContact.client.drop();
}

exports.contacts = function(req, res) {
    wechatAccount.client.update({}, {$set: {contacts: []}}, {multi: true}, function(err, result) {
        if(err) {
            res.json({err: err.stack});
        }else {
            res.json({success: 'success'});
        }
    })
}