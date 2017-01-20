/**
 * Created by wangnan on 14-4-18.
 */

require('../../../globalExtention');

var model = require('../../../db/upm/model');
var db = model.db;
var Role = model.upm_role;

var r1 = new Role({
    roleCode : 'role2',
    roleName : '角色3',
    appCode : 'crm',
    fnCodes : ['fn1', 'fn2']
});

db.close();
console.log('modelTest end.')

