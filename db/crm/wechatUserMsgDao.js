/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var workGroupDao = require('../upm/workgroupDao');
var WechatUserMsg = exports.client = model.crm_wechat_user_msg;
var idg = require('../../db/idg');

var dictionary = require('../../lib/dictionary');
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.model = WechatUserMsg;

exports.find = function(where, cb) {
    WechatUserMsg.find(where, cb);
}

exports.findOne = function(where, cb) {
    WechatUserMsg.findOne(where, cb);
}


exports.addUserMsg = function (params, cb) {
    idg.next(WechatUserMsg.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            WechatUserMsg(params).save(function(err, doc){
                if(!err) {
                    cb(null, doc);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.saveOrUpdateByReceiveMsg = function(userMsg, cb) {
    workGroupDao.findUsersByWechat(userMsg.to.wechatNo, function(err, userIds) {
        if(err) {
            cb(err);
        } else {
            var steps = {};
            var i = 0;
            _.each(userIds, function(userId) {
                steps['updateLastChat' + i] = function(next) {
                    if(userMsg.type == dictionary.wechatMsgType.contact && _.has(userMsg.to, 'wechatNo')) {
                        WechatUserMsg.findOne({accountNo : userMsg.to.wechatNo, userId : userId,
                            type : userMsg.type, contactWechatNo : userMsg.from.comment}, function(err, doc) {
                            if(err) {
                                cb(err);
                            } else {
                                if(doc) {
                                    //update
                                    WechatUserMsg.update({accountNo : userMsg.to.wechatNo, userId : userId, type : userMsg.type, contactWechatNo : userMsg.from.comment},
                                        {lastChat : {ctime : new Date(userMsg.ctime), content : userMsg.content}}, next);
                                } else {
                                    //insert
                                    var params = {accountNo : userMsg.to.wechatNo, userId : userId, type : userMsg.type, contactWechatNo : userMsg.from.comment,
                                            lastChat : {ctime : new Date(userMsg.ctime), content : userMsg.content}, ctime: new Date(), lastTimeStamp : new Date(30 * 1000)};
                                    exports.addUserMsg(params, next);
                                }
                            }
                        });

                    } else if(userMsg.type == dictionary.wechatMsgType.group && _.has(userMsg.group, 'groupId')) {
                        WechatUserMsg.findOne({accountNo : userMsg.to.wechatNo, userId : userId,
                            type : userMsg.type, groupId : userMsg.group.groupId}, function(err, doc) {
                            if(err) {
                                cb(err);
                            } else {
                                if(doc) {
                                    //update
                                    WechatUserMsg.update({accountNo : userMsg.to.wechatNo, userId : userId, type : userMsg.type, groupId : userMsg.group.groupId},
                                        {lastChat : {ctime : new Date(userMsg.ctime), content : userMsg.content}}, next);
                                } else {
                                    //insert
                                    var params = {accountNo : userMsg.to.wechatNo, userId : userId, type : userMsg.type, groupId : userMsg.group.groupId,
                                        lastChat : {ctime : new Date(userMsg.ctime), content : userMsg.content}, ctime: new Date(), lastTimeStamp : new Date(30 * 1000)};
                                    exports.addUserMsg(params, next);
                                }
                            }
                        });
                    } else {
                        next(null);
                    }
                }
                i++;
            });

            async.parallel(steps, cb);
        }
    });
}

exports.saveOrUpdateBySendMsg = function(userMsg, senderId, cb) {
    workGroupDao.findUsersByWechat(userMsg.from.wechatNo, function(err, userIds) {
        if(err) {
            cb(err);
        } else {
            var steps = {};
            var i = 0;
            _.each(userIds, function(userId) {
                steps['updateLastChat' + i] = function(next) {
                    if(userMsg.type == dictionary.wechatMsgType.contact && _.has(userMsg.from, 'wechatNo')) {
                        WechatUserMsg.findOne({accountNo : userMsg.from.wechatNo, userId : userId,
                            type : userMsg.type, contactWechatNo : userMsg.to.comment}, function(err, doc) {
                            if(err) {
                                cb(err);
                            } else {
                                if(doc) {
                                    //update
                                    var updOptions = {lastChat : {ctime : new Date(userMsg.ctime), content : userMsg.content}};
                                    if(senderId == userId) {
                                        updOptions.lastTimeStamp = new Date();
                                    }
                                    WechatUserMsg.update({accountNo : userMsg.from.wechatNo, userId : userId, type : userMsg.type, contactWechatNo : userMsg.to.comment},
                                        updOptions, next);
                                } else {
                                    //insert
                                    var createOptions = {accountNo : userMsg.from.wechatNo, userId : userId, type : userMsg.type, contactWechatNo : userMsg.to.comment,
                                        lastChat : {ctime : new Date(userMsg.ctime), content : userMsg.content}, ctime: new Date()};
                                    if(senderId == userId) {
                                        createOptions.lastTimeStamp = new Date();
                                    } else {
                                        createOptions.lastTimeStamp = new Date(30 * 1000);
                                    }
                                    exports.addUserMsg(createOptions, next);
                                }
                            }
                        });

                    } else if(userMsg.type == dictionary.wechatMsgType.group && _.has(userMsg.group, 'groupId')) {
                        WechatUserMsg.findOne({accountNo : userMsg.from.wechatNo, userId : userId,
                            type : userMsg.type, groupId : userMsg.group.groupId}, function(err, doc) {
                            if(err) {
                                cb(err);
                            } else {
                                if(doc) {
                                    //update
                                    WechatUserMsg.update({accountNo : userMsg.from.wechatNo, userId : userId, type : userMsg.type, groupId : userMsg.group.groupId},
                                        {lastChat : {ctime : new Date(userMsg.ctime), content : userMsg.content}}, next);
                                } else {
                                    //insert
                                    var params = {accountNo : userMsg.from.wechatNo, userId : userId, type : userMsg.type, groupId : userMsg.group.groupId,
                                        lastChat : {ctime : new Date(userMsg.ctime), content : userMsg.content}, ctime: new Date(), lastTimeStamp : new Date(30 * 1000)};
                                    exports.addUserMsg(params, next);
                                }
                            }
                        });
                    } else {
                        next(null);
                    }
                }
                i++;
            });

            async.parallel(steps, cb);
        }
    });
}

