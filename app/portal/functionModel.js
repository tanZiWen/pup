/**
 * Created by tanyuan on 8/5/14.
 */


var model = exports.model = require('../../db/upm/model'),
    functionDao = require('../../db/upm/functionDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore');

init();

var functions = [];

function init() {
    functionDao.findAll(function(err, result) {
        if(err) {
            callback(err, null);
        }else {
            try{
                functions = result;
            }catch(e) {
            }
        }
    })
}

exports.getFunctionByCode = function (code) {
    var fun = {};
    _.each(functions, function(key, value) {
        if(key.code == code) {
            fun =key;
        }
    });
    return fun;
}










