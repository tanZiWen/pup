/**
 * Created by wangnan on 14-4-15.
 */
var G = require('./lib/global');

exports.reverseProxy = false;

exports.mongodb = {
    upm : {
        url : 'mongodb://localhost:27017/upm',
        options : {
            db: { native_parser: true },
            server: { poolSize: 5 },
            replset: { rs_name: 'upm_test' }
            , user: 'prosnav'
            , pass: 'prosnav'
        },
        keepAlive : 5
    },
    crm : {
        url : 'mongodb://localhost:27017/crm',
        options : {
            db: { native_parser: true },
            server: { poolSize: 5 },
            replset: { rs_name: 'crm_test' }
            , user: 'prosnav'
            , pass: 'prosnav'
        },
        keepAlive : 5
    }
};

exports.postgre = {
    url: 'postgres://prosnav:prosnav@121.40.88.18/gindb'
};

exports.website_postgres = {
    url: 'postgres://prosnav:prosnav@localhost/website'
};

exports.redis = {'host': '127.0.0.1', 'port': 6379};

exports.page = {'sizeOfPhone': 20};

exports.UP_DIR = {'ROOT': '/var/www/', 'USER': 'u/'};

exports.TEMP_DIR = '/tmp/';

exports.IMG_SIZE = {
    'LARGE': {'width': 480, 'height': 480, 'quality': 89},
    'THUMBNAIL': {'width': 120, 'height': 90, 'quality': 89},
    'AVATAR': {'width': 180, 'height': 180, 'quality': 89}
};

exports.unCheckUrls = [
    '/',
    '/login',
    '/logout',
    '/template',
    '/template/config',
    '/register'
];

exports.callCenter = {
    valid : true,
    address : '101.231.52.146:8089',
    recordingAddress : '192.168.8.206:55503',
    uiAddress : '101.231.52.146:55505'
};

exports.server = {
    ip : 'localhost',
    port : '10086'
};

exports.sessionTimeout = {
    setPwd: 1000 * 60 * 60 * 24,
    changePwd: 1000 * 60,
    redis : 12 * 60 * 60,
    cookie : 12 * 60 * 60 * 60 * 1000
};

exports.nodejsTogoRequestOptions = {
    host: G.NEW_SERVER_HOST,
    port: G.NEW_SERVER_PORT,
    method: 'POST',
    headers: {
        'Security-Key': G.KEYSECRET
    }
};
