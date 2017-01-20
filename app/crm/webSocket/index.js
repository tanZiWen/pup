
var _ = require('underscore');

var message = require('./message');
var wechatRoom = require('./wechatRoom');

var mapping = new Object();
_.extend(mapping, message, wechatRoom);

module.exports = mapping;
