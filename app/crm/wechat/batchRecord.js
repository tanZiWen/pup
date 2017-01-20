
var dictModel = require('../../portal/dictModel'),
    Pagination = require('../../../lib/Pagination');
var batchRecordDao = require('../../../db/crm/batchRecordDao');
var customerDao = require('../../../db/crm/customerDao'),
    wechatAccountDao = require('../../../db/crm/wechatAccountDao'),
    wechatTaskDao = require('../../../db/crm/wechatTaskDao');
var areaModel = require('../../portal/areaModel');
var customerImplBatchDao = require('../../../db/crm/customerImplBatchDao');
var wechatMomentsDao = require('../../../db/crm/wechatMomentsDao');
var logger = require('../../../lib/logFactory').getModuleLogger(module);
var G = require('../../../lib/global');
var fs = require('fs');
var idg = require('../../../db/idg');
var galleryDao = require('../../../db/crm/galleryDao');
var wechatDeviceDao = require('../../../db/crm/wechatDeviceDao');
var workGroupDao = require('../../../db/upm/workgroupDao');
var userDao = require('../../../db/upm/userDao');
var wechatHNWCDao = require('../../../db/crm/wechatHNWCDao');
var wechatAppointDao = require('../../../db/crm/wechatAppointDao');
var moment = require('moment');



var sender = require('../../../routes/sender.js');

var dictionary = require('../../../lib/dictionary');
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');
var gm = require('gm');

var sio;

var sioHolder = module.exports = exports = function(io) {
    sio = io;
}

var wechatAccountContactDao = require('../../../db/crm/wechatAccountContactDao');


exports.batchRecordList = function(req, res) {
    var typeList = dictModel.getDictByType(dictionary.dictTypes.wechatBatchInsertType);
    var areas = areaModel.getAreas();
    var data = {};

    var steps = {};
    steps.wechatAccount = function(next) {
        wechatAccountDao.find({}, next);
    };

    steps.implBatch = function(next) {
        customerImplBatchDao.find({availableCount: {$ne: 0}}, next);
    };

    async.auto(steps, function(err, result) {
       if(err) {
           logger.error('crm.wechat.batchRecord.batchRecordList error:'+ err.stack);
           res.json(500, {err: err.stack});
       }else {
           var  accounts = [];
           var implBatchs = [];
           _.each(result.wechatAccount, function(value) {
               var account = {};
               account._id = value._id;
               account.nickname = value.nickname;
               accounts.push(account);
           });
           _.each(result.implBatch, function(value) {
               var implBatch = {};
               implBatch._id = value._id;
               implBatch.name = value.name;
               implBatchs.push(implBatch);
           });
           data.accounts = accounts;
           data.typeList = typeList;
           data.areas = areas;
           data.implBtachs = implBatchs;
           res.json(data);
       }
    });
};

exports.batchRecordDataList = function(req, res) {


//    wechatAccountContactDao.client.find({},{}, function(err, docs) {
//        if(!err) {
//            var steps = {};
//            _.each(docs, function(contact) {
//                steps[contact._id + ''] = function(next) {
//                    var telNo = contact.comment.trim();
//                    if(telNo.length >= 11) {
//                        telNo = telNo.substring(telNo.length - 11);
//                        var where = {};
//                        where.telNo = telNo;
//                        var updOptions = {};
//                        updOptions.wechatManager = {accountId : contact.belongAccount.accountId, accountNo : contact.belongAccount.accountCode, ctime : new Date('Nov 4, 2014')};
//                        customerDao.client.update(where, updOptions, next);
//                    }
//                }
//            });
//            async.parallelLimit(steps, 2, function(err, result) {
//                if(err)
//                    console.log(err.message);
//                else {
//                    console.log('successful');
//                }
//            });
//        }
//    });


    var pagination = new Pagination(req);
    batchRecordDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            _.each(docs, function(doc) {
                var type = dictModel.getDictByTypeAndKey(dictionary.dictTypes.wechatBatchInsertType, doc.type);
                if (type){
                    doc._doc.typeName = type.name;
                } else {
                    doc._doc.typeName = "";
                }
            });
            res.json({data : docs, pagination : pagination});
        }
    });
}

