/**
 * Created by wangnan on 14-7-11.
 */

var customerDao = require('../../db/crm/customerDao');
var customerHistoryDao = require('../../db/crm/customerHistoryDao');
var _ = require('underscore');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var idg = require('../../db/idg');


/**
 * 备份客户记录
 * @param optional
 *   customerId : 客户ID
 *   user : 当前登录用户
 *   operateType : 操作类型（由dictionary.customerHistoryOperateType定义）
 * @param next(err, customerHistory)
 */
exports.backupCustomer = function(optional, next) {

    if(!optional
        || !optional.customerId
        || !optional.user
        || !optional.user._id
        || !optional.user.username
        || !optional.operateType) {

        var msg = '缺少客户相关信息,不允许进行备份';
        var err = new Error(msg);
        logger.error('backupCustomer:' + msg + "/n" + err.stack);
        next(err);
    }

    customerDao.findById(optional.customerId, function(err, doc) {

        if(err) {
            logger.error('backupCustomer:查询客户信息异常:customerId=' + optional.customerId + "/n" + err.stack);
            next(err);
        } else if(_.isEmpty(doc)) {
            var msg = '客户"' + optional.customerId + '"不存在,无法备份';
            var err = new Error(msg);
            logger.error('backupCustomer:' + msg + "/n" + err.stack);
            next(err);
        }

        var customer = doc._doc;
        var customerHistory = _.clone(customer);
        customerHistory.hisId = customer._id;
        customerHistory._id = null;
        customerHistory.hisOperateType = optional.operateType;
        customerHistory.hisOperateTime = new Date();
        customerHistory.hisOperateUser = {};
        customerHistory.hisOperateUser.id = optional.user._id;
        customerHistory.hisOperateUser.username = optional.user.username;
        customerHistory.hisOperateUser.realName = optional.user.realName;


        customerHistoryDao.client.add(customerHistory, idg, function(err, hisDoc) {
            if(err) {
                logger.error('backupCustomer:保存客户备份信息异常:customerId=' + optional.customerId + "/n" + err.stack);
                next(err);
            } else {
                doc.preid = hisDoc._id;
                doc.save(function(err) {
                    if(err) {
                        logger.error('backupCustomer:关联客户历史备份异常:customerId='
                            + optional.customerId
                            + ', customerHistoryId=' + hisDoc._id
                            + "/n" + err.stack);
                        next(err);
                    } else {
                        next(null, hisDoc._doc);
                    }
                });
            }
        })
    });
};