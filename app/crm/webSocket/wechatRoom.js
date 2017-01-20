var wechatAccountDao = require('../../../db/crm/wechatAccountDao'),
    wechatAccountContactDao = require('../../../db/crm/wechatAccountContactDao'),
    wechatAccountTelNoDao = require('../../../db/crm/wechatAccountTelNoDao'),
    wechatAccountRepeatBatchAddTelNo = require('../../../db/crm/wechatRepeatBatchAddTelNoDao'),
    wechatAccountGroupDao = require('../../../db/crm/wechatAccountGroupDao'),
    wechatTaskDao = require('../../../db/crm/wechatTaskDao'),
    wechatMsgDao = require('../../../db/crm/wechatMsgDao'),
    wechatUserMsgDao = require('../../../db/crm/wechatUserMsgDao'),
    workGroupDao = require('../../../db/upm/workgroupDao'),
    customerDao = require('../../../db/crm/customerDao'),
    IOE = require('../../../lib/error');

var idg = require('../../../db/idg');
var logger = require('../../../lib/logFactory').getModuleLogger(module);
var dictionary = require('../../../lib/dictionary');
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');



var initChatRoom = function(io, socket, message, fn) {

    var user = socket.handshake.session.user;

    //find all wechat accounts of user
    workGroupDao.findWechatAccountByUser(user._id, function(err, docs) {
        console.log(socket.id + "-------");
        if(err) {
            fn('Chat room init failed.');
        } else {
            _.each(docs, function(doc) {
                var sids = _.pluck(io.sockets.clients('wechat-server:' + doc.code), 'id');
                if(!_.contains(sids, socket.id)) {
                    socket.join('wechat-server:' + doc.code);
                }
            });

            fn('Chat room init successfully.');
        }
    });

};

var sendMsg =  function(io, socket, message, fn) {
    var user = socket.handshake.session.user;
    console.log(message);

    if(!message.accountId || !message.type || !message.contactId || !message.content) return fn(IOE.BAD_REQUEST);

    var steps = {};

    steps.senderAccount = function(next) {
        wechatAccountDao.findOne({code : message.accountId}, next);
    };

    steps.receiverAccount = ['senderAccount', function(next, data) {
        if(data.senderAccount) {
            var contact = null;
            if(message.type == dictionary.wechatMsgType.contact) {
                contact = _.find(data.senderAccount.contacts, function(contact) {
                    return contact.comment == message.contactId;
                });
            } else {
                contact = _.find(data.senderAccount.groups, function(contact) {
                    return contact.groupId == message.contactId;
                });
            }
            if(contact) {
                next(null, contact);
            } else {
                next('no contact');
            }
        } else {
            next('no account');
        }
    }];

    steps.saveMsg = ['senderAccount', 'receiverAccount', function(next, data) {
        var wechatMsg = {};
        if(message.type == dictionary.wechatMsgType.contact) {
            wechatMsg.type = dictionary.wechatMsgType.contact;
            wechatMsg.from = {wechatNo : data.senderAccount.code, nickname : data.senderAccount.nickname, comment : data.senderAccount.nickname,
                    crmUser : {userId : user._id, realName : user.realName}};
            wechatMsg.to = {wechatNo : data.receiverAccount.wechatNo, nickname : data.receiverAccount.nickname, comment : data.receiverAccount.comment};
            wechatMsg.ctime = new Date();
            wechatMsg.content = message.content;
        } else if(message.type == dictionary.wechatMsgType.group) {
            var wechatMsg = {};
            wechatMsg.type = dictionary.wechatMsgType.group;
            wechatMsg.from = {wechatNo : data.senderAccount.code, nickname : data.senderAccount.nickname, comment : data.senderAccount.nickname,
                crmUser : {userId : user._id, realName : user.realName}};
            wechatMsg.group = {groupId : message.contactId, nickname : data.receiverAccount.nickname};
            wechatMsg.ctime = new Date();
            wechatMsg.content = message.content;
        }
        wechatMsgDao.add(wechatMsg, next);
    }];

    steps.updateLastChat = ['saveMsg', function(next, data) {
        if(message.type == dictionary.wechatMsgType.contact || message.type == dictionary.wechatMsgType.group) {
            wechatUserMsgDao.saveOrUpdateBySendMsg(data.saveMsg, user._id, next);
        } else {
            next(null);
        }
    }];

    steps.createTask = ['senderAccount', 'receiverAccount', 'saveMsg', function(next, data) {
        var wechatTask = {wechatNo : data.senderAccount.code, type : dictionary.wechatTaskRefType.privateMsg, done : false,
            cuserid : user._id, ctime : new Date(), priority : 3};
        if(message.type == dictionary.wechatMsgType.contact) {
            wechatTask.refObj = {
                receiver:{wechatNo : data.receiverAccount.wechatNo, nickname : data.receiverAccount.nickname,
                comment : data.receiverAccount.comment}, content : message.content};
        } else if(message.type == dictionary.wechatMsgType.group) {
            wechatTask.refObj = {
                receiver:{groupId : message.contactId, nickname : data.receiverAccount.nickname}, content : message.content};
        }

        wechatTaskDao.add(wechatTask, function(err, doc) {
            next(err, doc);
        });
    }];

    steps.sendOnlineMsg = ['senderAccount', 'saveMsg', 'createTask', function(next, data) {
        socket.broadcast.to('wechat-server:' + data.senderAccount.code).emit('wechatNewMsgNotif', data.saveMsg);
        socket.broadcast.to('wechat-client:' + data.senderAccount.code).emit('wechatNewMsgNotif', data.createTask);
        next(null);
    }];

    async.auto(steps, function(err, data) {
        if (err) {
            return fn(IOE.INTERNAL_ERROR);
        } else {
            return fn({'type' : dictionary.resMsgType.succ});
        }
    });

}

