/**
 * Created by tanyuan on 10/15/15.
 */
var idg = require('../../db/idg');
var model = exports.model = require('./model');
var db = exports.db = model.db;
var GalleryDir = exports.client = model.crm_gallery_dir;

exports.add = function (dirObj, cb) {
    idg.next(GalleryDir.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = result.toString();
            if(!dirObj._id) {
                dirObj._id = parseInt(id);
            }
            GalleryDir(dirObj).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.getDirs = function(params, cb) {
    GalleryDir.find(params, cb);
};

exports.findOne = function(params, cb) {
    GalleryDir.findOne(params, cb);
};

exports.pushImageNames = function(params, updator, cb) {
    GalleryDir.update(params, {$pushAll: updator}, cb);
};