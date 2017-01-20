/**
 * Created by tanyuan on 9/16/14.
 */

var userDao = require('../../db/upm/userDao');
var dictionary = require('../../lib/dictionary');
var async = require('async');
var cryptoHelper = require('../../lib/cryptoHelper');


exports.changePwd = function(req, res) {
    var params = req.body;
    var user = req.session.user;

    var steps = {};

    steps.user = function(next) {
        userDao.client.findById(user._id, next)
    };

    steps.changePwd = ['user', function(next, data) {
        var user = data.user;
        if(user) {
            var paces = {};
            paces.encryptNew = function(next) {
                cryptoHelper.encrypt(params.newPwd, next)
            };
            paces.encryptOld = function(next) {
                cryptoHelper.encrypt(params.oldPwd, next)
            };
            paces.modifyPwd = ['encryptNew', 'encryptOld', function(next, data) {
                if(!data.encryptNew) {
                    next(null, false);
                }
                if(!data.encryptOld) {
                    next(null, false);
                }
                if(user.password == data.encryptOld) {
                    userDao.updateById(user._id, {password: data.encryptNew}, next);
                }else {
                    next(null, false);
                }
            }];
            async.auto(paces, next);
        }else {
            next(null, false);
        }
    }];
    async.auto(steps, function(err, result) {
        if(err) {
            res.json(err, {err: err.stack});
        }else {
            if(result.changePwd && result.changePwd.modifyPwd) {
                if(result.changePwd == 'error') {
                    res.redirect('/login');
                }else {
                    res.json({type: dictionary.resMsgType.succ, body: '密码修改成功'})
                }
            }else {
                res.json({type: dictionary.resMsgType.error, body: '原密码不匹配,请重新输入.'})
            }
        }
    });
};

exports.changePwds = function(req, res) {
    var steps = {};

    steps.user = function(next) {
        userDao.client.find({}, next)
    };

    steps.changePwd = ['user', function(next, data) {
        var user = data.user;
        console.log('user:', user);
        if(!_.isEmpty(user)) {
            var paces = {};
            _.each(user, function(value, key) {
                paces['update_'+key] = function(next) {
                    var walks = [];
                    walks[0] = function(next) {
                        cryptoHelper.encrypt(value.password, next)
                    };
                    walks[1] = function(data, next) {
                        userDao.updateById(value._id, {password: data}, next);
                    };
                    async.waterfall(walks, next);
                }
            });
            async.parallel(paces, next);
        }else {
            next(null, false);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(err, {err: err.stack});
        }else {
            if(result.changePwd) {
                res.json({type: dictionary.resMsgType.succ, body: '密码修改成功'})
            }else {
                res.json({type: dictionary.resMsgType.error, body: '原密码不匹配,请重新输入.'})
            }
        }
    });
};