/**
 *
 * User: wuzixiu
 * Date: 1/10/13
 * Time: 1:11 PM
 */

exports = module.exports = ioMiddleware;

var io = require('socket.io');

io.Manager.prototype.handleRequest = function (req, res) {
	var data = this.checkRequest(req);

	if (!data) {
		for (var i = 0, l = this.oldListeners.length; i < l; i++) {
			this.oldListeners[i].call(this.server, req, res);
		}

		return;
	}

	if (data.static || !data.transport && !data.protocol) {
		if (data.static && this.enabled('browser client')) {
			this.static.write(data.path, req, res);
		} else {
			res.writeHead(200);
			res.end('Welcome to socket.io.');

			this.log.info('unhandled socket.io url');
		}

		return;
	}

	if (data.protocol != io.protocol) {
		res.writeHead(500);
		res.end('Protocol version not supported.');

		this.log.info('client protocol version unsupported');
	} else {
		if (data.id) {
			console.log('Handle socket.io request.');
			this.handleHTTPRequest(data, req, res);
		} else {
			req.handshakeData = data;
			for (var i = 0, l = this.oldListeners.length; i < l; i++) {
				this.oldListeners[i].call(this.server, req, res);
			}

			return;
		}
	}
};

io.Manager.prototype.handleHandshake = function (data, req, res) {
	var self = this
		, origin = req.headers.origin
		, headers = {
			'Content-Type':'text/plain'
		};

	function writeErr(status, message) {
		if (data.query.jsonp && jsonpolling_re.test(data.query.jsonp)) {
			res.writeHead(200, { 'Content-Type':'application/javascript' });
			res.end('io.j[' + data.query.jsonp + '](new Error("' + message + '"));');
		} else {
			res.writeHead(status, headers);
			res.end(message);
		}
	};

	function error(err) {
		writeErr(500, 'handshake error');
		self.log.warn('handshake error ' + err);
	};

	if (!this.verifyOrigin(req)) {
		writeErr(403, 'handshake bad origin');
		return;
	}

	var handshakeData = this.handshakeData(data);

	if (origin) {
		// https://developer.mozilla.org/En/HTTP_Access_Control
		headers['Access-Control-Allow-Origin'] = origin;
		headers['Access-Control-Allow-Credentials'] = 'true';
	}

	this.authorize(req, res, handshakeData, function (err, authorized, newData) {
		if (err) return error(err);

		if (authorized) {
			var id = self.generateId()
				, hs = [
					id
					, self.enabled('heartbeats') ? self.get('heartbeat timeout') || '' : ''
					, self.get('close timeout') || ''
					, self.transports(data).join(',')
				].join(':');

			if (data.query.jsonp && jsonpolling_re.test(data.query.jsonp)) {
				hs = 'io.j[' + data.query.jsonp + '](' + JSON.stringify(hs) + ');';
				res.writeHead(200, { 'Content-Type':'application/javascript' });
			} else {
				res.writeHead(200, headers);
			}

			res.end(hs);

			self.onHandshake(id, newData || handshakeData);
			self.store.publish('handshake', id, newData || handshakeData);

			self.log.info('handshake authorized', id);
		} else {
			writeErr(403, 'handshake unauthorized');
			self.log.info('handshake unauthorized');
		}
	})
};


io.Manager.prototype.authorize = function (req, res, data, fn) {
  if (this.get('authorization')) {
    var self = this;

    this.get('authorization').call(this, req, res, data, function (err, authorized) {
      self.log.debug('client ' + authorized ? 'authorized' : 'unauthorized');
      fn(err, authorized);
    });
  } else {
    this.log.debug('client authorized');
    fn(null, true);
  }

  return this;
};

io.Manager.prototype.garbageCollection = function () {
  // clean up unused handshakes
  var ids = Object.keys(this.handshaken)
    , i = ids.length
    , now = Date.now()
    , handshake;

  while (i--) {
    handshake = this.handshaken[ids[i]];

	  //add bellow line to fix bug
	if(!handshake) continue;

    if ('issued' in handshake && (now - handshake.issued) >= 3E4) {
      this.onDisconnect(ids[i]);
    }
  }
};

function ioMiddleware(socketioManager) {
	var manager = socketioManager;

	return function (req, res, next) {

//		console.log('URL: ' + req.url + ', path' + req.path + ' ' + JSON.stringify(req.session));
		manager.handleHandshake(req.handshakeData, req, res);
	};
};