exports.create = function(req, res) {
    var user = req.session.user;
    var type = req.body.type;
    var repeat = req.body.repeat;
    var task = {};

    var filteAccounts = [];

    var filterCustomerIds = [];

    task.parseAccounts = function(cb) {
        if(type == dictionary.wechatBatchInsertType.random) {
            var count = req.body.count;
            var condition = {};
            condition.wechatManager = {$exists: false};
            condition.wechatCurScanStatus = 0;
            if(req.body.area) {
                condition['belongArea.areaCode'] = req.body.area;
            }
            if(req.body.implBatchId) {
                if(!req.body.check) {
                    condition.ImpBatchId = parseInt(req.body.implBatchId);
                }else {
                    condition.ImpBatchId = {$ne: parseInt(req.body.implBatchId)};
                }
            }

            customerDao.client.find(condition, {'_id' : 1, 'telNo' : 1}, {sort: [{wechatAddCount: 1}], skip: 0, limit: count * repeat}, function(err, docs) {
                if(err) {
                    cb(err);
                } else {
                    if(docs.length == 0) {
                        var subTask = {};
                        subTask.updateCustomers = function(subNext) {
                            customerDao.client.update({wechatCurScanStatus : null}, {wechatCurScanStatus : 0}, {multi : true}, subNext);
                        };

                        subTask.customers = ['updateCustomers', function(subNext, data) {
                            customerDao.client.find(condition, {'_id' : 1, 'telNo' : 1}, {sort: [{wechatAddCount: 1}], skip: 0, limit: count}, function(err, docs) {
                                if(err) {
                                    subNext(err);
                                } else {
                                    _.each(docs, function(doc) {
                                        filteAccounts.push(doc.telNo);
                                        filterCustomerIds.push(doc._id);
                                    });
                                    subNext(null, filteAccounts);
                                }
                            })
                        }];
                        async.auto(subTask, cb);
                    } else {
                        _.each(docs, function(doc) {
                            filteAccounts.push(doc.telNo);
                            filterCustomerIds.push(doc._id);
                        });
                        cb(null, filteAccounts);
                    }
                }
            });
        } else {
            repeat = 1;
            var accounts = req.body.accounts.split(',');

            var pattern = /^(?:13\d|14\d|15\d|17\d|18\d)-?\d{5}(\d{3}|\*{3})$/;
            _.each(accounts, function(account) {
                if(!_.isEmpty(account.trim()) && pattern.test(account.trim())) {
                    filteAccounts.push(account.trim());
                }
            });
            cb(null, filteAccounts);
        }
    };

    task.create = ['parseAccounts', function(cb, wrapperData) {
        var steps = {};

        steps.wehatAccount = function(next) {
            wechatAccountDao.client.findById(req.body.accountId, next);
        };

        steps.updateCustomers = function(next) {
            var updator = {};
            updator.wechatCurScanStatus = 1;
            updator.$inc = {wechatAddCount: 1};
            customerDao.client.update({_id : {$in : filterCustomerIds}}, updator, {multi : true}, next);
        };

        steps.saveBatchRecord = ['wehatAccount', function(next, data) {
            var params = {type : type, accounts : wrapperData.parseAccounts, count : filteAccounts.length};
            params.validateMsg = req.body.validateMsg;
            params.accountId = data.wehatAccount._id;
            params.accountNickname = data.wehatAccount.nickname;
            params.accountCode = data.wehatAccount.code;
            params.cuserid = user._id;
            params.cusername = user.username;
            params.crealName = user.realName;
            params.ctime = new Date();
            batchRecordDao.add(params, next);
        }];

        steps.saveWechatTask = ['wehatAccount', 'saveBatchRecord', function(next, data) {
            var count = req.body.count;
            var batchSaveTasks = {};
            var wechatTasks = [];
            var batchCount = parseInt(Math.ceil(filteAccounts.length / count));
            var batchTelNoMap = {};
            var index = -1;


            for (var i = 0; i < batchCount; i++) {
                var batchTelNos = [];
                for (var j = 0; j < count; j++) {
                    if (j + i * count >= filteAccounts.length) {
                        break;
                    } else {
                        var telNo = filteAccounts[j + i * count];
                        batchTelNos.push(telNo);
                    }
                }
                if (batchTelNos.length > 0) {
                    batchTelNoMap[i] = batchTelNos;
                    batchSaveTasks['saveTask' + i] = function (atomCb) {
                        index++;
                        var wechatTask = {};
                        wechatTask.wechatNo = data.wehatAccount.code;
                        wechatTask.type = dictionary.wechatTaskRefType.batchAddContact;
                        wechatTask.done = false;
                        wechatTask.priority = 2;
                        wechatTask.cuserid = user._id;
                        wechatTask.ctime = new Date();
                        wechatTask.refObj = {telNos: batchTelNoMap[index], validateMsg: req.body.validateMsg};
                        wechatTaskDao.add(wechatTask, function (err, doc) {
                            if (!err) {
                                wechatTasks.push(doc);
                            }
                            atomCb(null, true);
                        });
                    }
                }
            }
            async.parallel(batchSaveTasks, function(err, result) {
                next(null, wechatTasks);
            });

        }];

        steps.sendOnlineMsg = ['saveWechatTask', function(next, data) {
            if(!_.isEmpty(data.saveWechatTask)) {
                _.each(data.saveWechatTask, function(doc) {
                    sender.sendTaskForClientByRoom(sio, 'wechat-client:' + doc.wechatNo, doc._doc);
                });
            }
            next(null);
        }];

        async.auto(steps, cb);
    }];

    async.auto(task, function(err, result) {
        if(err) {
            //console.log(err.stack);
            res.json({msg :{type : dictionary.resMsgType.error, body : '添加失败'}});
        } else {
            res.json({msg :{type : dictionary.resMsgType.succ, body : '添加成功'}});
        }
    });
};

