/*
 * GET home page.
 */
var _ = require('underscore');
var appCfg = require('../app.cfg.js');
var logger = require('../lib/logFactory').getModuleLogger(module);

exports.index = function (req, res) {
	if (_.isEmpty(req.session.user)) {
		res.redirect('/login');
	} else {
		res.render('index',
            {
                title: '帆茂统一平台',
                currentApp: {
                    code : 'PUP', indexPage : 'portal.appList', appCfg : appCfg
                },
                user : req.session.user
            });
	}
};