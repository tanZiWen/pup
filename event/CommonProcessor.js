
var async = require('async');

var _ = require('underscore'),
    _s = require('underscore.string');

var messageDao = require('../db/crm/messageDao.js'),
    dictionary = require('./../lib/dictionary.js'),
    idg = require('../db/idg.js'),
    sender = require('../routes/sender.js');


exports.handleMsg = function(io, models, task, msg, next) {
    //var msg = {'type' : 'common', body: {senderId: 1, receiverIds:[10000], type: 'notice', model: 'product', referenceId: 100001}};
    var steps = [];
    var userIds = [];
    if(msg.body.receiverIds != undefined) {
        userIds = msg.body.receiverIds;
    }
    var i = 0;
    _.each(userIds, function(userId) {
        i ++;
        var fnName = 'fn' + i;
        steps[fnName] = function(next) {
            var msgData = {};
            msgData.userId = userId;
            idg.next(messageDao.model.collection.name, function (err, idBuf){
                if(err) {
                    next(err);
                } else {
                    msgData._id = parseInt(idBuf.toString());
                    msgData.status = dictionary.msgStatus.new;
                    msgData.type = msg.body.type;
                    msgData.pushed = true;
                    msgData.userId = msg.body.senderId;
                    msgData.ctime = new Date();
                    msgData.content = {referenceId : msg.body.referenceId};
                    var message = (messageDao.model)(msgData);
                    message.save(function(err, result) {
                        if(!err) {
                            models[msg.body.model].findById(msg.body.referenceId, function(err, result) {
                                if(!err && result != null) {
                                    msgData.content.reference = result._doc;
                                    //send online msg
                                    sender.sendMessageByRoom(io, 'self:' + userId, msgData);
                                    next(err, task._id);
                                } else {
                                    next(err, task._id);
                                }
                            });
                        } else {
                            console.log(err);
                            next(err, task._id);
                        }
                    });
                }
            });
        }
        //insert all user's msg into db
        async.parallel(steps, function(err, values) {
            next(err, task._id);
        });
    });

};