exports.addList = function(req, res) {
    wechatDeviceDao.find({}, function(err, doc) {
        if(err) {
            logger.error('crm.wechat.batchRecord.addList error:'+ err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({devices: doc});
        }
    })
};

exports.add = function(req, res) {
    var wechatAccount = req.body;
    wechatAccount.contacts = [];
    wechatAccount.groups = [];
    wechatAccount.status = "ok";
    var steps = {};

    steps.wechatAccount = function(next) {
        wechatAccountDao.findOne({code: wechatAccount.code}, next);
    };

    steps.add = ['wechatAccount', function(next, data) {
       if(_.isEmpty(data.wechatAccount)) {
           wechatAccountDao.add(wechatAccount, next);
       }else {
           next(null, false);
       }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.wechat.batchRecord.add error: ' + err.stack);
            res.json({msg :{type : dictionary.resMsgType.error, body : '添加失败'}});
        }else {
            if(result.add) {
                res.json({msg :{type : dictionary.resMsgType.succ, body : '添加成功'}});
            }else {
                res.json({msg :{type : dictionary.resMsgType.info, body : '微信号已存在,添加失败!'}});
            }
        }
    })
};

exports.addListTable = function(req, res) {
    var pagination = new Pagination(req);

    var condition = pagination.condition;

    if(condition.code) {
        condition.code = new RegExp(condition.code);
    }

    if(condition.nickname) {
        condition.nickname = new RegExp(condition.nickname);
    }

    if(condition.telNo) {
        condition.telNo = new RegExp(condition.telNo);
    }

    wechatAccountDao.client.findByPage(pagination, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.batchRecord.addListTable error: ' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            var wechatAccounts = _.pluck(docs, '_doc');
            if (err) {
                logger.error('crm.wechat.batchRecord.addListTable error:' + err.stack);
                res.json(500, {err: err.stack});
            } else {
                res.json({data: wechatAccounts, pagination: pagination});
            }
        }
    })
};

