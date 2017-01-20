/**
 * Created by wangnan on 14-4-21.
 */

var dbHelper = require('../mongodbHelper');
var define = require('./definition');
var appCfg = require('../../app.cfg');
var db = dbHelper.createDB(appCfg.mongodb.crm);
var _ = require('underscore');
var async = require('async');
var mongoosExtention = require('../mongoosExtension');

mongoosExtention.extendStatic(define);

exports.db = db;
exports.crm_employee = db.model('crm_employee', define.crm_employee, 'crm_employee');
exports.crm_product = db.model('crm_product', define.crm_product, 'crm_product');
exports.crm_product_trend = db.model('crm_product_trend', define.crm_product_trend, 'crm_product_trend');
exports.crm_product_ref_data = db.model('crm_product_ref_data', define.crm_product_ref_data, 'crm_product_ref_data');
exports.crm_product_attachment = db.model('crm_product_attachment', define.crm_product_attachment, 'crm_product_attachment');
exports.crm_customer = db.model('crm_customer', define.crm_customer, 'crm_customer');
exports.crm_customer_history = db.model('crm_customer_history', define.crm_customer_history, 'crm_customer_history');
exports.crm_tag = db.model('crm_tag', define.crm_tag, 'crm_tag');
exports.crm_order = db.model('crm_order', define.crm_order, 'crm_order');
exports.crm_orderPRDSign = db.model('crm_orderPRDSign', define.crm_orderPRDSign, 'crm_orderPRDSign');
exports.crm_customer_service_record = db.model('crm_customer_service_record', define.crm_customer_service_record, 'crm_customer_service_record');
exports.crm_customer_action_plan = db.model('crm_customer_action_plan', define.crm_customer_action_plan, 'crm_customer_action_plan');
exports.crm_customer_attachment = db.model('crm_customer_attachment', define.crm_customer_attachment, 'crm_customer_attachment');
exports.crm_callList_request = db.model('crm_callList_request', define.crm_callList_request, 'crm_callList_request');
exports.crm_customerImpl_batch = db.model('crm_customerImpl_batch', define.crm_customerImpl_batch, 'crm_customerImpl_batch');
exports.crm_customer_audit_record = db.model('crm_customer_audit_record', define.crm_customer_audit_record, 'crm_customer_audit_record');
exports.crm_message = db.model('crm_message', define.crm_message, 'crm_message');
exports.crm_msgTask = db.model('crm_msgTask', define.crm_msgTask, 'crm_msgTask');
exports.crm_task = db.model('crm_task', define.crm_task, 'crm_task');

exports.crm_recording = db.model('crm_recording', define.crm_recording, 'crm_recording');


exports.crm_wechat_account = db.model('crm_wechat_account', define.crm_wechat_account, 'crm_wechat_account');
exports.crm_wechat_account_contact = db.model('crm_wechat_account_contact', define.crm_wechat_account_contact, 'crm_wechat_account_contact');
exports.crm_wechat_account_group = db.model('crm_wechat_account_group', define.crm_wechat_account_group, 'crm_wechat_account_group');
exports.crm_wechat_task = db.model('crm_wechat_task', define.crm_wechat_task, 'crm_wechat_task');
exports.crm_wechat_msg = db.model('crm_wechat_msg', define.crm_wechat_msg, 'crm_wechat_msg');
exports.crm_wechat_user_msg = db.model('crm_wechat_user_msg', define.crm_wechat_user_msg, 'crm_wechat_user_msg');
exports.crm_wechat_batch_add_record = db.model('crm_wechat_batch_add_record', define.crm_wechat_batch_add_record, 'crm_wechat_batch_add_record');
exports.crm_wechat_account_telNo = db.model('crm_wechat_account_telNo', define.crm_wechat_account_telNo, 'crm_wechat_account_telNo');
exports.crm_wechat_attent_nearby = db.model('crm_wechat_attent_nearby', define.crm_wechat_attent_nearby, 'crm_wechat_attent_nearby');
exports.crm_wechat_moments = db.model('crm_wechat_moments', define.crm_wechat_moments, 'crm_wechat_moments');
exports.crm_wechat_customer = db.model('crm_wechat_customer', define.crm_wechat_customer, 'crm_wechat_customer');
exports.crm_wechat_account_operate = db.model('crm_wechat_account_operate', define.crm_wechat_account_operate, 'crm_wechat_account_operate');


exports.crm_import_customer = db.model('crm_import_customer', define.crm_import_customer, 'crm_import_customer');
exports.crm_wechat_telNo = db.model('crm_wechat_telNo', define.crm_wechat_telNo, 'crm_wechat_telNo');

exports.crm_customer_giveup_user = db.model('crm_customer_giveup_user', define.crm_customer_giveup_user, 'crm_customer_giveup_user');
exports.crm_sys_message = db.model('crm_sys_message', define.crm_sys_message, 'crm_sys_message');
exports.crm_customer_advanced_op_log = db.model('crm_customer_advanced_op_log', define.crm_customer_advanced_op_log, 'crm_customer_advanced_op_log');
exports.crm_gallery = db.model('crm_gallery', define.crm_gallery, 'crm_gallery');
exports.crm_wechat_device = db.model('crm_wechat_device', define.crm_wechat_device, 'crm_wechat_device');
exports.crm_wechat_hnwc = db.model('crm_wechat_hnwc', define.crm_wechat_hnwc, 'crm_wechat_hnwc');
exports.crm_wechat_appoint = db.model('crm_wechat_appoint', define.crm_wechat_appoint, 'crm_wechat_appoint');

exports.crm_gallery_dir = db.model('crm_gallery_dir', define.crm_gallery_dir, 'crm_gallery_dir');
exports.crm_joinus = db.model('crm_joinus', define.crm_joinus, 'crm_joinus');