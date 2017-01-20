/**
 * Created by wangnan on 14-5-30.
 */

var customerDao = require('../../../db/crm/customerDao');
var async = require('async');
var utils = require('../../../lib/utils');

var steps = [];

function pushTo(obj) {
    steps.push(function(next) {
        customerDao.add(obj, function(err, obj) {
            if(err)
                next(err);
            else
                next(null, obj);
        })
    })
}

for(var i = 0; i < 25; i++) {
    pushTo({
        _id : i+1,
        telNo : utils.strFill('1360000' + i, '0', 'right', 11),
        name : 'cusName' + i,
        level : 'normal',
        status : 'noCall',
        sex : 'male',
        callTimes : 0,
        addType : 'add',
        free : true,
        belongUser : 8,
        assignUser : 3,
        assignTime : new Date(),
        cuserid : 1,
        cusername : '1',
        crealName : 'admin',
        ctime : new Date(),
        uuserid : 1,
        uusername : '1',
        urealName : 'admin',
        utime : new Date()
    });
}


async.series(steps, function(err, result) {
    if(err)
        console.error(err.stack);
    else
        console.dir(result);
});