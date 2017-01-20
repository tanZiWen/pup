/**
 * Created by tanyuan on 1/28/16.
 */

var dictionary = require('../../lib/dictionary.js');
var dictModel = require('../portal/dictModel');
var _ = require('underscore');
var joinusDao = require('../../db/crm/joinusDao');
var Pagination = require('../../lib/Pagination');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var postgreHelper = require('../../db/postgreHelper');


exports.list = function(req, res) {
    var officeTypes = dictModel.getDictByType(dictionary.dictTypes.officeType);
    res.json({officeTypes: officeTypes});
};

exports.dataList = function(req, res) {
    var pagination = new Pagination(req);
    joinusDao.client.findByPage(pagination, function(err, docs) {
        if(err) {
            logger.error('crm.joinus.dataList error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            _.each(docs, function(value) {
                var office = dictModel.getDictByTypeAndKey(dictionary.dictTypes.officeType, value.officeCode);
                if(!_.isEmpty(office)) {
                    value._doc.officeName = office.name;
                }
            });
            res.json({docs: docs, pagination: pagination});
        }
    });
};

exports.add = function(req, res) {
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;

    params.responsibilities = params.responsibilities.replace(/[\r]/g, '<br/>');
    params.qualification = params.qualification.replace(/[\r]/g, '<br/>');
    var steps = [];

    steps[0] = function(next) {
        joinusDao.add(params, next);
    };

    steps[1] = function(data, next) {
        var query = 'insert into t_joinus (id, office_code, position, responsibilities, qualification, priority, crt, lut) values ($1, $2, $3, $4, $5, $6, $7, $8)';
        postgreHelper.websiteQuery(query, [data._id, params.officeCode, params.position, params.responsibilities, params.qualification, params.priority, new Date(), new Date()], next);
    };

    async.waterfall(steps, function(err, result) {
        if(err) {
            logger.error('crm.joinus.add error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '添加成功!'}})
        }
    });
};

exports.modifyData = function(req, res) {
    var id = req.param('id');
    joinusDao.findById(id, function(err, result) {
        if(err) {
            logger.error('crm.joinus.add error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            var officeTypes = dictModel.getDictByType(dictionary.dictTypes.officeType);
            result.responsibilities = result.responsibilities.replace(/[<br/>]/g, '');
            result.qualification = result.qualification.replace(/[<br/>]/g, '');
            res.json({joinus: result, officeTypes: officeTypes});
        }
    })
};

exports.modify = function(req, res) {
    var id = req.param('id');
    var params = req.body;

    var steps = {};

    steps.modifyLocal = function(next) {
        joinusDao.modify({_id: id}, params, next);
    };

    steps.modifyRemote = ['modifyLocal', function(next, data) {
        var query = 'update t_joinus set office_code=$2, position=$3, responsibilities=$4, qualification=$5, priority=$6, lut=$7 where id = $1';
        postgreHelper.websiteQuery(query, [id, params.officeCode, params.position, params.responsibilities, params.qualification, params.priority, new Date()], next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.joinus.modify error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '修改成功!'}})
        }
    });
};

exports.delete = function(req, res) {
    var id = req.param('id');

    var steps = {};

    steps.deleteLocal = function(next) {
        joinusDao.modify({_id: id}, {status: true}, next);
    };

    steps.deleteRemote = ['deleteLocal', function(next, data) {
        var query = "update t_joinus set del=$2, lut=$3 where id = $1";
        postgreHelper.websiteQuery(query, [id, true, new Date()], next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.joinus.delete error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '删除成功!'}})
        }
    });
};