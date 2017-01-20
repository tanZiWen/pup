/**
 * Created by wangnan on 14-4-21.
 */

require('../../globalExtention');

var dictionary = require('../../lib/dictionary');

console.log('branch : ' + dictionary.orgType.branch);
console.log('orgType list : ' + dictionary.orgType.list());

console.log('orgType list : ' + dictionary.userStatus.list());
console.log('orgType list : ' + dictionary.userPosition.list());