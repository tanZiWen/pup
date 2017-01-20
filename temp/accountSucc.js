/**
 * Created by tanyuan on 4/13/15.
 */

var customerDao = require('../db/crm/customerDao');

var async = require('async');

var _ = require('underscore');


exports.init = function(req, res) {
    var num = [];
    for(var i = 0; i< 24; i++) {
        num.push(i);
    }
    async.map(num, function(key, cb) {
        console.log(key);
        customerDao.client.find({}, {}, {limit: 100000, skip: key*100000}, function(err, doc){
            if(err) {
                cb(err);
            }else {
                var steps = {};
                _.each(doc, function(val) {
                    steps['customer'+val._id] = function(next) {
                        customerDao.client.update({_id: val._id}, {$set: {random : [Math.random()*180, Math.random()*180]}}, next);
                    }
                });
                async.parallel(steps, cb);
            }
        });
    }, function(err, result) {
        if(err) {
            res.json({err: err.stack});
        }else {
            res.json({succ: 'succ'});
        }
    });
};