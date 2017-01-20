/**
 * Created by tanyuan on 11/25/14.
 */

var sysMessageDao = require('../../db/crm/sysMessageDao.js');
var dictionary = require('../../lib/dictionary.js');
var async = require('async');
var dictModel = require('../portal/dictModel');
var Pagination = require('../../lib/Pagination');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var moment = require('moment');
var sender = require('../../routes/sender');
var sioHelper = require('../../lib/sioHelper');


exports.list = function(req, res) {
    var isReadList = dictModel.getDictByType(dictionary.dictTypes.isRead);
    var sysMessageTypeList = dictModel.getDictByType(dictionary.dictTypes.sysMessageType);
    res.json({isReadList: isReadList, sysMessageTypeList: sysMessageTypeList});
};

exports.listTable = function(req, res) {
    var user = req.session.user;
    var pagination = new Pagination(req);
    var condition = pagination.condition;
    if(condition.sysMessageType) {
        condition.type = condition.sysMessageType;
        delete condition.sysMessageType;
    }
    if(condition.isRead) {
        condition.read = condition.isRead;
        delete condition.isRead;
    }

    condition['receiver.userid'] = user._id;

    pagination.sort = {sendTime: -1};
    sysMessageDao.client.findByPage(pagination, function(err, result) {
        if(err) {
            logger.error('crm.message.listTable error:' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            var doc = _.pluck(result, '_doc');
            _.each(doc, function(key) {
               if(key.type) {
                   key.typeName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.sysMessageType, key.type).name;
               } else {
                   key.typeName = '未知';
               }

                if(key.sendTime) {
                    key.sendTime = moment(key.sendTime).format('YYYY-MM-DD HH:mm');
                }else {
                    key.sendTime = '未知';
                }

                if(key.readTime) {
                    key.readTime = moment(key.readTime).format('YYYY-MM-DD HH:mm');
                }else {
                    key.readTime = '未知';
                }
            });
            res.json({sysMessageList: doc, pagination: pagination});
        }
    })
};

exports.content = function(req, res) {
    var id = req.param('id');
    var user = req.session.user;

    sysMessageDao.findById(id, function(err, doc) {
        if(err) {
            logger.error('crm.message.content.findById error: ' +err.stack);
            res.json(500, {err: err.stack});
        }else {
            doc.read = true;
            doc.readTime = new Date();
            doc.save(function(err, result) {
                if(err) {
                    logger.error('crm.message.content.save error: '+ err.stack);
                    res.json(500, {err: err.stack});
                }else {
                    sender.refreshMsgCountByUserIds(sioHelper.get(), [user._id], {});
                    res.json({sysMessage: result});
                }
            });
        }
    })
};
