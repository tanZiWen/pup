/**
 * Created by wangnan on 14-6-3.
 */

var tagDao = require('../../../db/crm/tagDao');
var async = require('async');
var idg = require('../../../db/idg');

var steps = [];

function pushTo(obj) {
    steps.push(function(next) {
        tagDao.client.add(obj, idg, function(err, obj) {
            if(err)
                next(err);
            else
                next(null, obj);
        });
    });
}

pushTo({
    type : 'customer',
    name : '富二代'
});
pushTo({
    type : 'customer',
    name : '官二代'
});
pushTo({
    type : 'customer',
    name : '土豪'
});


async.series(steps, function(err, result) {
    if(err)
        console.error(err.stack);
    else
        console.dir(result);
});