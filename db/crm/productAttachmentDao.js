/**
 * Created by michael on 14-5-26.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var dictionary = require('../../lib/dictionary');
var ProductAttachment = exports.client = model.crm_product_attachment;

var fs = require('fs'),
    nfs = require('node-fs');

var async = require('async');

var _ = require('underscore'),
    G = require('../../lib/global'),
    _s = require('underscore.string');

exports.model = ProductAttachment;

exports.latestNumber = 3;

exports.findById = function(id, cb) {
    ProductAttachment.findById(id, cb);
}


exports.create = function(req, productAttachment, cb) {
    var id = 0;
    var tmpPath = G.UPLOAD_TMP_PATH + req.files.attach.name;

    var tasks = {};

    tasks.mkdir = function(next) {
        nfs.mkdir(G.PROD_ATTACHMENT_PATH, 511, true, next);
    }

    tasks.id = function(next) {
        idg.next(ProductAttachment.collection.name, next);
    }

    tasks.rename = ['mkdir', 'id', function(next, data) {
        var id = parseInt(data.id.toString()),
            path = G.PROD_ATTACHMENT_PATH;
        productAttachment._id = id;
        productAttachment.code = id,
        productAttachment.extension = req.files.attach.extension;
        var destPath = path + id + "." + req.files.attach.extension;
        fs.rename(tmpPath, destPath, function(err) {
            if(err) {
                console.error("Failed to rename uploaded file: " + tmpPath + ' > ' + destPath + JSON.stringify(err));
                next(err);
            } else {
                next(null, true);
            }
        });
    }];

    tasks.save = ['rename', function(next, data) {
        if(data.rename == true) {
            //upload success

            ProductAttachment(productAttachment).save(next);
        } else {
            next('upload failed', null);
        }
    }];

    async.auto(tasks, cb);
}

exports.getLatestRecords = function(productId, where,  cb) {
    where.productId = productId;
    ProductAttachment.find(where, {}, {skip: 0, limit: this.latestNumber, sort: {ctime: -1}}, cb);
}