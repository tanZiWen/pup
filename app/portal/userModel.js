/**
 * Deprecated
 * Description: request user info from oauth server.
 * Date: 16-4-26
 */
/**
 * Created by wangnan on 14-5-5.
 */

var _ = require('underscore');
var templateCfg = require('../../template.cfg');
var orgDao = require('../../db/upm/organizationDao');
var appDao = require('../../db/upm/appDao');
var userDao = require('../../db/upm/userDao');
var roleDao = require('../../db/upm/roleDao');
var functionDao = require('../../db/upm/functionDao');
var async = require('async');
var G = require('../../lib/global');
var logger = require('../../lib/logFactory').getModuleLogger(module);

/**
 * 用户认证
 * @param username
 * @param password
 * @param callback
 */
//exports.authentication = authentication;

exports.buildSessionUser = function(user, callback) {
    var steps = [];
    steps.org = function(next) {
        orgDao.findByCode(user.orgCode, function(err, org) {
            if(err) {
                err.usrMsg = '查询数据库机构信息出错';
                logger.error(JSON.stringify(err));
                next(err);
            }
            else {
                next(null, org._doc);
            }
        });
    };
    steps.role = function(next) {
        roleDao.findByUser(user, function(err, roles) {
            if(err) {
                err.usrMsg = '查询数据库角色信息出错';
                logger.error(JSON.stringify(err));
                next(err);
            }
            else {
                var error = null;
                var result = {};
                try {
                    var roleList = _.pluck(roles, '_doc');
                    var roleMap = _.indexBy(roleList, 'code');
                    result.roleList = roleList;
                    result.roleMap = roleMap;
                } catch(err) {
                    error = err;
                    logger.error(JSON.stringify(err));
                    error.usrMsg = '处理角色信息出错';
                } finally {
                    next(error, result);
                }

            }
        });
    };
    steps.func = ['role', function(next, data) {
        functionDao.findByRoles(data.role.roleList, function(err, funcs) {
            if(err) {
                err.usrMsg = '查询数据库功能信息出错';
                logger.error(JSON.stringify(err));
                next(err);
            }
            else {
                var error = null;
                var result = {};
                try {
                    var funcList = _.pluck(funcs, '_doc');
                    var funcMap = _.indexBy(funcList, 'code');
                    result.funcList = funcList;
                    result.funcMap = funcMap;
                } catch(err) {
                    error = err;
                    error.usrMsg = '处理功能信息出错';
                    logger.error(JSON.stringify(err));
                } finally {
                    next(error, result);
                }
            }
        });
    }];
    steps.app = ['role', function(next, data) {
        appDao.findAll(function(err, apps) {
            if(err) {
                err.usrMsg = '查询数据库应用系统信息出错';
                logger.error(JSON.stringify(err));
                next(err);
            }
            else {
                var error = null;
                try {
                    var result = {};
                    var appKeyList = _.uniq(_.pluck(data.role.roleList, 'appCode'), true);
                    var appList = _.filter(apps, function(app) {
                        if(_.contains(appKeyList, app.code)) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                    result.appList = _.pluck(appList, '_doc');
                    result.appMap = _.indexBy(result.appList, 'code');
                } catch(err) {
                    error = err;
                    error.usrMsg = '处理应用系统信息出错';
                    logger.error(JSON.stringify(err));
                } finally {
                    next(error, result);
                }
            }
        });
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            callback(err);
        } else {
            var instance = {};
            var error = null;
            try {
                //set user info
                _.extend(instance, user);
                //apps info
                instance.appMap = result.app.appMap;
                instance.appList = result.app.appList;
                // set roles info
                instance.roleMap = result.role.roleMap;
                instance.roleList = result.role.roleList;
                //set functions info
                instance.functionMap = result.func.funcMap;
                instance.functionList = result.func.funcList;
                //set org info
                instance.org = result.org;
                //set function request urls
                var functionUrls = [];
                _.each(instance.functionMap, function(func) {
                    var action = templateCfg.templates[func.funcAction];
                    if(action) {
                        addValidFunctionUrl(action, functionUrls);
                    } else if(_.isString(func.funcAction) && !_.isEmpty(func.funcAction)) {
                        functionUrls.push(func.funcAction)
                    } else if(_.isObject(func.funcAction)) {
                        addValidFunctionUrl(func.funcAction, functionUrls);
                    }
                });

//                instance.authFunction = function(options) {
//                    var result = false;
//                    if(!options) return result;
//                    if(options.code) {
//                        if(functionMap[options.code]) {
//                            result = true;
//                        }
//                    }
//                    if(options.url && _.contains(functionUrls, options.url)) {
//                        result = true;
//                    }
//                    return result;
//                }
            } catch(err) {
                error = err;
                error.usrMsg = '解析用户相关信息出错';
                logger.error(JSON.stringify(err));
            }
            callback(error, instance);
        }
    });

};

function addValidFunctionUrl(funcAction, functionUrls) {
    if(!_.isEmpty(funcAction.requestUrl)) {
        functionUrls.push(funcAction.requestUrl)
    }
    if(!_.isEmpty(funcAction.templateUrl)) {
        functionUrls.push(funcAction.templateUrl)
    }
    if(funcAction.data && !_.isEmpty(funcAction.dataUrl)) {
        functionUrls.push(funcAction.dataUrl)
    }
}

/*
function authentication(username, password, callback) {

    if(_.isEmpty(username) || _.isEmpty(password)) {
        var error = new Error();
        error.usrCode = 1;
        error.usrMsg = '用户名或密码不能为空';
        callback(error);
    }
    userDao.authUser(username, function(err, user) {
        if(err) {
            err.usrCode = 2;
            err.usrMsg = '查询数据库用户信息异常';
            logger.error(JSON.stringify(err));
            callback(err);
        }
        else {
            var error = null;
            if(_.isEmpty(user) || user.password != password) {
                error = new Error('用户名或密码不正确');
                error.usrCode = 3;
                error.usrMsg = '用户名或密码不正确';
                callback(error);
            } else {
                callback(null, user._doc);
            }
        }
    });


}*/
