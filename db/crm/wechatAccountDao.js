/**
 * Created by wangnan on 14-6-25.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatAccount = exports.client = model.crm_wechat_account;
var idg = require('../../db/idg');
var wechatMsgDao = require('./wechatMsgDao');
var wechatUserMsgDao = require('./wechatUserMsgDao');
var wechatAccountContactDao = require('./wechatAccountContactDao');
var workGroupDao = require('../upm/workgroupDao');
var dictionary = require('../../lib/dictionary');
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');


exports.add = function(wechatAccount, cb) {
    idg.next(WechatAccount.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = result.toString();

            wechatAccount._id = parseInt(id);

            WechatAccount(wechatAccount).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.findAll = function(cb){
    WechatAccount.find({},{}, {sort : {_id : 1}}, cb);
}


exports.find = function(where, cb) {
    WechatAccount.find(where, cb);
}

exports.findOne = function(where, cb) {
    WechatAccount.findOne(where, cb);
}

exports.findGroupByWechatAndGroupNickname = function(wechatNo, groupNickname, cb) {
    WechatAccount.findOne({code : wechatNo}, {groups : {$elemMatch : {nickname : groupNickname}}}, function(err, account) {
        if(err) {
            cb(err);
        } else {
            if(account && account._doc.groups.length > 0) {
                cb(null, account._doc.groups[0]);
            } else {
                cb(null, null);
            }
        }
    });
}

exports.findContactInfo = function(user, where, sort, cb) {

    var steps = {};

    steps.refreshCurContactTimeStamp = function(next) {
        if(!_s.isBlank(where.curContactId) && !_s.isBlank(where.curAccountId)) {
            wechatUserMsgDao.client.update({userId : user._id, accountNo : where.curAccountId,
                    contactWechatNo : where.curContactId, type: dictionary.wechatMsgType.contact},
                {lastTimeStamp : new Date()}, next);
        } else {
            next(null);
        }
    }

    steps.accountIds = function(next) {
        workGroupDao.findWechatAccountByUser(user._id, function(err, docs) {
            if(err) {
                next(err);
            } else {
                var accountIds = _.pluck(docs, 'accountId');
                if(_.has(where, 'accountId')) {
                    if(_.contains(accountIds, parseInt(where.accountId))) {
                        next(null, [where.accountId]);
                    } else {
                        next(null, []);
                    }
                } else {
                    next(null, accountIds);
                }
            }
        });
    };

    steps.contacts = ['refreshCurContactTimeStamp', 'accountIds', function(next, data) {
        var params = {'belongAccount.accountId' : {$in : data.accountIds}};

        if(_.has(where, 'tags') && where.tags.length > 0) {
            params.tags = {$in : where.tags};
        }

        wechatAccountContactDao.client.find(params, next);
    }];

    steps.userMsgContactRecords = ['contacts', function(next, data) {
        var accountNos = _.uniq(_.pluck(_.pluck(data.contacts, 'belongAccount'), 'accountCode'));
        var contactNos = _.pluck(data.contacts, 'comment');
        wechatUserMsgDao.find({userId : user._id, accountNo : {$in : accountNos}, contactWechatNo : {$in : contactNos},
            type: dictionary.wechatMsgType.contact}, next);
    }];

    steps.msgCounts = ['contacts', 'userMsgContactRecords', function(next, data) {
        var userMsgContactRecords = data.userMsgContactRecords;
        var subSteps = {};
        var i = 0;

        var contacts = data.contacts;

        var hasMsgContacts = [];
        var contactMsgMap = {};

        _.each(userMsgContactRecords, function(userMsgContactRecord) {
            subSteps['selectMsg' + i] = function(cb) {
                wechatMsgDao.client.count({$or : [{'from.comment' : userMsgContactRecord.contactWechatNo, 'to.wechatNo' : userMsgContactRecord.accountNo},
                    {'to.comment' : userMsgContactRecord.contactWechatNo, 'from.wechatNo' : userMsgContactRecord.accountNo}],
                    type : userMsgContactRecord.type, ctime : {$gt : userMsgContactRecord.lastTimeStamp}}, function(err, count) {
                    if(err) {
                        cb(err);
                    } else {
                        contactMsgMap[userMsgContactRecord.accountNo + '-' + userMsgContactRecord.contactWechatNo] = {count : count, lastChat : userMsgContactRecord._doc.lastChat};
                        cb(null);
                    }
                });
            }
            i++;
        });

        async.parallel(subSteps, function(err, docs) {
            if(err) {
                next(err);
            } else {
                _.each(contacts, function(contact) {
                    if(_.has(contactMsgMap, contact.belongAccount.accountCode+'-'+contact.comment)) {
                        var count = contactMsgMap[contact.belongAccount.accountCode+'-'+contact.comment].count;
                        if(count > 0) {
                            contact._doc.count = count;
                            contact._doc.lastChat = contactMsgMap[contact.belongAccount.accountCode+'-'+contact.comment].lastChat;
                        } else {
                            contact._doc.count = 0;
                            contact._doc.lastChat = contactMsgMap[contact.belongAccount.accountCode+'-'+contact.comment].lastChat;
                        }
                    }
                });
                contacts = _.sortBy(contacts, function(contact) {
                    if(sort.sortTag == 'lastChatSort') {
                        if(_.has(contact._doc, 'lastChat') && _.has(contact._doc.lastChat, 'ctime')) {
                            return contact._doc.lastChat.ctime;
                        } else {
                            return '0';
                        }
                    } else {
                        return contact._doc.comment;
                    }
                });
                hasMsgContacts = _.sortBy(hasMsgContacts, function(contact) {
                    if(_.has(contact._doc, 'lastChat') && _.has(contact._doc.lastChat, 'ctime')) {
                        return contact._doc.lastChat.ctime;
                    } else {
                        return '0';
                    }
                });
                if(sort.sortTag == 'lastChatSort') {
                    contacts.reverse();
                }
                hasMsgContacts.reverse();
                next(null, {contacts : contacts, msgContacts : hasMsgContacts});
            }
        });

    }];

    async.auto(steps, function(err, data) {
        if(err) {
            cb(err);
        } else {
            cb(null, data.msgCounts);
        }
    });

}

exports.findMsgContactInfo = function(user, cb) {

    var steps = {};

    steps.accountIds = function(next) {
        workGroupDao.findWechatAccountByUser(user._id, function(err, docs) {
            if(err) {
                next(err);
            } else {
                var accountIds = _.pluck(docs, 'accountId');
                next(null, accountIds);
            }
        });
    };

    steps.contacts = ['accountIds', function(next, data) {
        var params = {'belongAccount.accountId' : {$in : data.accountIds}};

        wechatAccountContactDao.client.find(params, next);
    }];

    steps.userMsgContactRecords = ['contacts', function(next, data) {
        var accountNos = _.uniq(_.pluck(_.pluck(data.contacts, 'belongAccount'), 'accountCode'));
        var contactNos = _.pluck(data.contacts, 'comment');
        wechatUserMsgDao.find({userId : user._id, accountNo : {$in : accountNos}, contactWechatNo : {$in : contactNos},
            type: dictionary.wechatMsgType.contact}, next);
    }];

    steps.msgCounts = ['contacts', 'userMsgContactRecords', function(next, data) {
        var userMsgContactRecords = data.userMsgContactRecords;
        var subSteps = {};
        var i = 0;

        var contacts = data.contacts;

        var hasMsgContacts = [];

        var totalCount = 0;

        var contactMsgMap = {};

        _.each(userMsgContactRecords, function(userMsgContactRecord) {
            subSteps['selectMsg' + i] = function(cb) {
                wechatMsgDao.client.count({$or : [{'from.comment' : userMsgContactRecord.contactWechatNo, 'to.wechatNo' : userMsgContactRecord.accountNo},
                    {'to.comment' : userMsgContactRecord.contactWechatNo, 'from.wechatNo' : userMsgContactRecord.accountNo}],
                    type : userMsgContactRecord.type, ctime : {$gt : userMsgContactRecord.lastTimeStamp}}, function(err, count) {

                    if(err) {
                        cb(err);
                    } else {
                        contactMsgMap[userMsgContactRecord.accountNo + '-' + userMsgContactRecord.contactWechatNo] = {count : count, lastChat : userMsgContactRecord._doc.lastChat};
                        cb(null);
                    }
                });
            }
            i++;
        });

        async.parallel(subSteps, function(err, docs) {
            if(err) {
                next(err);
            } else {
                _.each(contacts, function(contact) {
                    if(_.has(contactMsgMap, contact.belongAccount.accountCode+'-'+contact.comment)) {
                        var count = contactMsgMap[contact.belongAccount.accountCode+'-'+contact.comment].count;
                        if(count > 0) {
                            var msgContact = _.clone(contact);
                            msgContact._doc.count = count;
                            msgContact._doc.lastChat = contactMsgMap[contact.belongAccount.accountCode+'-'+contact.comment].lastChat;
                            hasMsgContacts.push(msgContact);
                            totalCount += count;
                        }
                    }
                });
                hasMsgContacts = _.sortBy(hasMsgContacts, function(contact) {
                    if(_.has(contact._doc, 'lastChat') && _.has(contact._doc.lastChat, 'ctime')) {
                        return contact._doc.lastChat.ctime;
                    } else {
                        return '0';
                    }
                });
                hasMsgContacts.reverse();
                next(null, {msgContacts : hasMsgContacts, unReadMsgCount : totalCount});
            }
        });

    }];

    async.auto(steps, function(err, data) {
        if(err) {
            cb(err);
        } else {
            cb(null, data.msgCounts);
        }
    });

}