exports.editWechatAccount = function(req,res) {
    var _id = req.param('_id');

    var steps = {};

    steps.device = function(next) {
        wechatDeviceDao.find({}, next);
    };

    steps.account = function(next) {
        wechatAccountDao.client.findById(parseInt(_id), next);
    };

    steps.commuWorkGroup = function(next) {
        workGroupDao.findById(4, next);
    };

    steps.commuUser = ['commuWorkGroup', function(next, data) {
        if(!_.isEmpty(data.commuWorkGroup)) {
            var workers = data.commuWorkGroup.workers;
            var userIds = _.pluck(workers, 'userid');
            userDao.find({_id: {$in: userIds}}, next);
        }else {
            next(null, []);
        }
    }];

    async.auto(steps, function(err, docs) {
        if(err) {
            logger.log('crm.wehcat.batchRecord.editWechatAccount error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            var wechatAccount = docs.account;
            var devices = _.pluck(docs.device, '_doc');
            var commuUsers = docs.commuUser;
            res.json({wechatAccount: wechatAccount, devices: devices, commuUsers: commuUsers});
        }
    });
};

exports.edit = function(req, res) {
    var params = req.body;

    wechatAccountDao.client.findById(parseInt(params._id), function(err, doc) {
        if(err) {
            logger.log('crm.wehcat.batchRecord.edit.findById error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            doc.password = params.password;
            doc.nickname = params.nickname;
            doc.telNo = params.telNo;
            if(params.device) {
                var device = params.device.split(',');
                doc.deviceNo = device[0];
                doc.deviceName = device[1];
            }
            if(params.commuUser) {
                var commuUser = params.commuUser.split(',');
                doc.commuUserId = commuUser[0];
                doc.commuUsername = commuUser[1];
                doc.commuRealName = commuUser[2];
            }
            if(params.commuStartTime) {
                doc.commuStartTime = new Date(params.commuStartTime);
            }
            if(params.commuEndTime) {
                doc.commuEndTime = new Date(params.commuEndTime);
            }

            if(params.qq) {
                doc.qq = params.qq;
            }

            doc.save(function(err) {
                if(err) {
                    logger.log('crm.wehcat.batchRecord.edit.save error:' + err.stack);
                    res.json(500, {err: err.stack});
                }else {
                    res.json({msg :{type : dictionary.resMsgType.succ, body : '修改成功'}});
                }
            });
        }
    })
};

exports.momentsMsg = function(req, res) {
    var momentsMsgTypeList = dictModel.getDictByType(dictionary.dictTypes.momentsMsgType);

    wechatAccountDao.findAll(function(err, docs) {
        if(err) {
            logger.log('crm.wehcat.batchRecord.momentsMsg error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            var accounts = [];
            _.each(docs, function(value) {
                var account = {};
                account.code = value.code;
                accounts.push(account);
            });
            res.json({accounts: accounts, momentsMsgTypeList: momentsMsgTypeList, userId: req.session.user._id})
        }
    })
};

exports.momentsMsgAdd = function(req, res) {
    var params = req.body;
    params.wechatNos = params.wechatNos.split(',');
    var imageNames = [];
    if(params.refObj.imageNames) {
        imageNames = params.refObj.imageNames.split(',');
        delete params.refObj.imageNames;
    }

    var imageUrls = '';

    var picturePath = G.HOST + G.MOMENTS_PICTURE_PATH;
    _.each(imageNames, function(value, key) {
        if(key == 0) {
            imageUrls = picturePath + value;
        }else {
            imageUrls += ',' + picturePath + value;
        }
    });

    if(!_.isEmpty(imageNames)) {
        params.refObj.imageUrls = imageUrls;
    }

    var steps = {};

    params.cuserid = req.session.user._id;

    steps.moments = function(next) {
        wechatMomentsDao.add(params, next);
    };

    steps.task = ['moments', function(next, data) {
        var moments = data.moments;
        var momentsTasks = [];
        if(!_.isEmpty(moments)) {
            var saveTasks = {};
            _.each(params.wechatNos, function(value) {
                saveTasks['saveTask' + value] = function (atomCb) {
                    var wechatTask = {};
                    wechatTask.wechatNo = value;
                    wechatTask.type = dictionary.wechatTaskRefType.shareMoments;
                    wechatTask.done = false;
                    wechatTask.priority = 2;
                    wechatTask.cuserid = req.session.user._id;
                    wechatTask.ctime = new Date();
                    wechatTask.refObj = {};
                    wechatTask.refObj.type = moments.type;
                    wechatTask.refObj.content = moments.refObj.content;
                    if(moments.type == 'image') {
                        wechatTask.refObj.taskNo = moments.refObj.dir;

                        wechatTask.refObj.address = moments.refObj.imageUrls;
                    }else if(moments.type == 'url') {
                        wechatTask.refObj.title = moments.refObj.title;
                    }
                    wechatTaskDao.add(wechatTask, function (err, doc) {
                        if (!err) {
                            momentsTasks.push(doc);
                        }
                        atomCb(null, true);
                    });
                }
            });
            async.parallel(saveTasks, function(err, result) {
                if(err) {
                    next(err)
                }else {
                    next(null, momentsTasks);
                }
            });
        }else {
            next(null, false);
        }
    }];

    steps.sendOnlineMsg = ['task', function(next, data) {
        if(data.task) {
            _.each(data.task, function(doc) {
                sender.sendTaskForClientByRoom(sio, 'wechat-client:' + doc.wechatNo, doc._doc);
            });
        }
        next(null);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.wechat.momentsMsgAdd error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg :{type : dictionary.resMsgType.succ, body : '添加成功!'}});
        }
    })
};

