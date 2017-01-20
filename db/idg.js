/**
 *
 * User: wuzixiu
 * Date: 1/6/13
 * Time: 12:49 PM
 */

var async = require('async'),
    appCfg = require('../app.cfg.js');
    redis = require('redis'),
    pup = require('./pup.js'),
    _ = require('underscore'),
    crmModel = require('../db/crm/model.js'),
    upmModel = require('../db/upm/model.js'),
    idc = redis.createClient(appCfg.redis.port, appCfg.redis.host, {"return_buffers": true}),
    mu = require('../lib/utils.js');

//TODO: add validation here, to avoid get the wrong current max id and overwrite current record by mistake as a result.
var init = function (tbs, opts, callback) {
    if (!tbs) return callback('No table provided.');

    var minId = 10000;
    if (opts.start) {
        minId = opts.start;
    }

    var setCurrentMaxId = function (table, cb) {
        //var db = table.db || db;
        var steps = [];
        steps.push(function (next) {
            table.findOne({}).sort({_id: -1}).exec(next);
        });

        steps.push(function (doc, next) {
            var id = minId;
            if (doc != null && doc._doc._id != null) {
                if (doc._doc._id > minId) {
                    id = doc._id;
                }

                if (!mu.isDigit(id)) return next('Id is not digit format.');
                idc.get('idg.' + table.collection.name, function (err, curid) {
                    if (err) {
                        next('Failed to get value from redis.');
                    } else {
                        if (curid == null) {
                            next(null, {'set': true, 'id': id});
                        } else {
                            curid = parseInt(curid.toString());

                            if (id <= curid) {
                                next(null, {'set': false, 'id': curid});
                            } else {
                                next(null, {'set': true, 'id': id});
                            }
                        }
                    }
                });
            } else {
                next(null, {'set': true, 'id': minId});
            }
        });
        steps.push(function (context, next) {
            if (context.set) {
                console.log('Set ' + table.collection.name + ' ' + context.id);
                idc.set('idg.' + table.collection.name, context.id, next);
            } else {
                console.log('Id exists: ' + table.collection.name + ' ' + context.id);
                next();
            }
        });
        async.waterfall(steps, function (err) {
            if (err) {
                console.log('init idg error', err);
            }
            cb(err);
        });
    };
    async.forEachSeries(tbs, setCurrentMaxId, callback);
};

var tables = [];
//_.each(pup, function(value, key) {
//    if(typeof value === 'function' && value.name == 'model') {
//        tables.push(value);
//    }
//});
_.each(crmModel, function(value, key) {
    if(typeof value === 'function' && value.name == 'model') {
        tables.push(value);
    }
});
_.each(upmModel, function(value, key) {
    if(typeof value === 'function' && value.name == 'model') {
        tables.push(value);
    }
});

init(tables, {}, function (err, result) {
    if (err) return console.error('Failed to init id generator: ' + err);
});

exports.next = function (tableName, cb) {
    idc.incr('idg.' + tableName, cb);
};