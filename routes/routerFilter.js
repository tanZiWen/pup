/**
 * Created by tanyuan on 11/30/15.
 */

var _ = require('underscore');
var dictionary = require('../lib/dictionary');

exports.customerFilter = function(req, res, next) {
    var user = req.session.user;
    var isConsultant = _.contains(user.roleCodes, dictionary.userRoleCode.consultant);
    var isRm = _.contains(user.roleCodes, dictionary.userRoleCode.rm);
    if(!isConsultant && !isRm) {
        if(req.xhr) {
            res.send({err : {code : 'noPermission', msg : '您没有操作该界面权限!'}});
        } else {
            res.redirect('/login');
        }
        return
    }
    next();
};

exports.auditorFilter = function(req, res, next) {
    var user = req.session.user;
    if(!_.contains(user.roleCodes, dictionary.userRoleCode.auditor)) {
        if(req.xhr) {
            res.send({err : {code : 'noPermission', msg : '您没有操作该界面权限!'}});
        } else {
            res.redirect('/login');
        }
        return
    }
    next();
};

exports.dataManageFilter = function(req, res, next) {
    var user = req.session.user;
    if(!_.contains(user.roleCodes, dictionary.userRoleCode.dm)) {
        if(req.xhr) {
            res.send({err : {code : 'noPermission', msg : '您没有操作该界面权限!'}});
        } else {
            res.redirect('/login');
        }
        return
    }
    next();
};

exports.umFilter = function(req, res, next) {
    var user = req.session.user;
    if(!_.contains(user.roleCodes, dictionary.userRoleCode.um)) {
        if(req.xhr) {
            res.send({err : {code : 'noPermission', msg : '您没有操作该界面权限!'}});
        } else {
            res.redirect('/login');
        }
        return
    }
    next();
};

exports.pmFilter = function(req, res, next) {
    var user = req.session.user;
    if(!_.contains(user.roleCodes, dictionary.userRoleCode.pm)) {
        if(req.xhr) {
            res.send({err : {code : 'noPermission', msg : '您没有操作该界面权限!'}});
        } else {
            res.redirect('/login');
        }
        return
    }
    next();
};

exports.wechatFilter = function(req, res, next) {
    var user = req.session.user;
    var isWechatWorker = _.contains(user.roleCodes, dictionary.userRoleCode.wechatWorker);
    var isWechatManager = _.contains(user.roleCodes, dictionary.userRoleCode.wechatManager);
    if(!isWechatManager && !isWechatWorker) {
        if(req.xhr) {
            res.send({err : {code : 'noPermission', msg : '您没有操作该界面权限!'}});
        } else {
            res.redirect('/login');
        }
        return
    }
    next();
};

exports.wechatManageFilter = function(req, res, next) {
    var user = req.session.user;
    if(!_.contains(user.roleCodes, dictionary.userRoleCode.wechatManager)) {
        if(req.xhr) {
            res.send({err : {code : 'noPermission', msg : '您没有操作该界面权限!'}});
        } else {
            res.redirect('/login');
        }
        return
    }
    next();
};

exports.actionPlanFilter = function(req, res, next) {
    var user = req.session.user;
    var isDM =  _.contains(user.roleCodes, dictionary.userRoleCode.dm);
    var isAuditor =  _.contains(user.roleCodes, dictionary.userRoleCode.auditor);
    if(!isDM && ! isAuditor) {
        if(req.xhr) {
            res.send({err : {code : 'noPermission', msg : '您没有操作该界面权限!'}});
        } else {
            res.redirect('/login');
        }
        return
    }
    next();
};