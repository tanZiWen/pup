/**
 * Created by tanyuan on 11/14/14.
 */

var model = exports.model = require('./model');
var CustomerAdvancedOpLog = exports.client = model.crm_customer_advanced_op_log;
var idg = require('../../db/idg');


exports.add = function (params, cb) {
    idg.next(CustomerAdvancedOpLog.collection.name, function (err, result){
        if(err){
            cb(err);
        }
        else {
            params._id = result.toString();
            CustomerAdvancedOpLog(params).save(function(err){
                if(!err) {
                    cb(null, result);
                } else {
                    cb(err);
                }
            });
        }
    })
};