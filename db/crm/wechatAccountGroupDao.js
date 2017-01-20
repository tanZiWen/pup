/**
 * Created by wangnan on 14-6-3.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var WechatAccountGroup = exports.client = model.crm_wechat_account_group;

exports.find = function(where, cb) {
    WechatAccountGroup.find(where, cb);
}