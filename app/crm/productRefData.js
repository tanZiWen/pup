/**
 *
 * User: wuzixiu
 * Date: 2/11/14
 * Time: 4:39 PM
 */
var productRefDataDao = require('../../db/crm/productRefDataDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore');
    idg = require('../../db/idg'),
    Pagination = require('../../lib/Pagination'),
    eventReceiver = require('../../event/Receiver');

exports.dataList = function (req, res) {
    var pagination = new Pagination(req);
    productRefDataDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            res.json({data : docs, pagination : pagination});
        }
    });
};

exports.latestList = function (req, res) {
    productRefDataDao.getLatestRecords(req.query.id, function(err, result) {
        if(err) res.json(500, {err : err.stack});
        else {
            res.json({data : result});
        }
    });
};

exports.create = function (req, res) {
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.minPeriod = parseInt(params.minPeriod);
    params.maxPeriod = parseInt(params.maxPeriod);



    productRefDataDao.create(params, user, function(err, result) {
        if(!err) {
            //TODO save orderPRDSign record
            res.json({msg : {type : dictionary.resMsgType.succ, body : '添加成功'}});
        }else {
            res.json({msg : {type : dictionary.resMsgType.error, body : '添加失败'}});
        }
    });
};
