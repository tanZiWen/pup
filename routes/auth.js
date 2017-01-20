//var hipilife = require('../db/hipilife.js'),
//	dbcom = require('../db/common.js');
var pup = require('../db/pup.js'),
    idg = require('../db/idg.js'),
    async = require('async');

var _ = require('underscore'),
	_s = require('underscore.string');
var userDao = require('../db/upm/userDao');

var userModel = require('../app/portal/userModel');
var appModel = require('../app/portal/appModel');
var logger = require('../lib/logFactory').getModuleLogger(module);
var redis = require('redis');
var redisClient = redis.createClient(global.appCfg.redis.port, global.appCfg.redis.host, {});
var appCfg = require('../app.cfg.js');
var fnModel = require('../app/portal/fnModel');
var userOperateLogDao = require('../db/upm/userOperateLogDao');
var dictionary = require('../lib/dictionary');
var cryptoHelper = require('../lib/cryptoHelper');
var mailHelper = require('../lib/mailHelper');
var G = require('../lib/global');
var jwt = require('jsonwebtoken');
var extend = require('util')._extend;


/*exports.checkAuth = function (req, res, next) {
    if(!req.session || !req.session.user) {
        if(req.xhr) {
            res.send({err : {code : 'unlogin', msg : '您当前未登录'}});
        } else {
            res.redirect('/login');
        }
    } else {
        userOperateLogDao.add(req, next);
    }
};*/

exports.checkAuth = jwtAuthCheck;

function jwtAuthCheck(req, res, next) {
    if(!req.jwt) {
        if(req.xhr) {
            res.send({err : {code : 'unlogin', msg : '您当前未登录'}});
        } else {
            if (req.originalUrl == '/') {
                res.redirect('/login')
            } else {
                res.redirect('/login?target=' + encodeURIComponent(req.originalUrl));
            }
        }
    }else {
        var userKey = G.USER_KEY + req.jwt.aud;
        redisClient.get(userKey, function(err, reply) {
            if (err) {
                next(err);
                return;
            }
            user = JSON.parse(reply);
            req.session.user = user;
            res.locals.session = req.session;
            userOperateLogDao.add(req, next);
        });
    }
}

exports.loginForm = function (req, res) {
	if(req.session) {
		delete req.session.user;
	}

	res.render('auth/user/login', { layout: false});
};

exports.registerForm = function (req, res) {
	res.render('auth/user/register', { layout: false});
};

exports.logout = function (req, res) {
//	req.session = null;
//	res.redirect('/login');
    var logoutURLs = appModel.findAllLogoutUrls();
    res.render('auth/user/logout', {logoutURLs:logoutURLs})
};

exports.login = function (req, res) {
	var username = req.body.username,
		password = req.body.password,
        target   = req.query.target? req.query.target : (req.body.target ? req.body.target: null);

    if(_.isEmpty(username) || _.isEmpty(password)) {
        var error = new Error();
        error.usrCode = 1;
        error.usrMsg = '用户名或密码不能为空';
        res.redirect('/login');
    }
    var steps = [];

    steps[0] = function(next) {
            var queryString = "?grant_type=password&username=" + username + "&password=" + password;
            var options = extend({}, G.OAUTH_LOGIN);
            options.path = options.path + queryString;
            http.get(options, function(res) {
                res.on('data', function(data) {
                    authData = JSON.parse(data);
                    req.token = authData;
                    req.session = {id: authData.access_token};
                    next(null, authData);
                });
            }).on('error', function(e){
                next(e);
            });
        };
    steps[1] = function(token, next) {
            var data = "?code=" + token.access_token;
            var options = extend({}, G.OAUTH_USER);
            options.path = options.path + data;
            http.get(options, function(res) {
                var userStr = '';
                res.on('data', function (chunk){
                    userStr += chunk;
                });
                res.on('end',function(){
                    console.log(userStr);
                    user = JSON.parse(userStr);
                    user.password = 0;
                    req.session.user = user;
                    var userKey = G.USER_KEY + user.username;
                    redisClient.set(userKey, userStr);
                    console.log("load userinfo end");
                    next(null, true)
                });
            }).on('error', function(e){
                next(e);
            });
        };

    steps[2] = function(data, next) {
        req.priority = dictionary.userOperatePriority.level1;
        userOperateLogDao.add(req, function(err, result) {
            if(err) {
                next(err);
            }else {
                next(null, true);
            }
        });
    };

    async.waterfall(steps, function(err, data) {
        console.log("redirect start");
        if(err) {
            res.redirect('/login');
        }else {
            res.cookie("authorize_token", req.token.access_token, {httpOnly: false, path: '/'});
            if (target) {
                target = decodeURIComponent(target);
                if(target.indexOf('?') == -1) {
                    target += '?token=' + req.token.access_token;
                    console.log("redirect url:", target);
                } else {
                    target += '&token=' + req.token.access_token;
                }
                res.redirect(target);
            }
            res.redirect('/');
        }
    });
};

exports.register = function (req, res) {
	var email = req.body.email,
		password = req.body.password,
		nickname = req.body.nickname;

	var user = {'email': email, 'pwd': password, 'nm': nickname};
	console.log('Register: ' + JSON.stringify(req.body));

	if (_s.isBlank(email)) {
		return res.render('auth/user/register', { layout: false, user: user, msg: 'email is required'});
	}

	if (_s.isBlank(password)) {
		return res.render('auth/user/register', { layout: false, user: user, msg: 'password is required'});
	}

	if (_s.isBlank(nickname)) {
		return res.render('auth/user/register', { layout: false, user: user, msg: 'nickname is required'});
	}
};