exports.momentsMsgTable = function(req, res) {
    var pagination = new Pagination(req);

    if(pagination.condition.momentsMsgType) {
        pagination.condition.type = pagination.condition.momentsMsgType;
        delete pagination.condition.momentsMsgType;
    }
    wechatMomentsDao.client.findByPage(pagination, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.momentsMsgTable error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            var momentsMsgList = _.pluck(docs, '_doc');
            _.each(momentsMsgList, function(value){
                var type = dictModel.getDictByTypeAndKey(dictionary.dictTypes.momentsMsgType, value.type);
                if(type) {
                    value.typeName = type.name;
                }else {
                    value.typeName = "";
                }
            });
            res.json({data : docs, pagination : pagination});
        }
    })
};


exports.uploadImage  = function(req, res) {
    var momentsPicturePath = G.WECHAT_CONTACT_MOMENTS_PICTURE_PATH;
    var momentsThumbnailPath = G.WECHAT_CONTACT_MOMENTS_THUMBNAIL_PATH;

    var files = req.files;
    //console.log(files);
    var process = {};
    _.each(files, function(value, key) {
        var steps = {};
        var thumbnailPath = '';
        var imgId = '';
        var renamePath = '';
        process['task_'+key] = function(cb) {

            steps.imgId = function(next) {
                idg.next(galleryDao.client.collection.name, next)
            };

            steps.renamePicture = ['imgId', function(next, data) {
                imgId = data.imgId.toString();
                renamePath = momentsPicturePath + imgId + '.jpg';

                fs.rename(value.path, renamePath, next);
            }];

            steps.thumbnail = ['renamePicture', function(next, data) {
                thumbnailPath = momentsThumbnailPath + imgId + '.jpg';
                gm(renamePath).thumb(100, 100, thumbnailPath, 0, next);
            }];

            steps.add = ['thumbnail', function(next, data) {
                var gallery = {};
                gallery.cuserid = req.session.user._id;
                gallery.name = imgId + '.jpg';
                gallery._id = parseInt(imgId);
                gallery.type = dictionary.galleryType.wechatMoment;
                galleryDao.client(gallery).save(next);
            }];
            async.auto(steps, cb);
        };
    });
    async.parallel(process, function(err, result) {
        if(err) {
            logger.debug('crm.wechat.batchRecord.uploadImage errror:'+ err.stack);
            res.json(500, {err: err.stack});
        }
        res.json({msg :{type : dictionary.resMsgType.succ, body : '上传成功!'}});
    })
};

