/**
 * Created by tanyuan on 6/10/14.
 */


var tag = require('./tag');
var areaModel = require('../portal/areaModel');
var dictModel = require('../portal/dictModel');
var orgModel = require('../portal/orgModel');
var dictionary = require('../../lib/dictionary');
var _ = require('underscore');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var customerDao = require('../../db/crm/customerDao');
var callListRequestDao = require('../../db/crm/callListRequestDao');
var Pagination = require('../../lib/Pagination');
var dictModel = require('../portal/dictModel');


exports.list = function(req, res){
    var data = {}
    var levelList = dictModel.getDictByType(dictionary.dictTypes.customerDataLevel);
    data.levelList = levelList;
    res.json(data);
};
exports.dataList = function(req, res){
    var pagination = new Pagination(req);
    var user = req.session.user;
    pagination.condition.cuserid = user._id;
    callListRequestDao.model.findByPage(pagination, function(err, docs){
        if(err) res.json(500, {err : err.stack});
        else {
            _.each(docs, function(callListRequest) {
                var dataLevel = dictModel.getDictByTypeAndKey(dictionary.dictTypes.customerDataLevel, callListRequest.level);
                if(dataLevel) {
                    callListRequest._doc.levelName = dataLevel.name;
                }else {
                    callListRequest._doc.levelName = "";
                }
            })
            res.json({data : docs, pagination : pagination});
        }

    });
};

exports.create = function(req, res){
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.status =  dictionary.callListRequestStatus.unassigned;
    params.count = parseInt(params.count);
    params.ctime = Date.now();
    callListRequestDao.add(params, function(err, result) {
        if(!err) {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '添加成功'}});
        }else {
            res.json({msg : {type : dictionary.resMsgType.error, body : '添加失败'}});
        }
    });
};

exports.unassignCount = function(req, res) {
    var data = {};
    callListRequestDao.count({status : dictionary.callListRequestStatus.unassigned}, function(err, count) {
        data.requestCount = count;
        res.json(data);
    })
}

exports.view = function(req, res) {
    var id = req.params.id;
    callListRequestDao.findWithWorkGroupById(id, function(err, result) {
        if(err) {
            res.json({msg :{type : dictionary.resMsgType.error, body : '查找失败'}});
        } else {
            //console.log(result);
            res.json({msg :{type : dictionary.resMsgType.succ, body : result}});
        }
    });
}

exports.delete = function(req, res) {
    var id = req.params.id;
    callListRequestDao.cancel(id, function(err, result) {
        if(err) {
            res.json({msg :{type : dictionary.resMsgType.error, body : '取消失败，请重试'}});
        } else {
            callListRequestDao.count({status : dictionary.callListRequestStatus.unassigned}, function(err, count) {
                if(err) {
                    res.json({msg :{type : dictionary.resMsgType.succ, body : '操作成功', count : 0}});
                } else {
                    res.json({msg :{type : dictionary.resMsgType.succ, body : '操作成功', count : count}});
                }
            })
        }
    });
}
