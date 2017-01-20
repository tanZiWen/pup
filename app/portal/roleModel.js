/**
 * Created by tanyuan on 7/29/14.
 */

var roleDao = require('../../db/upm/roleDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore');

init();

var roles = [];

function init() {
    roleDao.findAllRoles(function(err, result) {
        if(err) {
            callback(err, null);
        }else {
            try{
                roles = result;
            }catch(e) {
            }
        }
    })
}

exports.getAllRoles = function() {
    return roles;
}
exports.getRoleByCode = function(roleCodes) {
    var roleMap = [];
    _.each(roles, function(key, value) {
        if(_.contains(roleCodes, key.code)) {
            roleMap.push(key);
        }
    });
    return roleMap;
}