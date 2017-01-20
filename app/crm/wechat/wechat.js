

var wechatAccountDao = require('../../../db/crm/wechatAccountDao'),
    wechatAccountContactDao = require('../../../db/crm/wechatAccountContactDao'),
    wechatAccountGroupDao = require('../../../db/crm/wechatAccountGroupDao'),
    wechatTaskDao = require('../../../db/crm/wechatTaskDao'),
    wechatMomentsDao = require('../../../db/crm/wechatMomentsDao'),
    wechatMsgDao = require('../../../db/crm/wechatMsgDao'),
    workGroupDao = require('../../../db/upm/workgroupDao'),
    wechatUserMsgDao = require('../../../db/crm/wechatUserMsgDao'),
    dictModel = require('../../portal/dictModel'),
    Pagination = require('../../../lib/Pagination');

var sender = require('../../../routes/sender.js');
var sioHelper = require('../../../lib/sioHelper.js');

var dictionary = require('../../../lib/dictionary');
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

var fs = require('fs'),
    nfs = require('node-fs'),
    G = require('../../../lib/global');


exports.chatRooms = function(req, res) {
    var data = {};

    var steps = {};

//    steps.accounts = function(next) {
//        wechatAccountDao.findAll(function(err, docs) {
//            if(err) {
//                data.accounts = [];
//            } else {
//                data.accounts = docs;
//            }
//            next(null);
//        });
//    }

    steps.tags = function(next) {
        wechatAccountContactDao.client.aggregate(
            {$unwind: '$tags'},
            {$group:{_id : null, tags : {$push : '$tags'}}},
            {$project:{tags: '$tags'}}
        ).exec(function(err, result) {
            if(err) {
                data.tags = [];
            } else {
                if(result && result.length > 0) {
                    data.tags = _.uniq(result[0].tags);
                } else {
                    data.tags = [];
                }
            }
            next(null);
        });
    };

    async.parallel(steps, function(err, result) {
        if(err) {
            res.json({tags : []});
        } else {
            res.json(data);
        }
    });

//    resetTagForContact();

};

exports.accountList = function(req, res) {

    var steps = {};
    var user = req.session.user;
    steps.accountIds = function(next) {
        workGroupDao.findWechatAccountByUser(user._id, function(err, docs) {
            if(err) {
                next(err);
            } else {
                var accountIds = _.pluck(docs, 'accountId');
                next(null, accountIds);
            }
        });
    }
    steps.accounts = ['accountIds', function(next, data) {
        wechatAccountDao.client.find({_id : {$in : data.accountIds}}, {contacts :0, groups : 0}, next);
    }];

    async.auto(steps, function(err, data) {
        if(err) {
            res.json({data : []});
        } else {
            res.json({data : data.accounts});
        }
    })
}

function resetTagForContact() {
    wechatAccountContactDao.client.find({}, function(err, docs) {
        _.each(docs, function(contact) {
            var comment = _s.trim(contact.comment);
            if(comment.length > 11) {
                var prefix = comment.substring(0, comment.length - 11);
                prefix = _s.trim(prefix);
                prefix = prefix.substring(0, prefix.length - 1);
                wechatAccountContactDao.client.update({_id : contact._id}, {tags : [prefix]}, function(err, result) {
                   console.log(result);
                });
            }
        });
    })
}

exports.contactList = function(req, res) {
    var where = {};
    var sort = {};
    if(!_s.isBlank(req.query.accountId)) {
        where.accountId = req.query.accountId;
    }

    if(!_s.isBlank(req.query.curContactId) && !_s.isBlank(req.query.curAccountId)) {
        where.curContactId = req.query.curContactId;
        where.curAccountId = req.query.curAccountId;
    }

    if(!_s.isBlank(req.query.tags) && req.query.tags.length > 0) {
        where.tags = req.query.tags;
    }

    if(!_s.isBlank(req.query.sortTag)) {
        sort.sortTag = req.query.sortTag;
    } else {
        sort.sortTag = 'lastChatSort';
    }

    wechatAccountDao.findContactInfo(req.session.user, where, sort, function(err, docs) {
        if(err) {
            res.json({data : []});
        } else {

            console.log(JSON.stringify(docs));
            res.json({data : docs});
        }
    });
}

