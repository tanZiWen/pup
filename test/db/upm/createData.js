/**
 * Created by wangnan on 14-4-23.
 */

require('../../../globalExtention');

var async = require('async');
var appDao = require('../../../db/upm/appDao');
var funcDao = require('../../../db/upm/functionDao');

var App = appDao.client;
var Func = funcDao.client;

App.find().remove().exec();
Func.find().remove().exec();

var crmApp = new App({
    code : 'crm',
    name : '客户关系系统',
    desc : '客户关系系统',
    indexPage : '',
    viewOrder : 1,
    cusername : 'admin',
    crealName : 'admin',
    uusername : 'admin',
    urealName : 'admin'
});

var upmApp = new App({
    code : 'upm',
    name : '权限系统',
    desc : '权限系统',
    indexPage : '',
    viewOrder : 2,
    cusername : 'admin',
    crealName : 'admin',
    uusername : 'admin',
    urealName : 'admin'
});

var testApp = new App({
    code : 'test',
    name : '测试系统',
    desc : '测试系统',
    indexPage : '',
    viewOrder : 3,
    cusername : 'admin',
    crealName : 'admin',
    uusername : 'admin',
    urealName : 'admin'
});

var pageLoadMenu = new Func({
    code : 'pageLoadMenu',
    name : '页面加载',
    treeLevel : 1,
    type : 'menu',
    appCode : 'test',
    cusername : 'admin',
    crealName : 'admin',
    uusername : 'admin',
    urealName : 'admin'
});

var pageLoadFunc = new Func({
    code : 'pageLoadFunc',
    name : '加载测试功能',
    funcAction : "example.pageLoad.show",
    parentCode : 'pageLoadMenu',
    treeLevel : 2,
    type : 'menu',
    appCode : 'test',
    cusername : 'admin',
    crealName : 'admin',
    uusername : 'admin',
    urealName : 'admin'
});

var pageLoadFunc2 = new Func({
    code : 'pageLoadFunc2',
    name : '加载测试功能2',
    funcAction : "example.pageLoad.show",
    parentCode : 'pageLoadMenu',
    treeLevel : 2,
    type : 'menu',
    appCode : 'test',
    cusername : 'admin',
    crealName : 'admin',
    uusername : 'admin',
    urealName : 'admin'
});

var testMenu = new Func({
    code : 'testMenu',
    name : '测试菜单',
    treeLevel : 1,
    type : 'menu',
    appCode : 'test',
    cusername : 'admin',
    crealName : 'admin',
    uusername : 'admin',
    urealName : 'admin'
});

var testFunc = new Func({
    code : 'testFunc',
    name : '测试功能',
    funcAction : "example.pageLoad.show",
    parentCode : 'testMenu',
    treeLevel : 2,
    type : 'menu',
    appCode : 'test',
    cusername : 'admin',
    crealName : 'admin',
    uusername : 'admin',
    urealName : 'admin'
});

var testFunc2 = new Func({
    code : 'testFunc2',
    name : '测试功能2',
    funcAction : "example.pageLoad.show",
    parentCode : 'testMenu',
    treeLevel : 2,
    type : 'menu',
    appCode : 'test',
    cusername : 'admin',
    crealName : 'admin',
    uusername : 'admin',
    urealName : 'admin'
});

var step = [];
step.push(function(callback) {
    crmApp.save(function(err) {
        if(err) console.error('crmApp : ' + err);
        callback(null, 'crm');
    });
});
step.push(function(callback) {
    upmApp.save(function(err) {
        if(err) console.error('upmApp : ' + err);
        callback(null, 'upm');
    });
});
step.push(function(callback) {
    testApp.save(function(err) {
        if(err) console.error('testApp : ' + err);
        callback(null, 'test');
    });
});
step.push(function(callback) {
    pageLoadMenu.save(function(err) {
        if(err) console.error('pageLoadMenu : ' + err);
        callback(null, 'pageLoadMenu');
    });
});
step.push(function(callback) {
    pageLoadFunc.save(function(err) {
        if(err) console.error('pageLoadFunc : ' + err);
        callback(null, 'pageLoadFunc');
    });
});
step.push(function(callback) {
    pageLoadFunc2.save(function(err) {
        if(err) console.error(err);
        callback(null, 'ok');
    });
});
step.push(function(callback) {
    testMenu.save(function(err) {
        if(err) console.error(err);
        callback(null, 'ok');
    });
});
step.push(function(callback) {
    testFunc.save(function(err) {
        if(err) console.error(err);
        callback(null, 'ok');
    });
});
step.push(function(callback) {
    testFunc2.save(function(err) {
        if(err) console.error(err);
        callback(null, 'ok');
    });
});

async.parallel(step, function(err, result) {
    appDao.db.close();
    console.log('createData end.')
})

