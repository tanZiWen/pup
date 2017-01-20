
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

var pup = require('../db/pup.js'),
    dictionary = require('./dictionary.js'),
    idg = require('../db/idg.js'),
    sender = require('../routes/sender.js');

var sio;
var models = {};

var sioHolder = module.exports = exports = function(io) {
    sio = io;
}

_.each(pup, function(value, key) {
    if(typeof value === 'function' && value.name == 'model') {
        models[key] = value;
    }
});

exports.models = models;


exports.sendMsg = function(entity) {

    var models = exports.models;
    async.waterfall([
        function(next) {
            // save in db
            idg.next(pup.msgTask.collection.name, function (err, idBuf){
                if(err) console.log(err);
                else {
                    entity._id = parseInt(idBuf.toString());
                    entity.status = 0;
                    var MsgTaskModel = pup.msgTask;
                    var msgTask = new MsgTaskModel(entity);
                    msgTask.save(function(err, result) {
                        next(err, result._doc);
                    });
                }
            });
        },
        function(arg, next) {
            if(arg != null && arg['action'] != undefined) {
                if(arg['action'] == dictionary.msgTaskType.msg) {
                    //send msg
                    sender.sendMessageByRoom(sio, arg.body.room, arg.body.content);
                    next(null, arg._id);
                } else {
                    if(models[entity.model] != undefined) {
                        var CollectionModel = models[entity.model];
                        var model = new CollectionModel(arg.body);
                        if(arg['type'] == dictionary.dbAction.save) {
                            model.save(function(err, result) {
                                next(err, arg._id);
                            });
                        } else if(arg['type'] == dictionary.dbAction.update) {
                            var objId = arg.body._id;
                            delete arg.body._id;
                            models[entity.model].update({_id: objId}, arg.body, {upsert: true}, function(err, result) {
                                next(err, arg._id);
                            });
                        } else if(arg['type'] == dictionary.dbAction.del) {
                            model.remove(function(err, result) {
                                next(err, arg._id);
                            });
                        } else {
                            next(null, arg._id);
                        }
                    }
                }
            }
        },
        function(arg, next) {
            if(typeof arg == 'number') {
                pup.msgTask.update({_id: arg}, {$set: {status: 1}}).exec(next);
            }
        }
    ], function(err, result) {

        if(err) {
            console.log('execute msg failed.' + err);
        } else {
            console.log('execute msg successfully.');
        }
    });

}


exports.reissueMsg = function() {
    pup.msgTask.find({status: 0}, {}, function(err, tasks) {
        _.each(tasks, function(task) {
            var models = exports.models;

            async.waterfall([
                function(next) {
                    var arg = task;
                    if(arg != null && arg['action'] != undefined) {
                        if(arg['action'] == dictionary.msgTaskType.msg) {
                            //send msg
                            sender.sendMessageByRoom(sio, arg.body.room, arg.body.content);
                            next(null, arg._id);
                        } else {
                            if(models[task.model] != undefined) {
                                var CollectionModel = models[task.model];
                                var model = new CollectionModel(arg.body);
                                if(arg['type'] == dictionary.dbAction.save) {
                                    model.save(function(err, result) {
                                        next(err, arg._id);
                                    });
                                } else if(arg['type'] == dictionary.dbAction.update) {
                                    var objId = arg.body._id;
                                    delete arg.body._id;
                                    models[task.model].update({_id: objId}, arg.body, {upsert: true}, function(err, result) {
                                        next(err, arg._id);
                                    });
                                } else if(arg['type'] == dictionary.dbAction.del) {
                                    model.remove(function(err, result) {
                                        next(err, arg._id);
                                    });
                                } else {
                                    next(null, arg._id);
                                }
                            }
                        }
                    }
                },
                function(arg, next) {
                    if(typeof arg == 'number') {
                        pup.msgTask.update({_id: arg}, {$set: {status: 1}}).exec(next);
                    }
                }
            ], function(err, result) {

                if(err) {
                    console.log('execute msg failed.' + err);
                } else {
                    console.log('execute msg successfully.');
                }
            });
        });
    });
}