exports.msgContactList = function(req, res) {
    wechatAccountDao.findMsgContactInfo(req.session.user, function(err, result) {
        if(err) {
            res.json({data : {msgContacts : [], unReadMsgCount : 0}});
        } else {
            res.json({data : result});
        }
    });
}

exports.historyList = function(req, res) {
    var condition = {};
    var user = req.session.user;
    var steps = {};
    if(req.query.page != undefined && req.query.page.condition != undefined && req.query.page.condition.accountData != undefined) {
        if(req.query.page.condition.contactData != undefined) {

            steps.userMsgContactRecords = function(next) {
                wechatUserMsgDao.findOne({userId : user._id, accountNo : req.query.page.condition.accountData,
                    contactWechatNo : req.query.page.condition.contactData, type: dictionary.wechatMsgType.contact}, function(err, doc) {
                    if(err) {
                        next(err);
                    } else {
                        condition = {type : dictionary.wechatMsgType.contact,
                            $or: [{'to.comment' : req.query.page.condition.contactData, 'from.wechatNo' : req.query.page.condition.accountData},
                                {'to.wechatNo' : req.query.page.condition.accountData, 'from.comment' : req.query.page.condition.contactData}]};
                        next(null, condition);
                    }
                });
            };

            steps.countUserMsg = function(next) {
                wechatUserMsgDao.client.count({userId : user._id, accountNo : req.query.page.condition.accountData,
                    contactWechatNo : req.query.page.condition.contactData, type: dictionary.wechatMsgType.contact}, function(err, count) {
                    if(err) {
                        next(err);
                    } else {
                        next(null, count);
                    }
                });
            };

            steps.updateUserMsg = ['countUserMsg', function(next, data) {
                var count = data.countUserMsg;
                if(count == 0) {
                    var userMsg = {userId : user._id, accountNo : req.query.page.condition.accountData,
                        contactWechatNo : req.query.page.condition.contactData, type: dictionary.wechatMsgType.contact};
                    userMsg.ctime = new Date();
                    userMsg.lastTimeStamp = new Date();
                    wechatUserMsgDao.addUserMsg(userMsg, next);
                } else {
                    wechatUserMsgDao.client.update({userId : user._id, accountNo : req.query.page.condition.accountData,
                        contactWechatNo : req.query.page.condition.contactData, type: dictionary.wechatMsgType.contact},
                        {lastTimeStamp : new Date()}, next);
                }
            }];
        } else if(req.query.page.condition.groupData != undefined) {

            var steps = {};

            steps.userMsgGroupRecords = function(next, data) {
                wechatUserMsgDao.findOne({userId : user._id, accountNo : req.query.page.condition.accountData,
                    groupId : req.query.page.condition.groupData, type: dictionary.wechatMsgType.group}, function(err, doc) {
                    if(err) {
                        next(err);
                    } else {
                        condition = {'group.groupId' : req.query.page.condition.groupData,
                            type : dictionary.wechatMsgType.group};
                        next(null, condition);
                    }
                });
            };

            steps.countUserMsg = function(next) {
                wechatUserMsgDao.client.count({userId : user._id, accountNo : req.query.page.condition.accountData,
                    groupId : req.query.page.condition.groupData, type: dictionary.wechatMsgType.group}, function(err, count) {
                    if(err) {
                        next(err);
                    } else {
                        next(null, count);
                    }
                });
            };

            steps.updateUserMsg = ['countUserMsg', function(next, data) {
                var count = data.countUserMsg;
                if(count == 0) {
                    var userMsg = {userId : user._id, accountNo : req.query.page.condition.accountData,
                        groupId : req.query.page.condition.groupData, type: dictionary.wechatMsgType.group};
                    userMsg.ctime = new Date();
                    userMsg.lastTimeStamp = new Date();
                    wechatUserMsgDao.addUserMsg(userMsg, next);
                } else {
                    wechatUserMsgDao.client.update({userId : user._id, accountNo : req.query.page.condition.accountData,
                            groupId : req.query.page.condition.groupData, type: dictionary.wechatMsgType.group},
                        {lastTimeStamp : new Date()}, next);
                }
            }];

        }

        async.auto(steps, function(err, result) {
            if(err) {
                res.json(500, {err : err.stack});
            } else {
                req.query.page.condition = condition;
                var pagination = new Pagination(req);

                wechatMsgDao.model.findByPage(pagination, function(err, docs) {
                    if(err) res.json(500, {err : err.stack});
                    else {
                        docs.reverse();
                        res.json({data : docs, pagination : pagination});
                    }
                });
            }
        });
    } else {
        res.json({data : []});
    }
}

