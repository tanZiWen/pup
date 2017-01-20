/**
 * Created by wangnan on 14-6-9.
 */

var model = exports.model = require('./model');
var db = exports.db = model.db;
var CustomerServiceRecord = exports.client = model.crm_customer_service_record;
var idg = require('../../db/idg');

exports.add = function (params, cb) {
    idg.next(CustomerServiceRecord.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            var id = parseInt(result.toString());
            params._id = id;
            CustomerServiceRecord(params).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })

};
