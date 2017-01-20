/**
 * Created by wangnan on 14-4-23.
 */

var logger = require('../lib/logFactory').getModuleLogger(module);
var config = require('../template.cfg')

exports.get = function(req, res) {
    var template = 'views' + req.param('template') + '.js';
    logger.debug('try to load template : ' + template);
    res.sendfile(template);
};

exports.getConfig = function(req, res) {
    res.send(config.templates);
};