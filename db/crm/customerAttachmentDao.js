/**
 * Created by wangnan on 14-6-9.
 */

var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var G = require('../../lib/global');
var async = require('async');
var fs = require('fs'),
    nfs = require('node-fs');
var CustomerAttachment = exports.client = model.crm_customer_attachment;

exports.create = function(req, params, cb){
    var tmpPath = G.UPLOAD_TMP_PATH + req.code.name;
    var tasks = {};
    tasks.mkdir = function(next) {
        nfs.mkdir(G.CUS_ATTACHMENT_PATH, 511, true, next);
    }

    tasks.id = function(next) {
        idg.next(CustomerAttachment.collection.name, next);
    }

    tasks.rename = ['mkdir','id', function(next, data) {
        var id = parseInt(data.id.toString()),
            path = G.CUS_ATTACHMENT_PATH;
        params._id = id;
        params.code = id;
        params.extension = req.code.extension;
        var destPath = path + id + "." + req.code.extension;
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
            CustomerAttachment(params).save(next);
        } else {
            next('upload failed', null);
        }
    }];

    async.auto(tasks, cb);
}