var sendMassMsg = function(io, socket, message, fn) {
    var massMaxCount = 180;
    var user = socket.handshake.session.user;
    console.log(message);

    if(!message.accountId || !message.contactIds || !message.content) return fn(IOE.BAD_REQUEST);

    var steps = {};

    steps.senderAccount = function(next) {
        wechatAccountDao.client.findOne({_id : message.accountId}, {contacts : 0, groups: 0}, next);
    };

    steps.contacts = ['senderAccount', function(next, data) {
        var account = data.senderAccount;
        if(account) {
            wechatAccountContactDao.client.find({'belongAccount.accountId' : message.accountId, comment : {$in : message.contactIds}}, next);
        } else {
            next('Account is not exist.');
        }
    }];

    steps.saveMsgAndTask = ['senderAccount', 'contacts', function(next, data) {
        var contacts = data.contacts;
        var subSteps = {};

        subSteps.saveMsg = function(subNext) {
            var tasks = {};

            var i = 0;
            _.each(contacts, function(contact) {
                tasks['saveMsg' + i] = function(cb) {
                    var atomSteps = {};

                    atomSteps.msg = function(atomNext) {
                        var wechatMsg = {};
                        wechatMsg.type = dictionary.wechatMsgType.contact;
                        wechatMsg.from = {wechatNo : data.senderAccount.code, nickname : data.senderAccount.nickname, comment : data.senderAccount.nickname,
                            crmUser : {userId : user._id, realName : user.realName}};
                        wechatMsg.to = {wechatNo : contact.wechatNo, nickname : contact.nickname, comment : contact.comment};
                        wechatMsg.ctime = new Date();
                        wechatMsg.content = message.content;
                        wechatMsgDao.add(wechatMsg, atomNext);
                    }

                    atomSteps.saveUserMsg = ['msg', function(atomNext, atomData) {
                        atomData.msg.ctime = atomData.msg.ctime.getTime();
                        wechatUserMsgDao.saveOrUpdateBySendMsg(atomData.msg, user._id, atomNext);
                    }];

                    atomSteps.sendOnlineMsgForServerUser = ['msg', 'saveUserMsg', function(atomNext, atomData) {
                        socket.broadcast.to('wechat-server:' + data.senderAccount.code).emit('wechatNewMsgNotif', atomData.msg);
                        atomNext(null);
                    }];

                    async.auto(atomSteps, cb);
                }

                i++;
            });

            async.parallel(tasks, subNext);
        }

        subSteps.saveTask = function(subNext) {
            var batchCount = parseInt(Math.ceil(contacts.length / massMaxCount));
            var batchWechatTasks = [];
            for(var i = 0; i < batchCount; i++) {

                var wechatTask = {wechatNo : data.senderAccount.code, type : dictionary.wechatTaskRefType.massMsg, done : false,
                    cuserid : user._id, ctime : new Date(), priority : 3};

                var batchContacts = [];
                for(var j = 0; j < massMaxCount; j++) {
                    if(j + i *massMaxCount >= contacts.length) {
                        break;
                    } else {
                        var contact = contacts[j + i*massMaxCount];
                        batchContacts.push({wechatNo : contact.wechatNo, nickname : contact.nickname, comment : contact.comment});
                    }
                }
                wechatTask.refObj = {receivers : batchContacts, content : message.content};
                batchWechatTasks.push(wechatTask);
            }

            var subTasks = {};
            var m = 0;
            _.each(batchWechatTasks, function(wechatTask) {
                subTasks['saveTask' + m] = function(cb) {
                    socket.broadcast.to('wechat-client:' + data.senderAccount.code).emit('wechatNewMsgNotif', wechatTask);
                    wechatTaskDao.add(wechatTask, cb);
                }
                m ++;
            });

            async.parallel(subTasks, subNext);
        }

        async.parallel(subSteps, next);

    }];

    async.auto(steps, function(err, data) {
        if (err) {
            return fn(IOE.INTERNAL_ERROR);
        } else {
            return fn({type : dictionary.resMsgType.succ});
        }
    });

}


