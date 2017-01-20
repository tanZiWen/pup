/**
 * Created by wangnan on 14-6-13.
 */

var logger = require('../../lib/logFactory').getModuleLogger(module);
var customerServiceRecordDao = require('../../db/crm/customerServiceRecordDao');
var dictionary = require('../../lib/dictionary');
var dictModel = require('../portal/dictModel');
var Pagination = require('../../lib/Pagination');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var appCfg = require('../../app.cfg.js');

/**
 * 客户服务记录列表请求
 * @param req
 * @param res
 */
exports.listData = function(req, res) {

    console.log('request customerServiceRecord List Data...');

    var pagination = new Pagination(req);
    var steps = {};

    steps.customerServiceRecord = function(next) {
        customerServiceRecordDao.client
            .findByPage(pagination, function(err, docs) {
                if(err) {
                    logger.error(err.stack);
                    next(err);
                } else {
                    var recordList = [];
                    try {
                        recordList = _.pluck(docs, '_doc');
                        _.map(recordList, function(record) {
                            var dict = dictModel.getDictByTypeAndKey(
                                dictionary.dictTypes.customerServiceRecordType,
                                record.type
                            );
                            if(dict) {
                                record.typeName = dict.name;
                            } else {
                                record.typeName = '其它服务';
                            }

                            dict = dictModel.getDictByTypeAndKey(
                                dictionary.dictTypes.customerStatus,
                                record.customerStatus
                            );
                            if(dict) {
                                record.customerStatusName = dict.name;
                            } else {
                                record.customerStatusName = '未知';
                            }

                            dict = dictModel.getDictByTypeAndKey(
                                dictionary.dictTypes.customerCallStatus,
                                record.customerCallStatus
                            );
                            if(dict) {
                                record.customerCallStatusName = dict.name;
                            } else {
                                record.customerCallStatusName = '未知';
                            }

                            dict = dictModel.getDictByTypeAndKey(
                                dictionary.dictTypes.customerAuditStatus,
                                record.customerAuditStatus
                            );
                            if(dict) {
                                record.customerAuditStatusName = dict.name;
                            } else {
                                record.customerAuditStatusName = '未知';
                            }

                            record.callTimeStr = moment(record.ctime).format('HH:mm');
                            record.ctimeStr = moment(record.ctime).format('YYYY-MM-DD HH:mm');

                            dict = dictModel.getDictByTypeAndKey(
                                dictionary.dictTypes.customerBodyMass,
                                record.bodyMass
                            );
                            if(dict) {
                                record.bodyMassName = dict.name;
                            } else {
                                record.bodyMassName = '未知';
                            }

                            dict = dictModel.getDictByTypeAndKey(
                                dictionary.dictTypes.customerInvestmentPreference,
                                record.investmentPreference
                            );
                            if(dict) {
                                record.investmentPreferenceName = dict.name;
                            } else {
                                record.investmentPreferenceName = '未知';
                            }

                            return record;
                        });
                        recordList = _.pluck(docs, '_doc');

                    } catch(err) {
                        logger.error(err.stack);
                        next(err);
                    }
                    next(null, {pagination : pagination, list : recordList});
                }
            });
    };

    async.parallel(steps, function(err, result) {
        if(err) {
            res.json({
                err : {msg : '查询服务记录异常'}
            });
        } else {
            res.json({
                customerServiceRecordList : result.customerServiceRecord.list,
                pagination : result.customerServiceRecord.pagination,
                callCenter : appCfg.callCenter
            });
        }
    });
}