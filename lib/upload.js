
/*
 * Upload files, restaurant image, dish image, and avatar.
 */
var fs = require('fs'),
	pathModule = require('path'),
	nfs = require('node-fs'),
	_ = require('underscore'),
	_s = require('underscore.string'),
	async = require('async'),
	G = require('../lib/global.js'),
	T = require('../dict/types.js'),
	idg = require('../lib/idg.js'),
	IOE = require('../dict/error.js'),
	mu = require('../lib/utils.js'),
	auth = require('../lib/auth.js'),
	imgConverter = require('../image/converter.js'),
	eventLogger = require('../task/eventLogger.js'),
	hipi = require('../db/hipi.js');

exports.index = function (req, res) {
	res.writeHead(200, {'content-type':'text/html'});
	res.end(
		'<form action="/upload" enctype="multipart/form-data" method="post">' +
			'<input type="text" name="title"><br>' +
			'<input type="file" name="upf" multiple="multiple"><br>' +
			'<input type="submit" value="Upload">' +
			'</form>'
	);
};

var listeners = {};
	registerListener(require('../image/avatarHelper.js'));
	registerListener(require('../image/dishImageHelper.js'));
	registerListener(require('../image/billImageHelper.js'));
	registerListener(require('../image/restaurantImageHelper.js'));

function registerListener(listener) {
	if(_.isEmpty(listener)) return;

	if(_.isArray(listener.concern)) {
		for(var i=0;i<listener.concern.length;i++) {
			listeners['' + listener.concern[i]] = listener;
		}
	} else {
		listeners['' + listener.concern] = listener;
	}
};

exports.post = function (req, res) {
	console.log('upload image:: ' + req.body);
//    console.log(req.files);
//	console.log(req.session.user);

	if(_s.isBlank(req.body.type) || _.isEmpty(req.files.file)) return res.status(IOE.BAD_REQUEST.code).send("");

	var type = parseInt(req.body.type);
	var listener = listeners[req.body.type];

	if(listener == null) return res.status(IOE.BAD_REQUEST.code).send("Unsupport type.");

	var user = req.session.user,
		tmpPath = req.files.file.path;

	var tasks = {
		'context': function(next) {
			listener.prepare(req, next);
		}
	};

	tasks.mkdir = ['context', function(next, data) {
		var absoluteDir = G.UP_DIR.ROOT + data.context.dir;

		nfs.mkdir(absoluteDir, 511, true, next);
	}];

	tasks.id = ['context', function(next, data) {
		idg.next(hipi.collections.picture, next);
	}];

	tasks.rename = ['id', 'mkdir', function(next, data) {
		var _id = parseInt(data.id.toString()),
			absoluteDir = G.UP_DIR.ROOT + data.context.dir,
			objId = data.context.objId,
			cm = data.context.cm;

		var destPath = absoluteDir + _id + ".jpg";

		fs.rename(tmpPath, destPath, function(err) {
	        if (err) {
		        console.error("Failed to rename uploaded file: " + tmpPath + ' > ' + destPath + JSON.stringify(err));
		        next(err);
	        } else {
		        var originPath = data.context.dir + _id + '.jpg';
		        var pic = {'_id': _id, 'type': type, 'objId': objId};

		        if(auth.authorized(user)) {
			        pic.userId = user._id;
		        }
		        pic.origin = originPath;

		        if(cm != null) {
			        pic.cm = cm;
		        }

		        mu.fillCreateAndUpdateTime(pic);

//		        if(result.rid != null) {
//			        pic.rid = result.rid;
//		        }

		        next(null, pic);
	        }
	    });
	}];

	tasks.save = ['rename', function(next, data) {
		var pic = data.rename,
			callback = data.context.callback;
		hipi.picture.insert(pic, function(err, result) {
			if(err) return next(err);

			if(type == T.PICTURE.AVATAR) {
				imgConverter.convertImg(pic, function(err, result) {
					if(err) {
						next(err);
					} else if(_.isEmpty(result)) {
						next('Empty result after image converting.');
					} else {
						var avatar = result.fields;
						avatar.cvtd = true;

						hipi.picture.update({'_id': pic._id}, {$set: avatar}, function(err, result) {
							if(err) return next(err);

							avatar.avatarId = pic._id;
							delete avatar.cvtd;
							console.log('Avatar convert result:: ' + JSON.stringify(avatar));
							hipi.user.update({'_id': pic.objId}, {$set: avatar}, function(err, result) {
								if(err) return next(err);

								_.extend(req.session.user, avatar);
							    req.session.save(next);
							});
						});
					}
				});
			} else {
				next(null, pic);
				imgConverter.startConvertTask(pic, callback);
			}
		});
	}];

	async.auto(tasks, function(err, data) {
		if(err) res.status(500).send("");

		if(type == T.PICTURE.AVATAR) {
			return res.send(JSON.stringify(req.session.user));
		} else {
			var image = data.save;
			eventLogger.uploadImage(image);
			return res.send(JSON.stringify(image));
		}
	});

};

exports.reconvert = function (req, res) {
	var id = parseInt(req.query.id) || 0,
		type = parseInt(req.query.type) || 0;

	var criteria = {};
	if(id > 0) {
		criteria._id = id;
	}

	if(type > 0) {
		criteria.type = type;
	}

	hipi.picture.findItems(criteria, {}, {limit: 100000}, function(err, imgs) {
		if(err) return res.status(500).send('Failed to query image.');

		if(!_.isEmpty(imgs)) {
			for(var i=0;i<imgs.length;i++) {
				var listener = listeners['' + imgs[i].type];
				if(listener == null) {
					console.warn('No listener for type: ' + imgs[i].type);
				} else {
					imgConverter.startConvertTask(imgs[i], listener.afterConvert);
				}
			}
		}

		res.send('Task started: ' + imgs.length);
	});
};