var accountMonitor = function(io, socket, message, fn) {

    if(!message.deviceId) return fn(IOE.BAD_REQUEST);

    var steps = {};

    steps.wechatAccounts = function(next) {
        wechatAccountDao.find({deviceId : message.deviceId}, next);
    }

    steps.wechatContacts = ['wechatAccounts', function(next, data) {
        var accounts = data.wechatAccounts;
        var accountIds = _.pluck(accounts, '_id');
        var accountMap = {};
        var task = {};
        _.each(accountIds, function(accountId) {
            task[accountId + ''] = function(cb) {
                wechatAccountContactDao.client.aggregate(
                    {$match : {'belongAccount.accountId' : accountId}},
                    {$project : {_id : 0, contactId : '$_id', nickname : 1, wechatNo: 1, comment: 1, tags : 1}})
                    .exec(function(err, result) {
                        accountMap[accountId] = result;
                        cb(null);
                });
            }
        });
        async.parallel(task, function(err, result) {
            next(null, accountMap);
        });
    }];

    steps.wechatTask = ['wechatAccounts', function(next, data) {
        var accounts = data.wechatAccounts;
        var accountNos = _.pluck(accounts, 'code');
        wechatTaskDao.find({wechatNo : {$in : accountNos}, done : false}, next);
    }];

    steps.switchRoom = ['wechatAccounts', function(next, data) {
        var accounts = data.wechatAccounts;
        //join new romm before leaving all of old rooms
        var rooms = io.sockets.manager.roomClients[socket.id];
        _.each(_.keys(rooms), function(room) {
            if(room.length > 0) {
                socket.leave(room.substring(1));
            }
        });
        console.log('Android client had connected.');
        _.each(accounts, function(account) {
            socket.join('wechat-client:' + account.code);
        });
        next(null, true);
    }];

    async.auto(steps, function(err, data) {
        if(err) {
            fn(IOE.ACCOUNT_EXIST);
        } else {
            var accounts = data.wechatAccounts;
            var accountMap = data.wechatContacts;
            _.each(accounts, function(account) {
                account._doc.contacts = accountMap[account._id];
            });
            fn({monitorAccounts : accounts, tasks : data.wechatTask});
        }
    });

}

