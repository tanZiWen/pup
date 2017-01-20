/**
 * Created by tanyuan on 10/11/14.
 */
var customerDao = require('../db/crm/customerDao');

var async = require('async');

var _ = require('underscore');

var G = require('../lib/global.js');

exports.init = function(req, res) {
    customerDao.find({status: {$in: ['potential', 'bc20', 'bc40', 'bc60', 'bc80', 'deal', 'vip', 'diamondVip',  'crownedVip']}}, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            var docs = _.pluck(result, '_doc');
            async.map(docs, function(doc, cb) {
               customerDao.modifyById(doc._id, {code: G.ADD_CODE_PREFIX+doc._id}, cb);
            }, function(err, callback) {
                if(err) {
                    res.json(500, {err: err.stack});
                }else {
                    res.json({callback: callback});
                }
            })
        }
    });
}