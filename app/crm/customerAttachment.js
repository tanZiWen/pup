/**
 * Created by wangnan on 14-6-16.
 */

var logger = require('../../lib/logFactory').getModuleLogger(module);
var customerAttachmentDao = require('../../db/crm/customerAttachmentDao');
var userDao = require('../../db/upm/userDao');
var dictionary = require('../../lib/dictionary');
var dictModel = require('../portal/dictModel');
var Pagination = require('../../lib/Pagination');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var G = require('../../lib/global');
var mime = require('mime');

/**
 * 客户附件列表请求
 * @param req
 * @param res
 */
exports.listData = function(req, res) {
    var pagination = new Pagination(req);
    customerAttachmentDao.client
        .findByPage(pagination, function(err, docs) {
            if(err) {
                logger.error(err.stack);
                res.json({
                    err : {msg : '查询客户附件异常'}
                });
            } else {
                res.json({
                    pagination : pagination,
                    attachmentList : _.pluck(docs, '_doc')
                });
            }
        });
};

exports.download = function(req, res) {
    var id = req.param('id');
    customerAttachmentDao.client.findById(id, function(err, doc) {
        if(err) {
            logger.error(err.stack);
            res.setHeader('Content-disposition', 'attachment; filename=404');
            res.setHeader('Content-type', 'application/txt');
            res.end();
        } else {
            var filePath = G.CUS_ATTACHMENT_PATH + id + "." + doc.extension;
            fs.exists(filePath, function(exists) {
                if(exists) {
                    res.writeHead(200, {
                        'Content-Type':mime.lookup(filePath),
                        'Content-Type': 'application/octet-stream;charset=utf8',
                        'Content-Length': fs.statSync(filePath).size,
                        'Content-Disposition': "attachment;filename*=UTF-8''" + encodeURIComponent(doc.name + "." + doc.extension)
                    });
                    var fileStream = fs.createReadStream(filePath);
                    fileStream.pipe(res);
                    fileStream.on('end', function() {
                        res.end();
                    });
                } else {
                    logger.error('customer attachment not exists. id=' + id);
                    res.setHeader('Content-disposition', 'attachment; filename=404');
                    res.setHeader('Content-type', 'application/txt');
                    res.end();
                }
            });
        }
    });
};