var getAccountTelNoByDeviceId = function(io, socket, message, fn) {
    if(!message.deviceId) return fn(IOE.BAD_REQUEST);
    var steps = {};
    steps.monitorAccounts = function(next) {
        wechatAccountDao.find({deviceId : message.deviceId}, next);
    };

    steps.accountTelNos = ['monitorAccounts', function(next, data) {
        var accountIds = _.pluck(data.monitorAccounts, '_id');
        wechatAccountTelNoDao.client.find({accountId: {$in : accountIds}, status : dictionary.customerWechatStatus.opened}, next);
    }];

    steps.accountTelNoData = ['monitorAccounts', 'accountTelNos', function(next, data) {
        var accountTelNos = data.accountTelNos;
        var accountMap = _.indexBy(data.monitorAccounts, '_id');
        var accountTelNoMap = {};
        _.each(accountTelNos, function(accountTelNo) {
            if(_.has(accountTelNoMap, accountTelNo.accountId)) {
                accountTelNoMap[accountTelNo.accountId].push(accountTelNo.telNo);
            } else {
                accountTelNoMap[accountTelNo.accountId] = [accountTelNo.telNo];
            }
        });
        var accountTelNos = [];
        _.each(_.keys(accountTelNoMap), function(accountId) {
            accountTelNos.push({wechatNo : accountMap[accountId].code, telNos : accountTelNoMap[accountId]});
        });

        next(null, accountTelNos);
    }];

    async.auto(steps, function(err, data) {
        if(err) {
            fn({accountTelNoList : []});
        } else {
            fn({accountTelNoList : data.accountTelNoData});
        }
    });

}

var accountList = function(io, socket, message, fn) {
    console.log('message.deviceId:', message.deviceId);
    if(!message.deviceId) return fn(IOE.BAD_REQUEST);
    var steps = {};
    steps.monitorAccounts = function(next) {
        wechatAccountDao.client.find({deviceId : message.deviceId}, {contacts : 0}, next);
    };

    steps.freeAccounts = function(next) {
        wechatAccountDao.client.find({deviceId : {$in : [null, '']}, telNo : {$ne : null}}, {contacts : 0}, next);
    };

    async.auto(steps, function(err, data) {
        if(err) {
            fn({monitorAccounts : null, freeAccounts : null});
        } else {
            fn({monitorAccounts : data.monitorAccounts, freeAccounts : data.freeAccounts});
        }
    });
}

var accountListBinding = function(io, socket, message, fn) {
    if(!message.deviceId || !message.wechatNos) return fn(IOE.BAD_REQUEST);
    var steps = {};
    steps.resetDevice = function(next) {
        wechatAccountDao.client.update({deviceId : message.deviceId}, {$unset: {deviceId : 1}}, {multi: true}, next);
    }

    steps.bindingDevice = ['resetDevice', function(next, data) {
        wechatAccountDao.client.update({code : {$in : message.wechatNos}, deviceId : {$in : [null]}}, {deviceId : message.deviceId}, {multi: true}, next);
    }];

    steps.bindingAccountList = ['bindingDevice', function(next, data) {
        wechatAccountDao.find({deviceId : message.deviceId}, next);
    }];

    async.auto(steps, function(err, data) {
        if(err) {
            fn({monitorAccounts : null});
        } else {
            fn({monitorAccounts : data.bindingAccountList});
        }
    });
}

