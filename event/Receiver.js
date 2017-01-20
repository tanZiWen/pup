
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

var msgTaskDao = require('../db/crm/msgTaskDao.js'),
    dictionary = require('./../lib/dictionary.js'),
    crmModel = require('../db/crm/model.js'),
    upmModel = require('../db/upm/model.js'),
    sender = require('../routes/sender.js'),
    dbProcessor = require('./DBProcessor.js'),
    commonProcessor = require('./CommonProcessor.js'),
    auditProcessor = require('./AuditProcessor.js'),
    prdRefDataProcessor = require('./PrdRefDataProcessor.js');

var sio;
var models = {};

var sioHolder = module.exports = exports = function(io) {
    sio = io;
}

_.each(crmModel, function(value, key) {
    if(typeof value === 'function' && value.name == 'model') {
        models[key] = value;
    }
});

_.each(upmModel, function(value, key) {
    if(typeof value === 'function' && value.name == 'model') {
        models[key] = value;
    }
});


exports.models = models;


var processors = {

    //基本的数据库操作(增删改)
    dbProcessor : dbProcessor.handleMsg,

    commonProcessor : commonProcessor.handleMsg,

    //质检
    auditProcessor : auditProcessor.handleMsg,

    //产品资料下发

    prdRefDataProcessor : prdRefDataProcessor.handleMsg
};

var prcessorPartners = {};

var msgTaskTypes = _.values(dictionary.msgTaskType);
_.each(msgTaskTypes, function(type) {
    _.each(processors, function(value, key) {
        if(typeof value === 'function' && key == type + 'Processor') {
            prcessorPartners[type] = value;
        }
    });
});

exports.prcessorPartners = prcessorPartners;


/**
 *
 * @param entity {
 *  type :[] enum=['db', 'common', 'audit', 'prdRefData']
 *  body : {
 *      senderId : Number 发送者的ID
 *      receiverIds : [] 接收者的userId
 *      model : String 需要做操作的collection的modelName
 *      type : String 操作类型dictionary.msgTask,add, update, del
 *      referenceId : Number 消息所关联的collection的ID
 *      data : {} 操作的collection的data(在type为audit,prdRefData或者action=add,update, del的时候适用)
 *  }
 *
 * }
 */
exports.receive = function(entity) {

    var models = exports.models;

    async.waterfall([
        function(next) {
            // save in db
            entity.processed = false;
            entity.ctime = new Date();
            msgTaskDao.create(entity, next);
        },
        function(arg, next) {
            var processor = exports.prcessorPartners[entity.type];
            processor(sio, models, arg, entity, next);
        },
        function(arg, next) {
            if(typeof arg == 'number') {
                msgTaskDao.handleSucc(arg, next);
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
    msgTaskDao.find({processed: false}, function(err, tasks) {
        _.each(tasks, function(task) {
            var models = exports.models;

            async.waterfall([
                function(next) {
                    var processor = exports.prcessorPartners[task.type];
                    processor(sio, models, task, task, next);
                },
                function(arg, next) {
                    if(typeof arg == 'number') {
                        msgTaskDao.handleSucc(arg, next);
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



