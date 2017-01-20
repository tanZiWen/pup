

var taskDao = require('../../../db/crm/taskDao.js'),
    sysMessageDao = require('../../../db/crm/sysMessageDao.js'),
    dictionary = require('../../../lib/dictionary.js'),
    async = require('async'),
    sender = require('../../../routes/sender.js'),
    appCfg = require('../../../app.cfg.js');

var _ = require('underscore'),
    _s = require('underscore.string');

var redis = require('redis'),
    jsonify = require('redis-jsonify'),
    global = require('../../../lib/global.js'),
    idc = jsonify(redis.createClient(global.redis.port, global.redis.host, {"return_buffers": true}));

var getTaskCount = function(io, socket, message, fn) {
    //get data from mongodb
    var user = socket.handshake.session.user;
    if(user != null) {
        var steps = {};

        steps.undoTaskCount = function(next) {
            taskDao.countUndoByUserId(user._id, next);
        };

        async.parallel(steps, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                fn([{'type' : dictionary.messageCountType.task, count : 0}]);
            } else {
                fn([{'type' : dictionary.messageCountType.task, count : data.undoTaskCount}]);
//                var message = result.message;
//                idc.set(global.REDIS_SOCKET_IO_CONNECTION_PREFIX + socket.id, user, redis.print);
//                console.log(global.REDIS_SOCKET_IO_CONNECTION_PREFIX + socket.id);
//                idc.set(global.REDIS_USER_ID_CONNECTION_PREFIX + user._id, socket.id, redis.print);
//                var room = user.type == undefined ? 0 : user.type + "";
//                socket.join(room);
//                if(message.length > 0) {
//                    var dicts = result.dicts;
//                    if(dicts.length) {
//                        dicts = _.pluck(dicts, '_doc');
//                        var dictMap = _.indexBy(dicts, 'key_code');
//                        message.forEach(function (item) {
//                            _.defaults(item, dictMap[item._id]);
//                        });
//                        var total = _.reduce(_.pluck(message, 'count'), function(memo, num){return memo + num;}, 0);
//                        var data = {};
//                        data.totalNum = total;
//                        data.data = message;
//                        fn(data);
//                        /*setTimeout(function() {
//
//                            sender.sendMessageByRoom(io, "r:" + user.type, {"data": "111"});
//
//                         }, 4000);*/
//                    }
//                }
            }
        });
    }

};

var getMsgCount = function(io, socket, message, fn) {
    var user = socket.handshake.session.user;
    if(user != null) {
        sysMessageDao.countUnreadMsgByUserId(user._id, function(err, count) {
            if(err) {
                fn([{'type' : dictionary.messageCountType.msg, count : 0}]);
            } else {
                fn([{'type' : dictionary.messageCountType.msg, count : count}]);
            }
        });
    }
}



/*function sendMessageByUserId(userId, data) {
    idc.get(global.REDIS_USER_ID_CONNECTION_PREFIX + userId, function(err, socketId) {
        if(socketId != null) {
            socketId = socketId.toString();
            io.sockets.socket(socketId).emit('message.list.res', data);
        }
    });
};**/



module.exports = {"task.count" : getTaskCount, "message.count" : getMsgCount};