var accountReSyncTelNos = function(io, socket, message, fn) {
    if(!message.wechatNo) return fn(IOE.BAD_REQUEST);

    var steps = {};

    steps.account = function(next) {
        wechatAccountDao.findOne({code : message.wechatNo}, next);
    }

    steps.lastSyncRecord = ['account', function(next, data) {
        var account = data.account;
        wechatAccountRepeatBatchAddTelNo.client.findOne({accountId : account._id}, next);
    }];

    steps.accountTelNos = ['account', function(next, data) {
        var account = data.account;
        var lastSyncRecord = data.lastSyncRecord;
        var needReSyncTelNos = true;
        if(lastSyncRecord) {
            var today = new Date();
            if(lastSyncRecord.ctime.setHours(0,0,0,0) == today.setHours(0,0,0,0)) {
                needReSyncTelNos = false;
            }
        }
        if(account != null && needReSyncTelNos) {
            wechatAccountTelNoDao.find({accountId : account._id, status : dictionary.customerWechatStatus.unopen}, function(err, docs) {
                if(err || docs == null) {
                    next(null, {needReSyncTelNos : needReSyncTelNos, accountTelNos : []});
                } else {
                    var telNos  = _.pluck(docs, 'telNo');
                    next(null, {needReSyncTelNos : needReSyncTelNos, accountTelNos : telNos});
                }
            });
        } else {
            next(null, {needReSyncTelNos : false, accountTelNos : []});
        }
    }];

    async.auto(steps, function(err, data) {
        if(!err) {
            fn(data.accountTelNos);
        } else {
            fn({needReSyncTelNos : false, accountTelNos : []});
        }
    });
}

var taskCompleted = function(io, socket, message, fn) {
    if(!message.taskList) return fn(IOE.BAD_REQUEST);
    var taskIds = _.pluck(message.taskList, 'id');
    wechatTaskDao.client.update({_id : {$in : taskIds}}, {done : true, doneTime : new Date()}, {multi : true}, function(err, result) {
        if(err) {
            return fn(IOE.INTERNAL_ERROR);
        } else {
            return fn({taskIds : taskIds});
        }
    });

    //asynchronous operation
    _.each(message.taskList, function(wechatTask) {
        if(wechatTask.type == dictionary.wechatTaskRefType.batchAddContact) {
            if(wechatTask.callbackContent != undefined && wechatTask.callbackContent != null) {
                var callbackContent = JSON.parse(wechatTask.callbackContent);

                var noWechatNos = callbackContent.noWechatNos;
                var wechatNos = callbackContent.wechatNos;

                var authWechatTelNos = _.pluck(wechatNos, 'telNo');
                var wechatScanTelNos = _.union(noWechatNos, authWechatTelNos);

                var tasks = {};

                tasks.task = function(next) {
                    wechatTaskDao.client.findById(wechatTask.id, next);
                }

                tasks.wehatAccount = ['task', function(next, data) {
                    wechatAccountDao.client.findOne({code : data.task.wechatNo}, next);
                }];

                tasks.unloadTelNos = ['wehatAccount', 'task', function(next, data) {
                    var wechatAccount = data.wehatAccount;
                    var task = data.task;
                    var allTelNos = task.refObj.telNos;
                    var unloadTelNos = [];
                    _.each(allTelNos, function(telNo) {
                        if(!_.contains(wechatScanTelNos, telNo)) {
                            unloadTelNos.push(telNo);
                        }
                    });

                    var updator = {};
                    updator.wechatCurScanStatus = 0;
                    updator.$push = {wechatAddRecord : {accountId : wechatAccount._id, accountNo : wechatAccount.code, wechatStatus : dictionary.customerWechatStatus.unopen, ctime : new Date()}};
                    customerDao.client.update({telNo : {$in : unloadTelNos}}, updator, {multi : true}, next);


                    //Async modify telNo of account
                    var allTelNos = data.task.refObj.telNos;
                    wechatAccountTelNoDao.client.remove({telNo : {$in : allTelNos}}, function(err, result) {
                        if(!err) {
                            var accountTelNos = [];
                            var batchGenerator = [];
                            _.each(allTelNos, function(telNo) {
                                var genId = function(atomCb) {
                                    idg.next(wechatAccountTelNoDao.client.collection.name, function(err, result) {
                                        if(!err) {
                                            var accountTelNo = {};
                                            accountTelNo._id = parseInt(result.toString());
                                            accountTelNo.accountId = wechatAccount._id;
                                            accountTelNo.telNo = telNo;
                                            if(_.contains(authWechatTelNos, telNo)) {
                                                accountTelNo.status = dictionary.customerWechatStatus.opened;
                                            } else {
                                                accountTelNo.status = dictionary.customerWechatStatus.unopen;
                                            }
                                            accountTelNo.ctime = new Date();
                                            accountTelNos.push(accountTelNo);
                                            atomCb(null, true);
                                        } else {
                                            atomCb(err);
                                        }
                                    });
                                }
                                batchGenerator.push(genId);
                            });

                            if(batchGenerator.length > 0) {
                                async.parallelLimit(batchGenerator, 2, function(err, results) {
                                    if(!err) {
                                        wechatAccountTelNoDao.client.create(accountTelNos, function(err, result) {
                                            if(!err) {
                                               console.log('Modify telNos of account successful');
                                            }
                                        });
                                    }
                                })
                            }
                        }
                    });

                }];

                tasks.pushAddRecordForNoWechat = ['wehatAccount', function(next, data) {
                    var wechatAccount = data.wehatAccount;
                    var updator = {};
                    updator.$push = {wechatAddRecord : {accountId : wechatAccount._id, accountNo : wechatAccount.code, wechatStatus : dictionary.customerWechatStatus.unopen, ctime : new Date()}};
                    customerDao.client.update({telNo : {$in : noWechatNos}}, updator, {multi : true}, next);
                }];

                tasks.pushAddRecordForWechat = ['wehatAccount', function(next, data) {
                    var wechatAccount = data.wehatAccount;
                    var updator = {};
                    updator.$push = {wechatAddRecord : {accountId : wechatAccount._id, accountNo : wechatAccount.code, wechatStatus : dictionary.customerWechatStatus.opened, ctime : new Date()}};
                    customerDao.client.update({telNo : {$in : authWechatTelNos}}, updator, {multi : true}, next);
                }];

                tasks.updateForWechatCustomer = function(next) {
                    var steps = {};
                    var i = 0;
                    _.each(wechatNos, function(authPhone) {
                        steps['updateCustomer' + i] = function(cb) {
                            var updator = {wechatAuth : true};
                            if(_.has(authPhone, 'sex')) {
                                updator.wechatSex = authPhone.sex;
                            }
                            customerDao.client.update({telNo : authPhone.telNo}, updator, {multi : true}, cb);
                        }

                        i ++;
                    });

                    async.parallel(steps, next);
                }

                async.auto(tasks, function(err, result) {
                    if(err) {
                        console.log('modify wechat status of customer failed ' + err.message);
                    }
                });

            }
        }
    });
}


