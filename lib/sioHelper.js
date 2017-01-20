/**
 * Created by michael on 8/22/14.
 */
var sio;
var models = {};

exports.setup = function(io) {
    sio = io;
}

exports.get = function() {
    if(sio) {
        return sio;
    } else {
        return null;
    }
}

