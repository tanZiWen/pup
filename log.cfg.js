/**
 * Created by wangnan on 4/9/14.
 *
 * log configration file
 *
 * Example for a logger config ：
 *
 * {
        console: {
            level: 'silly', // debug, verbose, info, warn, error
            silent: false,
            colorize: true,
            timestamp: false
        },
        file: {
            level: 'silly',
            silent: false,
            colorize: true,
            timestamp: true,
            filename: '/logs/pup', //log file path prefix
            maxsize: default_log_file_size, //default to 2m
            maxFiles: default_log_file_max, //default to 10000
            json: true
        },
        mongodb: {
            level: 'silly',
            silent: false,
            db: 'pup', //db name
            collection: 'logs', //collection name
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
 */

exports._app = {
    console : { silent : false },
    file : {silent : true},
    mongodb: {host: '192.168.2.88', db: 'log', collection: 'logs.app', username: 'prosnav', password: 'prosnav', level: 'error' }
};
exports._module = {
    console : { silent : false },
    file : {silent : true},
    mongodb: {host: '192.168.2.88', db: 'log', collection: 'logs.module', username: 'prosnav', password: 'prosnav', level: 'error' }
};
exports._sys_access_log = {
    console : { silent : false },
    file : {silent : true},
    mongodb: {host: '192.168.2.88', db: 'log', collection: 'logs.sys.access', username: 'prosnav', password: 'prosnav', level: 'error' }
};