/**
 * Created by wangnan on 14-4-18.
 */

var dbHelper = require('../mongodbHelper');
var define = require('./definition');
var appCfg = require('../../app.cfg');
var db = dbHelper.createDB(appCfg.mongodb.upm);
var _ = require('underscore');
var mongoosExtention = require('../mongoosExtension');

mongoosExtention.extendStatic(define);

exports.db = db;
exports.upm_app = db.model('upm_app', define.upm_app, 'upm_app');
exports.upm_organization = db.model('upm_organization', define.upm_organization, 'upm_organization');
exports.upm_user = db.model('upm_user',define.upm_user, 'upm_user');
exports.upm_role = db.model('upm_role', define.upm_role, 'upm_role');
exports.upm_function = db.model('upm_function', define.upm_function, 'upm_function');
exports.upm_dictionary = db.model('upm_dictionary', define.upm_dictionary, 'upm_dictionary');
exports.upm_workgroup = db.model('upm_workgroup', define.upm_workgroup, 'upm_workgroup');
exports.upm_area = db.model('upm_area', define.upm_area, 'upm_area');
exports.upm_user_operate_log = db.model('upm_user_operate_log', define.upm_user_operate_log, 'upm_user_operate_log');