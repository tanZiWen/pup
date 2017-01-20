/**
 *
 * User: wuzixiu
 * Date: 2/14/14
 * Time: 4:39 PM
 */
var orderDao = require('../../db/crm/orderDao'),
    orderPRDSignDao = require('../../db/crm/orderPRDSignDao'),
    userDao = require('../../db/upm/userDao'),
    customerDao = require('../../db/crm/customerDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore');
    async = require('async');
    idg = require('../../db/idg'),
    Pagination = require('../../lib/Pagination'),
    dictModel = require('../portal/dictModel'),
    eventReceiver = require('../../event/Receiver');

exports.list = function (req, res) {
    var statusList = dictModel.getDictByType(dictionary.dictTypes.orderStatus);
    var typeList = dictModel.getDictByType(dictionary.dictTypes.productType);
    var data = {};
    data.typeList = typeList;
    data.statusList = statusList;
    res.json(data);
};

exports.dataList = function (req, res) {
    if(req.query.page.condition != undefined && req.query.page.condition.telNo != undefined) {
        req.query.page.condition = {'customer.telNo' : new RegExp(req.query.page.condition.telNo)};
    }
    var pagination = new Pagination(req);
    orderDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            _.each(docs, function(order) {
                var prdType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.productType, order.product.type);
                var prdStatus = dictModel.getDictByTypeAndKey(dictionary.dictTypes.orderStatus, order.status);
                if (prdType){
                    order._doc.product.typeName = prdType.name;
                } else {
                    order._doc.product.typeName = "";
                }
                if (prdStatus){
                    order._doc.statusName = prdStatus.name;
                } else {
                    order._doc.statusName = "";
                }
            });
            res.json({data : docs, pagination : pagination});
        }
    });
};

exports.dividendList = function(req, res) {
    orderDao.findById(parseInt(req.query.id), function(err, order){
        if (err) {
            res.json({data : []});
        } else {
            var sortData = _.sortBy(order.dividend, function(dividend) {
               return  dividend.ctime;
            });
            res.json({data : sortData.reverse()});
        }
    });
}


exports.modify = function (req, res) {
    var params = req.body;
    var user = req.session.user;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;
    params.utime = new Date();
    orderDao.modify(params, function(err, result) {
        if(!err) {
            res.json({type : dictionary.resMsgType.succ, body : '更新成功'});
        } else {
            res.json({type : dictionary.resMsgType.error, body : '更新失败'});
        }
    });
}

exports.remove = function (req, res) {
    var id = req.params.id;
    orderDao.delete(id, function(err, result) {
        if(err) {
            res.json({msg : {type : dictionary.resMsgType.error, body : '撤销失败'}});
        } else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '撤销成功'}});
        }
    });
}

exports.dividend = function(req, res) {
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.ctime = new Date();
    orderDao.dividend(params, function(err, result) {
        if(!err) {
            //TODO send message

            res.json({type : dictionary.resMsgType.succ, body : '派息成功'});
        } else {
            res.json({type : dictionary.resMsgType.error, body : '派息失败'});
        }
    });
}

exports.signList = function (req, res) {
    var statusList = dictModel.getDictByType(dictionary.dictTypes.orderPRDSign);
    var typeList = dictModel.getDictByType(dictionary.dictTypes.productType);
    var data = {};
    data.statusList = statusList;
    data.typeList = typeList;
    res.json(data);
}