var catchMsg = function(io, socket, message, fn) {
    if(!message.msgList) return fn(IOE.BAD_REQUEST);
    console.log("Catch some new msg...");
    var i = 0;
    var steps = {};
    _.each(message.msgList, function(msg) {
        steps['querySender' + i] = function(next) {
            msg.to = JSON.parse(msg.to);
            if(msg.type == dictionary.wechatMsgType.contact) {
                msg.from = JSON.parse(msg.from);
                wechatAccountDao.client.findOne({code : msg.to.wechatNo}, {contacts : {$elemMatch : {comment : msg.from.comment}}}, function(err, doc) {
                    if(err) {
                        next(null);
                    } else {
                        if(doc != null && doc._doc.contacts.length > 0) {
                            var contact = doc._doc.contacts[0];
                            msg.from = {wechatNo : contact.wechatNo, nickname : contact.nickname, comment : contact.comment};
                        }
                        next(null);
                    }
                });
            } else {
                msg.group = JSON.parse(msg.group);
                wechatAccountDao.client.findOne({code : msg.to.wechatNo}, {groups : {$elemMatch : {nickname : msg.group.nickname}}}, function(err, doc) {
                    if(err) {
                        next(null);
                    } else {
                        if(doc != null && doc._doc.length > 0) {
                            var group = doc._doc.groups[0];
                            msg.group = {groupId : group.groupId, nickname : group.nickname};
                        }
                        next(null);
                    }
                });
            }
        }
        i++;
    });

    async.parallel(steps, function(err, result) {
        var tasks = {};

        tasks.updateLastChat = function(next) {
            var accountLastMsgMap = {};

            _.each(message.msgList, function(msg) {
                if(_.has(accountLastMsgMap, msg.to.wechatNo + "-" + msg.type)) {
                    if(accountLastMsgMap[msg.to.wechatNo + "-" + msg.type].ctime < msg.ctime) {
                        accountLastMsgMap[msg.to.wechatNo + "-" + msg.type] = msg;
                    }
                } else {
                    accountLastMsgMap[msg.to.wechatNo + "-" + msg.type] = msg;
                }
            });

            var lastMsgList = _.values(accountLastMsgMap);
            var updateTasks = {};
            var j = 0;
            _.each(lastMsgList, function(userMsg) {
                updateTasks['updateUserMsg' + j] = function(cb) {
                    wechatUserMsgDao.saveOrUpdateByReceiveMsg(userMsg, cb);
                }
                j++;
            });

            async.parallel(updateTasks, next);
        }

        tasks.saveMsg = ['updateLastChat', function(next) {
            //save msg in db
            var saveTasks = {};
            var k = 0;
            _.each(message.msgList, function(msg) {
                msg.ctime = new Date(msg.ctime);
                saveTasks['saveMsg' + k] = function(cb) {
                    if((msg.type == dictionary.wechatMsgType.contact && _.has(msg.to, 'wechatNo')) || (msg.type == dictionary.wechatMsgType.group && _.has(msg.group, 'groupId'))) {
                        socket.broadcast.to('wechat-server:' + msg.to.wechatNo).emit('wechatNewMsgNotif', msg);
                        wechatMsgDao.add(msg, cb);
                    } else {
                        cb(null);
                    }
                }
                k++;
            });

            async.parallel(saveTasks, next);
        }];

        async.auto(tasks, function(err, result) {
            if(err) {
                console.log(err.stack);
                fn(IOE.INTERNAL_ERROR);
            } else {
                var msgIds = [];
                _.each(message.msgList, function(msg) {
                    msgIds.push(msg.id);
                });
                fn({catchMsgIds : msgIds});
            }
        });
    });
}

