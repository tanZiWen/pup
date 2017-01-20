/**
 *
 * User: wuzixiu
 * Date: 4/1/13
 * Time: 3:02 PM
 */
var _ = require('underscore'),
	_s = require('underscore.string'),
	async = require('async'),
	G = require('../lib/global.js'),
	T = require('../dict/types.js'),
	gm = require('gm');

var converter = exports = module.exports = {};

var convertMetas = {
	'LIST_SMALL': {'width': 140, 'height': 104, 'quality': 89, 'fn': scaleAndCorpBigger, 'suffix': 's.jpg'},
	'LIST_MIDDLE': {'width': 240, 'height': 180, 'quality': 89, 'fn': scaleAndCorpBigger, 'suffix': 'm.jpg'},
	'LARGE_CORP': {'width': 640, 'height': 640, 'quality': 89, 'fn': scaleAndCorpBigger, 'suffix': 'l.jpg'},
	'LARGE_LIMIT_WIDTH': {'width': 640, 'height': null, 'quality': 89, 'fn': scaleAndLimitWidth, 'suffix': 'l.jpg'},
	'AVATAR_LARGE': {'width': 180, 'height': 180, 'quality': 89, 'fn': scaleAndCorpBigger, 'suffix': 'l.jpg'},
	'AVATAR_SMALL': {'width': 50, 'height': 50, 'quality': 89, 'fn': scaleAndCorpBigger, 'suffix': 's.jpg'}
};

exports.convertImg = function (image, cb) {
	console.log('Task: ' + JSON.stringify(image));

	var originRelativePath = image.origin;

	if (_s.isBlank(originRelativePath)) return cb('Path is empty.');

	var tasks = [];

	if (image.type == T.PICTURE.DISH || image.type == T.PICTURE.RESTAURANT) {
		tasks.push({'field': 'limg', 'pic': image, 'meta': 'LARGE_CORP', 'options': image.options});
		tasks.push({'field': 'mimg', 'pic': image, 'meta': 'LIST_MIDDLE', 'options': image.options});
		tasks.push({'field': 'simg', 'pic': image, 'meta': 'LIST_SMALL', 'options': image.options});
	} else if (image.type == T.PICTURE.AVATAR) {
		tasks.push({'field': 'limg', 'pic': image, 'meta': 'AVATAR_LARGE', 'options': image.options});
		tasks.push({'field': 'simg', 'pic': image, 'meta': 'AVATAR_SMALL', 'options': image.options});
	} else if (image.type == T.PICTURE.BILL) {
		tasks.push({'field': 'limg', 'pic': image, 'meta': 'LARGE_LIMIT_WIDTH', 'options': image.options});
		tasks.push({'field': 'mimg', 'pic': image, 'meta': 'LIST_MIDDLE', 'options': image.options});
	} else {
		//			console.warn('Unknown picture type: ' + picture.type);
	}

	async.mapSeries(tasks, convert, function (err, results) {

		if (err) return cb(err);

		var mergedResult = {'pic': image};
		var fields = {};
		if (!_.isEmpty(results)) {
			for (var i = 0; i < results.length; i++) {
				_.extend(fields, results[i]);
				console.log('Thumbnail: ' + JSON.stringify(results[i]));
			}
		}

		mergedResult.fields = fields;

		return cb(null, mergedResult);
	});
};

function convert(task, cb) {
	if (_.isEmpty(task) || _s.isBlank(task.meta)) {
		return cb('Bad convert task.');
	}

	var srcPath = G.UP_DIR.ROOT + task.pic.origin;
	gm(srcPath).size(function (err, size) {
		if (err) {
			return cb('Failed to get size');
		}

		if (_.isEmpty(size)) {
			return cb('Failed to get size, null');
		}

		var meta = convertMetas[task.meta];

		if (_.isEmpty(meta)) {
			return cb('Bad task meta, not supported: ' + task.meta);
		}

		meta.fn(task, size, meta, cb);
	});
};

function scaleAndCorpBigger(task, size, meta, cb) {
	var w = size.width,
		h = size.height,
		dw = meta.width,
		dh = meta.height,
		quality = meta.quality,
		srcPath = G.UP_DIR.ROOT + task.pic.origin,
		options = task.options;

	var destRelativePath = genDestPath(task.pic.origin, meta.suffix);

	if (destRelativePath == null) return cb('Origin file path format is bad.');

	var imgGm = gm(srcPath);

	if(options != null && options.quality != null) {
		quality = options.quality;
	}

	if(quality == 100 && w == dw && h == dh) {
		console.info('Match quality and size, no converting needed.');
		return convertCallback(task.field, task.pic.origin, cb);
	}

	imgGm.quality(quality);

	if (w < dw) {
		if (h < dh) {
			var result = {};
			result[task.field] = task.pic.origin;
			return cb(null, result);
		} else {
			var yo = (dh - h) / 2;
			imgGm.crop(w, dh, 0, yo);
		}
	} else {
		if (h < dh) {
			var xo = (dw - w) / 2;
			imgGm.crop(dw, h, xo, 0);
		} else {
			var sw, sh, xo, yo;
			if (w / dw > h / dh) {
				sw = w * dh / h;
				sh = dh;
				xo = (sw - dw) / 2;
				yo = 0;
			} else {
				sw = dw;
				sh = h * dw / w;
				xo = 0;
				yo = (sh - dh) / 2;
			}

			imgGm.in("-size", w + "x" + h)
				.scale(sw, sh)
				.crop(dw, dh, xo, yo);
		}
	}

	imgGm.write(G.UP_DIR.ROOT + destRelativePath,
				async.apply(convertCallback, task.field, destRelativePath, cb));
};

function scaleAndLimitWidth(task, size, meta, cb) {
	var w = size.width,
		dw = meta.width,
		quality = meta.quality,
		srcPath = G.UP_DIR.ROOT + task.pic.origin,
		options = task.options;

	var destRelativePath = genDestPath(task.pic.origin, meta.suffix);

	if (destRelativePath == null) {
		return cb('Origin file path format is bad.');
	}

	var imgGm = gm(srcPath);

	if(options != null && options.quality != null) {
		quality = options.quality;
	}

	imgGm.quality(quality);

	if (w <= dw) {
		if(quality == 100) {
			var result = {};
			result[task.field] = task.pic.origin;

			return cb(null, result);
		}
	} else {
		console.warn('Target width:: ' + dw);
		imgGm.scale(dw, null);
	}

	imgGm.write(G.UP_DIR.ROOT + destRelativePath,
		async.apply(convertCallback, task.field, destRelativePath, cb));
};

function convertCallback(field, path, cb, err) {
	console.log(" converted  ::  " + arguments[6]);
	if (err) {
		return cb(err);
	} else {
		var result = {};
		result[field] = path;

		console.log('Field:: ' + field + '\t' + 'path:: ' + path);

		return cb(err, result);
	}
}

function genDestPath(srcPath, suffix) {
	var index = srcPath.lastIndexOf('.');

	if (index < 0) return null;

	return srcPath.substring(0, index) + suffix;
};

var q = async.queue(converter.convertImg, 1);

q.drain = function () {
	console.log('all items have been processed');
};

exports.startConvertTask = function (task, callback, options) {
	if(options != null) {
		var newTask = _.clone(task);
		newTask.options = options;
		q.push(newTask, callback);
	} else {
		q.push(task, callback);
	}
};

//TODO: define two queues, one for imediate task, one for schedule task