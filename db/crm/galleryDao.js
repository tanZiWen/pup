/**
 * Created by tanyuan on 6/30/15.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Gallery = exports.client = model.crm_gallery;
var idg = require('../../db/idg');

exports.add = function (params, cb) {
    idg.next(Gallery.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            if(!params._id) {
                params._id = id;
            }
            Gallery(params).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
};
