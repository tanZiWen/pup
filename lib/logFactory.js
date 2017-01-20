/**
 * Created by wangnan on 4/8/14.
 */

var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');
var fs = require('fs');
var winston = require('winston');
require('winston-mongodb').MongoDB;
var path = require('path');

//log file size default to 2mb
var default_log_file_size = 1024 * 1024 * 2;
//log file max to 10000
var default_log_file_max = 10000;

//prefixes of three types of loggers
var prefix_app = '_app';
var prefix_module = '_module';
var prefix_sys = '_sys';


//the default configuration of logger
var configuration = {
    default: {
        console: {
            level: 'silly',
            silent: false,
            colorize: true,
            timestamp: false
        },
        file: {
            level: 'silly',
            silent: false,
            colorize: true,
            timestamp: true,
            filename: '/logs/pup',
            maxsize: default_log_file_size,
            maxFiles: default_log_file_max,
            json: true
        },
        mongodb: {
            level: 'silly',
            silent: false,
            db: 'pup',
            collection: 'logs',
            safe: true,
            host: '127.0.0.1',
            port: '27017',
            username: 'prosnav',
            password: 'prosnav',
            errorTimeout: 10000,
            timeout: 10000,
            storeHost: true,
            ssl: false,
            authDb: null
        }
    },
    loggers: {}
};

/**
 *
 * @returns {Logger}
 */
exports.getAppLogger = function () {
    var logger = {};
    if (winston.loggers.has(prefix_app)) {
        logger = winston.loggers.get(prefix_app);
    } else {
        logger = createLogger(prefix_app);
    }
    return logger;
};

/**
 *
 * @param {Module} logModule nodejs's Module
 * @returns {Logger}
 */
exports.getModuleLogger = function (logModule) {
    if (!logModule || !_.isString(logModule.filename)) {
        throw new Error('Get Module Logger Error : logModule is not a module object : ' + logModule);
    }
    var loggerName = prefix_module + logModule.filename
        .replace(global.projectRoot, '')
        .split('.')[0]
        .replace(new RegExp(path.sep, 'g'), '_');

    var logger = {};
    if (!winston.loggers.has(loggerName)) {
        if (!fs.existsSync(logModule.filename)) {
            throw new Error('Get Module Logger Error : module is not exist [' + logModule.filename + ']');
        }
        var options = {};
        var loggerNameArry = loggerName.split('_');

        var name = '';
        for (var i = 1; i < loggerNameArry.length; i++) {
            name += '_' + loggerNameArry[i];
            var ops = configuration.loggers[name];
            if (ops) {
                options = ops;
            }
        }
        logger = createLogger(loggerName, options);
    } else {
        logger = winston.loggers.get(loggerName);
    }
    return logger;
};
/**
 *
 * @param {String} logType
 * @returns {Logger}
 */
exports.getSystemLogger = function (logType) {
    if (!_.isString(logType)) {
        logType = '';
    }
    var loggerName = prefix_sys + '_' + logType;
    var logger = {};
    if (winston.loggers.has(loggerName)) {
        logger = winston.loggers.get(loggerName);
    } else {
        throw new Error('Log type is not define : [' + logType + ']');
    }
    return logger;
};

function init() {
    //logger's configuration
    configuration.loggers = require('../log.cfg');
    _.each(configuration.loggers, function(value, key) {
        if(!_.startsWith(key, prefix_module)) {
            createLogger(key, value);
        }
    });
    return this;
}

function createLogger(loggerName, options) {
    var logCfg = {console : {}, file: {}, mongodb : {}};

    if(!options) {
        options = {};
    }
    _.defaults(logCfg.console, options.console, configuration.default.console);
    _.defaults(logCfg.file, options.file, configuration.default.file);

    if(logCfg.file.filename) {
        if(_.startsWith(loggerName, prefix_app)) {
            logCfg.file.filename += '_app_';
        } else if(_.startsWith(loggerName, prefix_module)) {
            logCfg.file.filename += '_module_';
        } else if(_.startsWith(loggerName, prefix_sys)) {
            logCfg.file.filename +=  loggerName + '_';
        }
    }
    logCfg.file.filename += process.pid + '.log';
    _.defaults(logCfg.mongodb, options.mongodb, configuration.default.mongodb);

    var logger = winston.loggers.add(loggerName, {console : logCfg.console, file : logCfg.file});
    if(!_.isEmpty(logCfg.mongodb)) {
        logger.add(winston.transports.MongoDB, logCfg.mongodb);
    }
    //console.log('LogFactory create logger : [' + loggerName + ']' + JSON.stringify(logCfg));
    return logger;
}

init();