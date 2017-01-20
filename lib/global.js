/**
 *
 * User: wuzixiu
 * Date: 12/28/12
 * Time: 2:52 PM
 */
var path = require('path'),
    appDir = path.dirname(require.main.filename);
exports.redis = {'host': 'localhost', 'port': 6379};

exports.page = {'sizeOfPhone': 20};

exports.UP_DIR = {'ROOT': '/var/www/', 'USER': 'u/'};
exports.TEMP_DIR = '/tmp/';

exports.IMG_SIZE = {
	'LARGE': {'width': 480, 'height': 480, 'quality': 89},
	'THUMBNAIL': {'width': 120, 'height': 90, 'quality': 89},
	'AVATAR': {'width': 180, 'height': 180, 'quality': 89}
};

exports.REDIS_SOCKET_IO_CONNECTION_PREFIX = 'SOCKET_IO_CONNECTION_';

exports.REDIS_USER_ID_CONNECTION_PREFIX = 'USER_ID_CONNECTION_';


exports.FILE_BASE_PATH = "/var/www/crm/";

exports.UPLOAD_TMP_PATH = appDir + "/uploads/";
exports.PROD_ATTACHMENT_PATH = this.FILE_BASE_PATH + "prod_attachment/";
exports.CUS_ATTACHMENT_PATH = this.FILE_BASE_PATH + "cus_attachment/";



exports.WECHAT_PATH = "public/wechat/";
exports.NEWS_PATH = "public/news/";
exports.MOMENTS_PICTURE_PATH = "wechat/moments/picture/";
exports.MOMENTS_THUMBNAIL_PATH = "wechat/moments/thumbnail/";
exports.WECHAT_CONTACT_AVATAR_PATH = this.FILE_BASE_PATH + this.WECHAT_PATH + "avatar/";
exports.WECHAT_CONTACT_MOMENTS_PATH = this.FILE_BASE_PATH + this.WECHAT_PATH + "moments/";

exports.WECHAT_CONTACT_MOMENTS_PICTURE_PATH = this.WECHAT_CONTACT_MOMENTS_PATH+ "picture/";
exports.WECHAT_CONTACT_MOMENTS_THUMBNAIL_PATH = this.WECHAT_CONTACT_MOMENTS_PATH+ "thumbnail/";

exports.NEWS_PICTURE_PATH = this.FILE_BASE_PATH + this.NEWS_PATH + "trends/picture/";
exports.NEWS_THUMBNAIL_PATH = this.FILE_BASE_PATH + this.NEWS_PATH + "trends/thumbnail/";

exports.STRATEGY_PICTURE_PATH = this.FILE_BASE_PATH + this.NEWS_PATH + "strategy/picture/";
exports.STRATEGY_THUMBNAIL_PATH = this.FILE_BASE_PATH + this.NEWS_PATH + "strategy/thumbnail/";

exports.HOST = "http://218.80.1.68:10086/";

exports.NEWS_BASIC_PATH = this.FILE_BASE_PATH + this.NEWS_PATH ;


exports.DATE_IMPORT_SERVER_HOST = "localhost";
exports.DATE_IMPORT_SERVER_PORT = "9080";

exports.NEW_SERVER_HOST = "localhost";
exports.NEW_SERVER_PORT = "4000";

exports.KEYSECRET = "lDZ00XPQLpu6RchQ1xv1gfZs";

exports.KEYSECRET_NEWS = "lDZ00XPQLpu6RchQ1xv1gfZs7K8d";

exports.ADD_CODE_PREFIX = 'CN';

exports.CLIENT_ID = 'pup';
exports.USER_KEY = 'ps:' + this.CLIENT_ID + ':user:';
exports.CLIENT_SECRET = 'prosnav@com8888';
var baseAuth = new Buffer(this.CLIENT_ID + ":" + this.CLIENT_SECRET).toString('base64');
//exports.OAUTH_HOST = '192.168.21.186';
exports.OAUTH_HOST = 'localhost';
exports.OAUTH_LOGIN = {hostname: this.OAUTH_HOST, port:9090, path:'/oauth/v1/token', headers:{'Authorization': 'Basic ' + baseAuth, 'Content-Type': 'application/json'}};
exports.OAUTH_USER = {hostname: this.OAUTH_HOST, port:9090, path:'/oauth/v1/userInfo', headers:{'Content-Type': 'application/json'}};
exports.PRIVATE_KEY = '/etc/server/privatekey';





