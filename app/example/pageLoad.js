/**
 * Created by wangnan on 14-4-23.
 */

var logger = require('../../lib/logFactory').getModuleLogger(module);
var num = 10;

exports.show = function(req, res) {
    res.json({msg : '123'});
}