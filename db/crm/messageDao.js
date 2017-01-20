/**
 * Created by wangnan on 14-5-15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var Message = exports.client = model.crm_message;
var userDao = require('../upm/userDao');

var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = Message;

exports.countUnPushedByUserId = function(userId, cb) {
    Message.count({userId: userId, pushed : false}, cb);
}