exports.imageList = function(req, res) {
    var pagination = new Pagination(req);
    pagination.condition.type = dictionary.galleryType.wechatMoment;
    galleryDao.client.findByPage(pagination, function(err, data) {
        if(err) {
            logger.debug('crm.wechat.imageList error:'+ err.stack);
            res.json(500, {err: err.stack});
        }else {
            var imageList = _.pluck(data, '_doc');
            var images = new Array();
            _.each(imageList, function(value, key) {
                var index = parseInt(key/6);
                if(key % 6 == 0) {
                    images[index] = new Array();
                }
                var image = {};
                image.path = G.HOST + G.MOMENTS_THUMBNAIL_PATH + value.name;
                image.name = value.name;
                images[index].push(image);
            });
            res.json({pagination: pagination, images: images});
        }
    })
};


exports.deviceAdd =function(req, res) {
    var params = req.body;
    params.cuserid = req.session.user._id;
    params.cusername = req.session.user.username;
    params.crealName = req.session.user.realName;

    var steps = {};

    steps.isExsit = function(next) {
        wechatDeviceDao.findOne(params, next);
    };

    steps.add = ['isExsit', function(next, data) {
        if(_.isEmpty(data.isExsit)) {
            wechatDeviceDao.add(params, next);
        }else {
            next(null, false);
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.debug('crm.wechat.batchRecord.deviceAdd error:'+ err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(result.add) {
                res.json({msg :{type : dictionary.resMsgType.succ, body : '添加成功!'}});
            }else {
                res.json({msg :{type : dictionary.resMsgType.succ, body : '设备编号已存在，添加失败!'}});
            }
        }
    })
};

exports.deviceTable = function(req, res) {
    var pagination = new Pagination(req);

    wechatDeviceDao.client.findByPage(pagination, function(err, doc){
        if(err) {
            logger.error('crm.wehcat.batchRecord.deviceTable error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({pagination: pagination, devices: doc});
        }
    })
};

exports.HNWC = function(req, res) {
    var user = req.session.user;

    var steps = {};

    steps.divices = function(next) {
        wechatDeviceDao.find({}, next);
    };

    steps.wechatAccounts = function(next) {
        wechatAccountDao.find({commuUserId: user._id}, next);
    };


    async.auto(steps, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.HNWCManage error:'+ err.stack);
            res.json(500, {err: err.stack});
        }else {
            var custRateTypes = dictModel.getDictByType(dictionary.dictTypes.customRateType);
            res.json({wechatAccounts: docs.wechatAccounts, custRateTypes: custRateTypes,divices: docs.divices});
        }
    });
};

exports.contactsTel = function(req, res) {
    var accountId = req.param('accountId');

    wechatAccountContactDao.find({'belongAccount.accountId': accountId}, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.batchRecord.contactsTel error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({contacts: docs});
        }
    })
};

exports.HNWCTable = function(req, res) {
    var pagination = new Pagination(req);
    pagination.condition.cuserid = req.session.user._id;

    if(pagination.condition.accountId) {
        pagination.condition.accountId = parseInt(pagination.condition.accountId);
    }
    pagination.sort.ctime = -1;
    wechatHNWCDao.client.findByPage(pagination, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.batchRecord.HNWCTable error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            var wechatHNECs = _.pluck(docs, '_doc');
            async.map(wechatHNECs, function(value, cb) {
                var custRateTypes = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customRateType, value.rate);
                if(!_.isEmpty(custRateTypes)) {
                    value.custRateTypeName = custRateTypes.name;
                }
                wechatAccountDao.findOne({_id: value.accountId}, function(err, doc) {
                    if(err) {
                        cb(err);
                    }else {
                        value.deviceName = doc.deviceName;
                        cb(null, value);
                    }
                })
            }, function(err, result) {
                if(err) {
                    logger.error('crm.wechat.batchRecord.HNWCTable error:' + err.stack);
                    res.json(500, {err: err.stack});
                }
                res.json({pagination: pagination, wechatHNECs: result});
            });

        }
    });
};

