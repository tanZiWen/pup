/**
 * Created by wangnan on 14-4-21.
 */

global.projectRoot = __dirname;
global.lib = {};
global.appCfg = require('./app.cfg');
global.lib.logFactory = require('./lib/logFactory');
global.lib.utils = require('./lib/utils');

/**
 *
 * @param {String} pathOfProject
 * @returns {*} same as nodejs's require() method
 */
//global.requirep = function(pathOfProject) {
//    return require(global.lib.utils.getProjectPath(pathOfProject));
//};