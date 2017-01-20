/**
 * Created by tanyuan on 11/4/15.
 */
var crypto = require('crypto'),
    algorithm = 'aes-256-cbc',
    password = 'd6F3Efeqklsmhjkw8rt5d6svgh3j9K8H6D8',
    logger = require('./logFactory').getModuleLogger(module);

exports.encrypt = function(text, next){
    crypto.pbkdf2(text, 'salt', 4096, 64, 'sha256', function(err, key) {
        if (err) {
            next(err);
        }else {
            next(null, key.toString('hex'));
        }
    });
};




