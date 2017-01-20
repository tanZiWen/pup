
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

var dictionary = require('./../lib/dictionary.js'),
    idg = require('../db/idg.js'),
    sender = require('../routes/sender.js');

//基本的数据库操作(增删改)
exports.handleMsg = function(io, models, task, msg, next) {
    //var msg = {'type' : 'db', body: {model: 'product', type: 'update', data: {_id:10001, name: '123'}}};
    var CollectionModel = models[msg.body.model];
    var model = new CollectionModel(msg.body.data);
    if(msg.body['type'] == dictionary.dbAction.save) {
        model.save(function(err, result) {
            next(err, task._id);
        });
    } else if(msg.body['type'] == dictionary.dbAction.update) {
        var objId = msg.body._id;
        delete msg.body._id;
        models[msg.body.model].update({_id: objId}, msg.body.body, function(err, result) {
            next(err, task._id);
        });
    } else if(msg.body['type'] == dictionary.dbAction.del) {
        model.remove(function(err, result) {
            next(err, task._id);
        });
    } else {
        next(null, task._id);
    }
};



