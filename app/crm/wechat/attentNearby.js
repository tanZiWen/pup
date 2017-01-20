
var dictModel = require('../../portal/dictModel'),
    Pagination = require('../../../lib/Pagination');
var attentNearbyDao = require('../../../db/crm/attentNearbyDao');
var wechatAccountDao = require('../../../db/crm/wechatAccountDao');
var wechatTaskDao = require('../../../db/crm/wechatTaskDao');

var sender = require('../../../routes/sender.js');

var sioHelper = require('../../../lib/sioHelper')

var dictionary = require('../../../lib/dictionary');
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

exports.attentNearbyList = function(req, res) {
    var data = {};
    wechatAccountDao.find({contacts : {$exists : true}}, function(err, docs) {
        if(err) {
            data.accounts = [];
        } else {
            data.accounts = docs;
        }
        res.json(data);
    });
}

exports.attentNearbyDataList = function(req, res) {
    var pagination = new Pagination(req);
    attentNearbyDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            _.each(docs, function(callListRequest) {
                callListRequest._doc.posValue = JSON.stringify(callListRequest.pos);
            });
            res.json({data : docs, pagination : pagination});
        }
    });
}

exports.create = function(req, res) {
    var user = req.session.user;

    var attentNearbyData = {};
    attentNearbyData.posComment = req.body.posComment;
    attentNearbyData.pos = [parseFloat(req.body.long), parseFloat(req.body.lat)];
    attentNearbyData.count = req.body.count;
    attentNearbyData.cuserid = user._id;
    attentNearbyData.cusername = user.username;
    attentNearbyData.crealName = user.realName;
    attentNearbyData.ctime = new Date();

    var steps = {};

    steps.wehatAccount = function(next) {
        wechatAccountDao.client.findById(req.body.accountId, next);
    }

    steps.saveAttentNearby = ['wehatAccount', function(next, data) {
        attentNearbyData.accountId = data.wehatAccount._id;
        attentNearbyData.accountNickname = data.wehatAccount.nickname;
        attentNearbyData.accountCode = data.wehatAccount.code;
        attentNearbyDao.add(attentNearbyData, next);
    }];

    steps.saveWechatTask = ['saveAttentNearby', 'wehatAccount', function(next, data) {

        var wechatTask = {};
        wechatTask.wechatNo = data.wehatAccount.code;
        wechatTask.type = dictionary.wechatTaskRefType.attentNearbyPeople;
        wechatTask.done = false;
        wechatTask.priority = 2;
        wechatTask.cuserid = user._id;
        wechatTask.ctime = new Date();
        wechatTask.refObj = {count : req.body.count, validateMsg : req.body.validateMsg};
        wechatTaskDao.add(wechatTask, next);
    }];

    steps.sendOnlineMsg = ['saveWechatTask', 'wehatAccount', function(next, data) {
        var sio = sioHelper.get();
        sender.sendTaskForClientByRoom(sio, 'wechat-client:' + data.saveWechatTask.wechatNo, data.saveWechatTask);
        next(null);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json({msg : {type : dictionary.resMsgType.error, body : '添加失败'}});
        } else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '添加成功'}});
        }
    });

}