exports.signDataList = function (req, res) {
    if(req.query.page.condition != undefined && req.query.page.condition['customer.telNo'] != undefined) {
        req.query.page.condition['customer.telNo'] = new RegExp(req.query.page.condition['customer.telNo']);
    }
    if(req.query.page.condition != undefined && req.query.page.condition['customer.name'] != undefined) {
        req.query.page.condition['customer.name'] = new RegExp(req.query.page.condition['customer.name']);
    }
    var user = req.session.user;

    if(req.query.page.condition != undefined) {
        if(user.position == dictionary.userPosition.consultant) {
            req.query.page.condition.productorSigned = dictionary.orderPRDSgin.signed;
        }
    } else {
        if(user.position == dictionary.userPosition.consultant) {
            req.query.page.condition = {productorSigned : dictionary.orderPRDSgin.signed};
        } else {
            req.query.page.condition = {};
        }
    }

    var pagination = new Pagination(req);
    if(user.position == dictionary.userPosition.consultant) {
        var steps = {};
        steps.getCustomers = function(next) {
            customerDao.find({belongUser : user._id}, next);
        }

        steps.getSignData = ['getCustomers', function(next, data) {
            var customers = data.getCustomers;
            var customerIds = _.pluck(customers, '_id');
            pagination.condition['customer.customerId'] = {$in : customerIds};
            orderPRDSignDao.model.findByPage(pagination, next);
        }];

        async.auto(steps, function(err, data) {
            if(err) res.json(500, {err : err.stack});
            else {
                _.each(data.getSignData, function(order) {
                    var prdType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.productType, order.product.type);
                    if (prdType){
                        order._doc.product.typeName = prdType.name;
                    } else {
                        order._doc.product.typeName = "";
                    }
                });
                res.json({data : data.getSignData, pagination : pagination, user : user});
            }
        });
    } else if(user.position == dictionary.userPosition.pm) {
        orderPRDSignDao.model.findByPage(pagination, function(err, docs) {
            if(err) res.json(500, {err : err.stack});
            else {
                _.each(docs, function(order) {
                    var prdType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.productType, order.product.type);
                    if (prdType){
                        order._doc.product.typeName = prdType.name;
                    } else {
                        order._doc.product.typeName = "";
                    }
                });
                res.json({data : docs, pagination : pagination, user : user});
            }
        });
    } else {
        res.json({data : [], pagination : pagination, user : user});
    }


}

exports.sign = function(req, res) {
    var id = req.query.id;
    var params = {};
    var user = req.session.user;
    params.signUserid = user._id;
    params.signUsername = user.username;
    params.signUserRealname = user.realName;
    params.signTime = new Date();
    if(user.position == dictionary.userPosition.pm) {
        params.productorSigned = dictionary.orderPRDSgin.signed;
        orderPRDSignDao.signForPM(id, params, function(err, result) {
            if(err) {
                res.json({msg : {type : dictionary.resMsgType.error, body : '签收失败'}});
            } else {
                //TODO send message to prd and RM

                res.json({msg : {type : dictionary.resMsgType.succ, body : '签收成功'}});
            }
        });
    } else if(user.position == dictionary.userPosition.consultant) {
        params.salesSigned = dictionary.orderPRDSgin.signed;
        orderPRDSignDao.signForConsultant(id, params, function(err, result) {
            if(err) {
                res.json({msg : {type : dictionary.resMsgType.error, body : '签收失败'}});
            } else {
                //TODO send message to prd and RM

                res.json({msg : {type : dictionary.resMsgType.succ, body : '签收成功'}});
            }
        });
    } else {
        res.json({msg : {type : dictionary.resMsgType.error, body : '该操作未授权，签收失败'}});
    }
}

exports.view = function(req, res) {
    orderDao.findById(parseInt(req.body.id), function(err, result){
        if(err) {
            res.json({msg :{type : dictionary.resMsgType.error, body : '查找失败'}});
        }else {
            res.json({msg :{type : dictionary.resMsgType.succ, body : result}});
        }
    });
}

exports.detail = function(req, res) {
    orderDao.findById(parseInt(req.query.id), function(err, order){
        if (err) {
            res.json({});
        } else {
            var prdType = dictModel.getDictByTypeAndKey(dictionary.dictTypes.productType, order.product.type);
            var prdStatus = dictModel.getDictByTypeAndKey(dictionary.dictTypes.orderStatus, order.status);
            if (prdType){
                order._doc.product.typeName = prdType.name;
            } else {
                order._doc.product.typeName = "";
            }
            if (prdStatus){
                order._doc.statusName = prdStatus.name;
            } else {
                order._doc.statusName = "";
            }
            res.json(order);
        }
    });
}