exports.activityList = function(req, res) {
    var pagination = new Pagination(req);
    var accountCode = pagination.condition.accountData;
    var contactWechatNo = pagination.condition.contactData;
    pagination.condition = {accountCode : accountCode, contactWechatNo : contactWechatNo};
    wechatMomentsDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            res.json({data : docs, pagination : pagination});
        }
    });
}

exports.contactDetail = function(req, res) {
    var contactId = req.params.id;
    wechatAccountContactDao.client.findById(contactId, function(err, doc) {
        if(err) {
            res.json({type : dictionary.resMsgType.error, body : '获取标签失败'});
        } else {
            if(!_.has(doc._doc, 'tags')) {
                doc._doc.tags = [];
            }
            res.json({type : dictionary.resMsgType.succ, body : doc});
        }
    });
}

exports.modifyTags = function(req, res) {
    var contactId = req.body.contactId;
    var tags = req.body.tags;
    var industryTags = req.body.industryTags;
    var jobTags = req.body.jobTags;
    var addressTags = req.body.addressTags;
    var user = req.session.user;
    if(tags == undefined) {
        tags = [];
    }
    if(industryTags == undefined) {
        industryTags = [];
    }
    if(jobTags == undefined) {
        jobTags = [];
    }
    if(addressTags == undefined) {
        addressTags = [];
    }
    var steps = {};

    steps.contact = function(next) {
        wechatAccountContactDao.client.findById(contactId, next);
    }

    steps.wechatAccount = ['contact', function(next, data) {
        wechatAccountDao.client.findById(data.contact.belongAccount.accountId, next);
    }];

    steps.modifTags = ['contact', function(next, data) {
        wechatAccountContactDao.client.update({_id : contactId}, {tags : tags, industryTags : industryTags, jobTags : jobTags, addressTags : addressTags}, next);
    }];

    steps.genTask = ['contact', 'wechatAccount', function(next, data) {
        var wechatAccount = data.wechatAccount;
        var oldTags = data.contact.tags == undefined ? [] : data.contact.tags;
        var delTags = [];
        var plusTags = [];
        _.each(tags, function(tag) {
            if(!_.contains(oldTags, tag)) {
                plusTags.push(tag);
            }
        });
        _.each(oldTags, function(tag) {
            if(!_.contains(tags, tag)) {
                delTags.push(tag);
            }
        });
        if(delTags.length > 0 || plusTags.length > 0) {
            var wechatTask = {};
            wechatTask.wechatNo = wechatAccount.code;
            wechatTask.type = dictionary.wechatTaskRefType.modifyTags;
            wechatTask.done = false;
            wechatTask.priority = 2;
            wechatTask.cuserid = user._id;
            wechatTask.ctime = new Date();
            wechatTask.refObj = {comment : data.contact.comment, delTags : delTags, plusTags : plusTags};
            wechatTaskDao.add(wechatTask, next);
        } else {
            next(null);
        }

    }];

    steps.sendOnlineMsg = ['wechatAccount', 'genTask', function(next, data) {
        if(data.genTask) {
            sender.sendTaskForClientByRoom(sioHelper.get(), 'wechat-client:' + data.genTask.wechatNo, data.genTask);
        }
        next(null);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({type : dictionary.resMsgType.error, body : '修改失败，请重试'});
        } else {
            res.json({type : dictionary.resMsgType.succ, body : '修改成功'});
        }
    });
}