exports.addHNWC = function(req, res) {
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;

    var steps = {};

    steps.wechatAccount = function(next) {
      wechatAccountDao.findOne({_id: parseInt(params.accountId)}, next)
    };

    steps.add = ['wechatAccount', function(next, data) {
        if(!_.isEmpty(data.wechatAccount)) {
            params.deviceNo = data.wechatAccount.deviceNo;
            params.deviceName = data.wechatAccount.deviceName;
        }
        wechatHNWCDao.add(params, next);
    }];

    async.auto(steps, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.batchRecord.addHNWC error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg :{type : dictionary.resMsgType.succ, body : '添加成功!'}});
        }
    });
};

exports.editHNWCList = function(req, res) {
    var id = parseInt(req.query.id);

    var steps = {};
    steps.wechatAccounts = function(next) {
        wechatAccountDao.find({commuUserId: req.session.user._id}, next);
    };

    steps.wechatHNWC = function(next) {
        wechatHNWCDao.findById(id, next);
    };

    async.auto(steps, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.batchRecord.editHNWC error: '+ err.stack);
            res.json(500, {err: err.stack});
        }else {
            var custRateTypes = dictModel.getDictByType(dictionary.dictTypes.customRateType);
            res.json({wechatHNWC: docs.wechatHNWC, custRateTypes: custRateTypes, wechatAccounts: docs.wechatAccounts})
        }
    });
};

exports.editHNWC = function(req, res) {
    var params = req.body;
    var id = parseInt(params.id);

    wechatHNWCDao.updateById(id, params, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.batchRecord.editHNWC error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg :{type : dictionary.resMsgType.succ, body : '更新成功!'}});
        }
    })
};

exports.HNWCDetail = function(req, res) {
    var id = parseInt(req.query.id);
    var tag = req.query.tag;

    var steps = {};

    steps.rms = function(next) {
        userDao.find({_id: {$in: [31, 355]}}, next);
    };

    steps.wechatHNWC = function(next) {
        wechatHNWCDao.findById(id, next);
    };

    async.auto(steps, function(err, doc) {
        if(err) {
            logger.error('crm.wechat.batchRecord.HNWCDetail error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            var wechatHNWC = doc.wechatHNWC;
            var rms = _.pluck(doc.rms, '_doc');
            wechatAccountDao.findOne({_id: wechatHNWC.accountId}, function(err, result) {
                if(err) {
                    logger.error('crm.wechat.batchRecord.HNWCDetail error:' + err.stack);
                    res.json(500, {err: err.stack});
                }else {
                    wechatHNWC._doc.deviceName = result.deviceName;
                    var custRateType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customRateType, wechatHNWC.rate);
                    if(!_.isEmpty(custRateType)) {
                        wechatHNWC._doc.rateName = custRateType.name;
                    }else {
                        wechatHNWC._doc.rateName = '未知';
                    }
                    res.json({wechatHNWC: wechatHNWC, rms: rms, tag: tag});
                }
            })
        }
    })
};

