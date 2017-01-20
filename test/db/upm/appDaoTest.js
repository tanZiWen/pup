/**
 * Created by wangnan on 14-4-25.
 */

require('../../../globalExtention');
var async = require('async');
var appDao = require('../../../db/upm/appDao');

function testFindAll(callback) {
    appDao.findAll(function(err, docs) {
        if(err) console.log('[testFindAll] err : ' + err);
        else console.log('[testFindAll] result : ' + docs);
        callback(null, 'testFindAll.')
    });
}

var steps = [];
steps.push(testFindAll);


async.parallel(steps, function(err, result) {
    if(err) console.log('lerr : ' + err); console.log('result : ' + result);
    appDao.db.close();
    console.log('appDaoTest end.')
});