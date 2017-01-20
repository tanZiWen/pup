/**
 * Created by tanyuan on 11/2/15.
 */


exports.getClientIp = function(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};