exports.avatarUpload = function(req, res) {
    var accountCode = req.body.accountCode;
    var steps = {};
    if(!_.isEmpty(accountCode)) {

        steps.account = function(next) {
            wechatAccountDao.findOne({code : accountCode}, next);
        }

        steps.saveAvatars = ['account', function(next, data) {
            var account = data.account;

            if(account != null) {
                var tasks = {};

                tasks.mkdir = function(cb) {
                    nfs.mkdir(G.WECHAT_CONTACT_AVATAR_PATH, 511, true, cb);
                }

                tasks.rename = ['mkdir', function(cb, data) {
                    var path = G.WECHAT_CONTACT_AVATAR_PATH;

                    _.each(_.keys(req.files), function(comment) {
                        var tmpPath = G.UPLOAD_TMP_PATH + req.files[comment].name;

                        var destPath = path + account.code + "_" + req.files[comment].originalname;
                        fs.rename(tmpPath, destPath, function(err) {
                            if(err) {
                                console.error("Failed to rename uploaded file: " + tmpPath + ' > ' + destPath + JSON.stringify(err));
                                cb(err);
                            } else {
                                cb(null, true);
                            }
                        });
                    });
                }];

                async.auto(tasks, next);
            } else {
                console.log('Account is not exist, upload avatar failed.');
                next(null);
            }
        }];
    }
    console.log('uploading avatar files.');

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({type : dictionary.resMsgType.error, body : "Upload avatar files failed."})
        } else {
            res.json({type : dictionary.resMsgType.succ, body : "Upload avatar files successfully."})
        }
    });
}

exports.momentsUpload = function(req, res) {

    var accountCode = req.body.accountCode;
    var steps = {};
    if(!_.isEmpty(accountCode)) {

        steps.account = function(next) {
            wechatAccountDao.findOne({code : accountCode}, next);
        };

        steps.saveMoments = ['account', function(next, data) {
            var account = data.account;
            var moments = JSON.parse(req.body.moments);
            var tasks = {};
            var i = 0;
            _.each(_.keys(moments), function(comment) {
                _.each(moments[comment], function(activity) {
                    tasks['saveActivity' + i] = function(cb) {
                        activity.accountCode = account.code;
                        activity.contactWechatNo = comment;
                        wechatMomentsDao.add(activity, cb);
                    };
                    i ++;
                });
            });
            async.parallel(tasks, next);
        }];

        steps.saveMomentsPhoto = ['account', function(next, data) {
            var account = data.account;

            if(account != null) {
                var tasks = {};

                tasks.mkdir = function(cb) {
                    nfs.mkdir(G.WECHAT_CONTACT_MOMENTS_PATH, 511, true, cb);
                };

                tasks.rename = ['mkdir', function(cb, data) {
                    var path = G.WECHAT_CONTACT_MOMENTS_PATH;

                    _.each(_.keys(req.files), function(comment) {
                        var tmpPath = G.UPLOAD_TMP_PATH + req.files[comment].name;

                        var destPath = path + req.files[comment].originalname;
                        fs.rename(tmpPath, destPath, function(err) {
                            if(err) {
                                console.error("Failed to rename uploaded file: " + tmpPath + ' > ' + destPath + JSON.stringify(err));
                                cb(err);
                            } else {
                                cb(null, true);
                            }
                        });
                    });
                }];

                async.auto(tasks, next);
            } else {
                console.log('Account is not exist, upload moments failed.');
                next(null);
            }
        }];
    }

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({type : dictionary.resMsgType.error, body : "Upload moments files failed."})
        } else {
            res.json({type : dictionary.resMsgType.succ, body : "Upload moments files successfully."})
        }
    });
}

exports.avatar = function(req, res) {
    var avatarPrefix = req.params.id;
    var avatarPath = G.WECHAT_CONTACT_AVATAR_PATH + avatarPrefix + '.png';

    fs.exists(avatarPath, function(exists) {
        var avatar = null;
        if (exists) {
            avatar = fs.readFileSync(avatarPath);
        } else {
            try {
                avatar = fs.readFileSync(avatarPath);
            } catch (e) {

            }
        }
        res.writeHead(200, {'Content-Type': 'image/gif' });
        res.end(avatar, 'binary');
    });
};

exports.momentsPhoto = function(req, res) {
    var fileName = req.params.id;
    var avatarPath = G.WECHAT_CONTACT_MOMENTS_PATH + fileName;

    fs.exists(avatarPath, function(exists) {
        var avatar = null;
        if (exists) {
            avatar = fs.readFileSync(avatarPath);
        } else {
            try {
                avatar = fs.readFileSync(avatarPath);
            } catch (e) {

            }
        }
        res.writeHead(200, {'Content-Type': 'image/gif' });
        res.end(avatar, 'binary');
    });
};