var syncNewContact = function(io, socket, message, fn) {

    if(!message.wechatNo || !message.contacts) return fn(IOE.BAD_REQUEST);

    message.contacts = JSON.parse(message.contacts);

    var steps = {};

    //在crm_wechat_account中查找对应的信息
    steps.account = function(next) {
        wechatAccountDao.client.findOne({code : message.wechatNo}, next);
    };

    steps.syncContact = ['account', function(next, data) {
        var contacts = _.has(data.account._doc, 'contacts') ? data.account._doc.contacts : [];
        var modifyTagsContacts = [];
        var newContacts = message.contacts;

        contacts = _.pluck(contacts, '_doc');

        //对原来的contacts的comment进行处理成手机号
        _.each(contacts, function(contact) {
            if(_.has(contact, 'comment')) {
                var telNo = contact.comment.trim();
                telNo = telNo.substring(telNo.length - 11);
                contact.telNo = telNo;
            }
        });

        //对APP端传过来的contacts处理成手机号
        _.each(newContacts, function(contact) {
            contact.telNo = contact.comment.trim().substring(contact.comment.trim().length - 11);
            var tags = contact.comment.trim().substring(0, contact.comment.trim().length - 12);
            contact.tags = tags;
        });


        //提取手机号码作为key
        var oldContactMap = [];

        oldContactMap = _.indexBy(contacts, 'telNo');

        //提取手机号码作为key
        var newContactMap = [];

        newContactMap = _.indexBy(newContacts, 'telNo');

        var addContacts = [];

        //遍历APP端传过来的contacts，若手机号存在，则只对属性进行修改。若不存在，则添加
        _.each(newContacts, function(contact) {
            if(_.has(oldContactMap, contact.telNo)) {
                modifyTagsContacts.push(oldContactMap[contact.telNo]);
            }else {
                addContacts.push(contact);
            }
        });

        var parentTasks = {};

        parentTasks.modifyTags = function(atomNext) {
            var subTasks = {};
            var j = 0;
            _.each(modifyTagsContacts, function(tagsContact) {
                subTasks['modifyContactTags' + j] = function(cb) {
                    wechatAccountContactDao.client.update({'belongAccount.accountId' : data.account._id, telNo : tagsContact.telNo}, {$set: {tags : [newContactMap[tagsContact.telNo].tags], comment: newContactMap[tagsContact.telNo].comment}}, cb);
                };
                j ++;
            });
            async.parallel(subTasks, atomNext);
        };

        parentTasks.saveNewContacts = function(atomNext) {
            var task = {};
            var i = 0;

            var updateContacts = [];
            _.each(addContacts, function(contact) {
                task['saveContact' + i] = function(cb) {
                    var subTask = {};

                    subTask.saveContact = function(subNext) {
                        contact.status = dictionary.wechatContactStatus.ok;
                        contact.tags = [contact.tags];
                        contact.ctime = new Date();
                        contact.belongAccount = {
                            "accountId" : data.account._id,
                            "accountCode" : data.account.code,
                            "accountNickname" : data.account.nickname
                        };
                        wechatAccountContactDao.add(contact, function(err, doc) {
                            if(err) {
                                subNext(null);
                            } else {
                                updateContacts.push({contactId : doc._id, wechatNo : doc.wechatNo, nickname: doc.nickname, comment: doc.comment});
                                subNext(null);
                            }
                        });
                    };

                    subTask.removeTelNoOfAccount = function(subNext) {
                        wechatAccountTelNoDao.client.remove({telNo : contact.telNo}, function(err, result) {
                            if(err) {
                                subNext(null, true);
                            } else {
                                subNext(null, true);
                            }
                        });
                    };

                    subTask.updateCustomerByTelNo = function(subNext) {
                        customerDao.client.update({telNo : contact.telNo}, {wechatManager : {accountId : data.account._id, accountNo : data.account.code, ctime : new Date()}, wechatAuth : true}, subNext);
                    };
                    async.parallel(subTask, cb);
                };
                i ++;
            });

            async.parallel(task, function(err, result) {
                atomNext(null, updateContacts);
            });
        };

        async.parallel(parentTasks, function(err, result) {
            next(null, result.saveNewContacts);
        });

    }];

    steps.modifyAccount = ['account', 'syncContact', function(next, data) {
        var newContacts = data.syncContact;
        wechatAccountDao.client.update({_id : data.account._id}, {$push : {contacts : {$each : newContacts}}}, next);
    }];

    steps.loadNewAccount = ['account', 'modifyAccount', function(next, data) {
        wechatAccountDao.client.findById(data.account._id, next);
    }];

    steps.wechatContacts = ['loadNewAccount', function(next, data) {
        var account = data.loadNewAccount;
        wechatAccountContactDao.client.aggregate(
            {$match : {'belongAccount.accountId' : account._id}},
            {$project : {_id : 0, contactId : '$_id', nickname : 1, wechatNo: 1, comment: 1, tags : 1}}).exec(next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            fn(IOE.INTERNAL_ERROR);
        } else {
            result.loadNewAccount._doc.contacts = result.wechatContacts;
            fn({account : result.loadNewAccount});
        }
    });

}


















module.exports = {"chatRoom.init": initChatRoom, "chatRoom.sendMsg" : sendMsg, 'chatRoom.sendMassMsg': sendMassMsg, 'account.monitor' : accountMonitor
    , 'account.list' : accountList, 'account.list.binding' : accountListBinding
    , "task.completed" : taskCompleted, "msg.catch" : catchMsg, 'account.syncNewContact' : syncNewContact, 'account.getTask' : accountMonitor,
    'account.reSyncTelNo' : accountReSyncTelNos, 'account.loadAccountTelNo' : getAccountTelNoByDeviceId};