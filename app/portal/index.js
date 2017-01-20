/*
 *
 */

var appDao = require('../../db/upm/appDao');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var _ = require('underscore');
var fnModel = require('./fnModel');
var utils = require('../../lib/utils');
var appCfg = require('../../app.cfg.js');
var userOperateLogDao = require('../../db/upm/userOperateLogDao');


exports.listApp = function(req, res) {
    appDao.findAll(function(err, apps) {
        if(err) {
            logger.error(err);
            res.send({apps : {}});
        } else {
            res.send({apps : apps, phoneNo : utils.phoneNoEncrypt('1234567890'), token : req.session.id});
        }
    });
};

exports.showApp = function(req, res) {
    var appCode = req.param('appCode');

    var steps = {};

    steps.app = function(next) {
        appDao.findByCode(appCode, next);
    };

    steps.menuTree = ['app', function(next, data) {
        fnModel.buildMenuTree(
            appCode,
            null,
            req.session.user,
            next);
    }];

    async.auto(steps, function(err, doc) {
        var result = {
            title: '',
            currentApp: {code : '', indexPage : ''},
            menus: []
        };
        if(err) {
            logger.error(err);
            res.render('index', result);
        }else {
            var app = doc.app;
            var menuTree = doc.menuTree;
            res.render('index',
                {
                    title: app.name,
                    currentApp: {
                        code: appCode, indexPage: app.indexPage
                    },
                    menus: menuTree,
                    webSocketAddress: appCfg.server.ip + ':' + appCfg.server.port,
                    appCfg: appCfg,
                    user: req.session.user
                }
            );
        }
    });

};