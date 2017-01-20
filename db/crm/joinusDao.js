/**
 * Created by tanyuan on 1/28/16.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var Joinus = exports.client = model.crm_joinus;
var idg = require('../../db/idg');

exports.add = function (dirObj, cb) {
    idg.next(Joinus.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = result.toString();
            if(!dirObj._id) {
                dirObj._id = parseInt(id);
            }
            Joinus(dirObj).save(function(err){
                if(!err) {
                    cb(null, dirObj);
                } else {
                    cb(err);
                }
            });
        }
    })
};

exports.findById = function(id, next) {
  Joinus.findById(id ,next);
};

exports.modify = function(where, params, next) {
    Joinus.update(where, params, next)
};
