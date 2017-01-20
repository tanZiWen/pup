/**
 *
 * User: wuzixiu
 * Date: 2/16/14
 * Time: 1:09 PM
 */

var tag = require('./tag');
var areaModel = require('../portal/areaModel');
var dictionary = require('../../lib/dictionary');
var _ = require('underscore');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var workGroupDao = require('../../db/upm/workgroupDao');
var userDao = require('../../db/upm/userDao');
var Pagination = require('../../lib/Pagination');

exports.getGroups = function (req, res) {

    workGroupDao.findByOrg(req.query.orgCode, function(err, docs) {
        if(err) res.json({data: []});
        else {
            res.json({data : docs});
        }
    });
};