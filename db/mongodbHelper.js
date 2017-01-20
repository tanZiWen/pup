/**
 * Created by wangnan on 14-4-17.
 */

var logger = require('../lib/logFactory').getModuleLogger(module);
var mongoose = require("mongoose");

mongoose.connection.on('error', function(err) {
    logger.error(err);
});
mongoose.connection.once('open', function() {
    logger.info('connect mongodb');
});

/**
 *
 * @param {{}} dbCfg
 *       url : 'mongodb://localhost:27017/dbname',
 *       options : {
 *             db: { native_parser: true },
 *             server: { poolSize: 1 },
 *             replset: { rs_name: 'replicaSetName' },
 *             user: 'username',
 *             pass: 'password'
 *       },
 *       keepAlive : 1
 * @returns {connection} mongoose's connection
 */
exports.createDB = function(dbCfg) {

    var socketOptions = {
        keepAlive: dbCfg.keepAlive
    };
    dbCfg.options.server.socketOptions = socketOptions;
    if(dbCfg.options.replset)
        dbCfg.options.replset.socketOptions = socketOptions;

    return mongoose.createConnection(dbCfg.url, dbCfg.options);
}