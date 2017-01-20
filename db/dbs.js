/**
 * Created by wangnan on 14-4-21.
 */

var _ = require('underscore');
var upm = require('./upm/model');
var crm = require('./crm/model');

var dbs = exports.dbs = {
    upm : upm.db,
    crm : crm.db
};

exports.close = function() {
    for(var name in dbs) {
        if(dbs[name]) {
            dbs[name].close();
        }
    }
};