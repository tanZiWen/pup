var fs = require('fs'),
	_ = require('underscore'),
	_s = require('underscore.string'),
	async = require('async'),
	G = require('../lib/global.js'),
	T = require('../dict/types.js'),
	idg = require('../lib/idg.js'),
	IOE = require('../dict/error.js'),
	mu = require('../lib/utils.js'),
	auth = require('../lib/auth.js'),
	hipi = require('../db/hipi.js');

var Helper = exports = module.exports = {};
exports.concern = T.PICTURE.AVATAR;

exports.prepare = function (req, cb) {
	var type = req.body.type;

	if (_s.isBlank(type) || _.isEmpty(req.files.file)) return cb(IOE.BAD_REQUEST);
	var user = req.session.user;

	if (user == null || !user._id)  return cb(IOE.NOT_AUTHORIZED);

	var context = {};
	context.type = type.trim();
	context.objId = user._id;

	context.dir = Helper.getAvatarRelativeDir(user._id);

	cb(null, context);
};

exports.afterConvert = function (err, result) {
	if (err || _.isEmpty(result)) {
		console.log('Bad result from image converting.');
		return;
	} else {
		var avatar = result.fields;
		avatar.cvtd = true;

		hipi.picture.update({'_id': result.pic._id}, {$set: avatar}, function (err) {
			if (err) return console.error(err);

			avatar.avatarId = result.pic._id;
			delete avatar.cvtd;
			console.log('Avatar convert result:: ' + JSON.stringify(avatar));
			hipi.user.update({'_id': result.pic.objId}, {$set: avatar}, function (err) {
				if (err) return console.error(err);

//				_.extend(req.session.user, avatar);
//				req.session.save(next);
			});
		});
	}
};

exports.getAvatarAbsDir = function (userId) {
	return G.UP_DIR.ROOT + G.UP_DIR.USER + userId + '/';
};

exports.getAvatarRelativeDir = function (userId) {
	return G.UP_DIR.USER + userId + '/';
};