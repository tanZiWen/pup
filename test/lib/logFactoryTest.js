/**
 * Created by wangnan on 14-4-15.
 */

require('../../globalExtention');

var logFactory = require('../../lib/logFactory.js');
var appLogger = logFactory.getAppLogger();
var moduleLogger = logFactory.getModuleLogger(module);
var sysLogger = logFactory.getSystemLogger('access_log');

//var logFactory2 = require('../../lib/logFactory.js');
//var appLogger2 = logFactory2.getAppLogger();
//var moduleLogger2 = logFactory2.getModuleLogger(module);
//var sysLogger2 = logFactory.getSystemLogger('access_log');

appLogger.silly('appLogger silly');
appLogger.debug('debug');
appLogger.verbose('verbose');
appLogger.info('info');
appLogger.warn('warn');
appLogger.error('error');

moduleLogger.silly('moduleLogger silly');
moduleLogger.debug('debug');
moduleLogger.verbose('verbose');
moduleLogger.info('info');
moduleLogger.warn('warn');
moduleLogger.error('error');

sysLogger.silly('sysLogger silly');
sysLogger.debug('debug');
sysLogger.verbose('verbose');
sysLogger.info('info');
sysLogger.warn('warn');
sysLogger.error('error');

//appLogger2.silly('appLogger silly');
//appLogger2.debug('debug');
//appLogger2.verbose('verbose');
//appLogger2.info('info');
//appLogger2.warn('warn');
//appLogger2.error('error');
//
//moduleLogger2.silly('moduleLogger silly');
//moduleLogger2.debug('debug');
//moduleLogger2.verbose('verbose');
//moduleLogger2.info('info');
//moduleLogger2.warn('warn');
//moduleLogger2.error('error');
//
//sysLogger2.silly('sysLogger silly');
//sysLogger2.debug('debug');
//sysLogger2.verbose('verbose');
//sysLogger2.info('info');
//sysLogger2.warn('warn');
//sysLogger2.error('error');
