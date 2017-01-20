/**
 * Created by wangnan on 14-6-16.
 */

var logger = require('../../lib/logFactory').getModuleLogger(module);
var orderDao = require('../../db/crm/orderDao');
var dictionary = require('../../lib/dictionary');
var dictModel = require('../portal/dictModel');
var Pagination = require('../../lib/Pagination');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');

/**
 * 客户成交记录请求
 * @param req
 * @param res
 */
exports.listData = function(req, res) {
    var pagination = new Pagination(req);
    orderDao.client.findByPage(pagination, function(err, docs) {
        if(err) {
            logger.error(err.stack);
            res.json({
                err : {msg : '查询成交记录异常'}
            });
        } else {
            var orderList = _.pluck(docs, '_doc');
            _.map(orderList, function(order) {
                order.ctimeStr = moment(order.ctime).format('YYYY-MM-DD');
                var dict = dictModel.getDictByTypeAndKey(
                    dictionary.dictTypes.orderStatus,
                    order.status
                );
                if(dict) {
                    order.statusName = dict.name;
                }
            });
            res.json({
                pagination : pagination,
                orderList : orderList
            });
        }
    });
};