/**
 * 外部系统用户认证
 * @param req
 * @param res
 */
exports.externalAuth = function(req, res) {
    var username = req.param('username');
    var password = req.param('password');
    userModel.authentication(username, password, function(err, user) {
        if(err) {
            res.json({code : err.usrCode, msg : err.usrMsg});
        } else {
            res.json({code : 0, msg : '认证成功'});
        }
    });
};

exports.forgetPwd = function(req, res) {
    res.render('auth/user/forgetPwd', { layout: false});
};

exports.validateUsername = function(req, res) {
    var params = req.query;
    userDao.findOne(params, function(err, result) {
        if(err) {
            logger.error('router.auth.validateUsername error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(_.isEmpty(result)) {
                res.json({msg: {type: dictionary.resMsgType.error, body: '账号不存在!'}});
            }else {
                if(!result.email || result.email == '') {
                    res.json({msg: {type: dictionary.resMsgType.info, body: '邮箱还未设置,请联系管理员设置邮箱后才能找回密码!'}})
                }else {
                    res.json({user: result});
                }
            }
        }
    })
};

exports.sendVerifyCode = function(req, res) {
    var params = req.query;

    var verifyCode = generateCode();
    var cacheVerifyCodeKey = 'ps:verifycode:' + req.session.id;
    redisClient.set(cacheVerifyCodeKey, verifyCode, function() {
        redisClient.expire(cacheVerifyCodeKey, appCfg.sessionTimeout.changePwd);
    });
    var con = {};
    con.verifyCode = verifyCode;
    con.email = params.email;
    con.realName = params.realName;
    con.type = 'reset';
    mailHelper.sendMail(con, function(err, result) {
        if(err) {
            logger.error('router.auth.sendVerifyCode error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '验证码已发送到你的邮箱!'}});
        }
    });

};

exports.verifyCode = function(req, res) {
    var params = req.query;

   var cacheVerifyCodeKey = 'ps:verifycode:' + req.session.id;

    redisClient.get(cacheVerifyCodeKey, function(err, result) {
        if(err) {
            logger.error('router.auth.verifyCode error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(!result) {
                res.json({msg: {type: dictionary.resMsgType.error, body: '验证码已失效!'}});
            }else {
                if(params.verifyCode.trim() == result.trim()) {
                    redisClient.del(cacheVerifyCodeKey);
                    var cacheChangePwdKey = 'ps:changePwd:' + req.session.id;
                    redisClient.set(cacheChangePwdKey, params._id, function(err) {
                        redisClient.expire(cacheChangePwdKey, appCfg.sessionTimeout.changePwd);
                    });
                    res.json({msg: {type: dictionary.resMsgType.succ, body: '验证成功!'}});
                }else {
                    res.json({msg: {type: dictionary.resMsgType.error, body: '验证码错误!'}});
                }
            }
        }
    })
};

exports.changePwd= function(req, res){
    var params = req.body;

    var cacheChangePwdKey = 'ps:changePwd:' + req.session.id;

    var steps = {};

    steps.userid = function(next) {
        redisClient.get(cacheChangePwdKey, next);
    };

    steps.delKey = ['userid', function(next, data) {
        if(data.userid) {
            redisClient.del(cacheChangePwdKey, next);
        }else {
            next(null, false);
        }
    }];

    steps.encrypt = ['delKey', function(next, data) {
        if(data.userid) {
            cryptoHelper.encrypt(params.pwd, next);
        }else {
            next(null, false);
        }
    }];

    steps.updapt = ['encrypt', function(next, data) {
        if(data.encrypt) {
            userDao.updateById(data.userid, {$set: {password: data.encrypt}}, next);
        }else {
            next(null ,false);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('router.auth.changePwd error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(!result) {
                res.json({msg: {type: dictionary.resMsgType.error, body: '操作超时，请刷新界面后重试!'}});
            }else {
                res.json({msg: {type: dictionary.resMsgType.succ, body: '验证成功!'}});
            }
        }
    });
};

exports.setPwd = function(req, res) {
    var params = req.query;
    var cacheChangePwdKey = 'ps:changePwd:' + params.est;

    redisClient.get(cacheChangePwdKey, function(err, result) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            if(result) {
                redisClient.del(cacheChangePwdKey);
                cacheChangePwdKey = 'ps:changePwd:' + req.session.id;
                redisClient.set(cacheChangePwdKey, result, function(err) {
                    redisClient.expire(cacheChangePwdKey, appCfg.sessionTimeout.setPwd);
                });
                res.render('pwd/setPwd', { layout: false});
            }else {
                res.render('pwd/error', { layout: false, msg: '该链接已失效!'});
            }
        }
    });
};

function generateCode() {
    var code = "";
    var codeLength = 5;
    var selectChar = new Array(0,1,2,3,4,5,6,7,8,9);
    for(var i=0; i<codeLength; i++) {
        var charIndex = Math.floor(Math.random()*10);
        code += selectChar[charIndex];
    }
    return code
}