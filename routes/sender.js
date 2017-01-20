
/*var io;

module.exports = function(io) {
    this.io = io;
}*/

var _ = require('underscore');

/**
 *
 * @param io
 * @param userIds(array of the userId)
 * @param data
 */
function refreshTaskCountByUserIds(io, userIds, data) {
    if(userIds && io) {
        _.each(userIds, function(userId) {
            io.sockets.in('r:' + userId).emit('notificationRefreshTaskCount', data);
        });
    }
}


module.exports.sendTaskForClientByRoom = function(io, room, data) {
    io.sockets.in(room).emit('wechatNewMsgNotif', data);
}

/**
 *
 * @param io
 * @param rooms(array of the room)
 * @param data
 */
function refreshMsgCountByUserIds(io, userIds, data) {
    if(userIds && io) {
        _.each(userIds, function(userId) {
            io.sockets.in('r:' + userId).emit('notificationRefreshMsgCount', data);
        });
    }
}

exports.refreshTaskCountByUserIds = refreshTaskCountByUserIds;
exports.refreshMsgCountByUserIds = refreshMsgCountByUserIds;