exports.addAppointManage = function(req, res) {
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.isDone = dictionary.isDoneType.unfinished;
    wechatAppointDao.add(params, function(err, result) {
        if(err) {
            logger.error('crm.wechat.batchRecord.addAppointManage error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg :{type : dictionary.resMsgType.succ, body : '添加成功!'}});
        }
    })
};

exports.appointManageList = function(req, res) {
    var pagination = new Pagination(req);

    var steps = {};
    steps.rms = function(next) {
        userDao.find({_id: {$in: [31, 355]}}, next);
    };

    steps.wechatAppoints = function(next) {
        wechatAppointDao.client.findByPage(pagination, next);
    };

    async.auto(steps, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.batchRecord.appointManageList error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            var wechatAppoints = _.pluck(docs.wechatAppoints, '_doc');
            var rms = _.pluck(docs.rms, '_doc');
            _.each(wechatAppoints, function(value) {
                var meetType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerMeetType, value.meetType);
                if(!_.isEmpty(meetType)) {
                    value.meetTypeName = meetType.name;
                }else {
                    value.meetTypeName = '未知';
                }
                var addressType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerAddressType, value.addressType);
                if(!_.isEmpty(addressType)) {
                    value.addressTypeName = addressType.name;
                }else {
                    value.addressTypeName = '未知';
                }
                var isDoneType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.isDoneType, value.isDone);
                if(!_.isEmpty(isDoneType)) {
                    value.doneTypeName = isDoneType.name
                }else {
                    value.doneTypeName = '未知';
                }
                var rm = _.findWhere(rms, {_id: value.rm});
                value.rmInfo = rm.username + '-' + rm.realName;
                value.appointDate = moment(value.appointTime).format('YYYY-MM-DD HH:mm:ss');

            });
            res.json({pagination: pagination, wechatAppoints: wechatAppoints});
        }
    });
};

exports.appointResult = function(req, res) {
    var params = req.body;

    var id = parseInt(params.id);
    delete params.id;

    wechatAppointDao.updateById(id, params, function(err, result) {
        if(err) {
            logger.error('crm.wechat.batchRecord.appointResult error: ' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg :{type : dictionary.resMsgType.succ, body : '更新成功!'}});
        }
    })
};

exports.HNWCManage = function(req, res) {
    var steps = {};

    steps.divices = function(next) {
        wechatDeviceDao.find({}, next);
    };

    steps.wechatAccounts = function(next) {
        wechatAccountDao.find({}, next);
    };

    steps.commuWorkGroup = function(next) {
        workGroupDao.findById(4, next);
    };

    steps.commuUsers = ['commuWorkGroup', function(next, data) {
        if(!_.isEmpty(data.commuWorkGroup)) {
            var workers = data.commuWorkGroup.workers;
            var userIds = _.pluck(workers, 'userid');
            userDao.find({_id: {$in: userIds}}, next);
        }else {
            next(null, []);
        }
    }];

    async.auto(steps, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.HNWCManage error:'+ err.stack);
            res.json(500, {err: err.stack});
        }else {
            var custRateTypes = dictModel.getDictByType(dictionary.dictTypes.customRateType);
            res.json({wechatAccounts: docs.wechatAccounts, custRateTypes: custRateTypes,divices: docs.divices, commuUsers: docs.commuUsers});
        }
    });
};

exports.HNWCManageList = function(req, res) {
    var pagination = new Pagination(req);

    if(pagination.condition.accountId) {
        pagination.condition.accountId = parseInt(pagination.condition.accountId);
    }

    if(pagination.condition.cuserid) {
        pagination.condition.cuserid = parseInt(pagination.condition.cuserid);
    }

    pagination.sort.ctime = -1;
    wechatHNWCDao.client.findByPage(pagination, function(err, docs) {
        if(err) {
            logger.error('crm.wechat.batchRecord.HNWCTable error:' + err.stack);
            res.json(500, {err: err.stack});
        }else {
            var wechatHNECs = _.pluck(docs, '_doc');
            async.map(wechatHNECs, function(value, cb) {
                var custRateTypes = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customRateType, value.rate);
                if(!_.isEmpty(custRateTypes)) {
                    value.custRateTypeName = custRateTypes.name;
                }
                wechatAccountDao.findOne({_id: value.accountId}, function(err, doc) {
                    if(err) {
                        cb(err);
                    }else {
                        value.deviceName = doc.deviceName;
                        cb(null, value);
                    }
                })
            }, function(err, result) {
                if(err) {
                    logger.error('crm.wechat.batchRecord.HNWCTable error:' + err.stack);
                    res.json(500, {err: err.stack});
                }
                res.json({pagination: pagination, wechatHNECs: result});
            });

        }
    })
};




