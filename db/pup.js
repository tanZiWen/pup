//var db = require("mongoskin").db("mongodb://prosnav:prosnav@localhost:27017/upm?auto_connect", { safe: true, auto_reconnect: true });
//
//var uncheckUrls = ['/index', '/login', '/logout'];
//
//exports.user = db.collection('user');
//exports.department = db.collection('department');
//exports.app = db.collection('app');
//exports.privilege = db.collection('privilege');
//exports.role = db.collection('role');
//
//
//exports.db = db;


var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var options = {
    db: { native_parser: true },
    server: { poolSize: 5 },
    replset: { rs_name: 'pup' },
    user: 'prosnav',
    pass: 'prosnav'
};

options.server.socketOptions = options.replset.socketOptions = { keepAlive: 5 };

mongoose.connect('mongodb://192.168.2.88:27017/pup', options);


var UserSchema = new Schema({
    _id: Number,
    mobileNo: String,
    name: String,
    password: String,
    type: Number,
    department: {id: Number, type: Number},
    roles: [Schema.Types.Mixed],
    ctime: { type: Date, default: Date.now }
}, {versionKey : false});

var AppSchema = new Schema({
    _id: Number,
    key: String,
    name: String,
    prefix_url: String,
    title: String,
    role: Array,
    ctime: { type: Date, default: Date.now }
}, {versionKey : false});

var DepartmentSchema = new Schema({
    _id: Number,
    nema: String,
    leader: Number,
    ctime: { type: Date, default: Date.now }
}, {versionKey : false});

var RoleSchema = new Schema({
    _id: Number,
    name: String,
    privileges: Array,
    ctime: { type: Date, default: Date.now }
}, {versionKey : false});

var PrivilegesSchema = new Schema({
    _id: Number,
    type: String,
    parent_id: Number,
    app_id: Number,
    url_name: String,
    url: String,
    action_key: String,
    current_level: Number,
    ctime: { type: Date, default: Date.now }
}, {versionKey : false});

var MessageSchema = new Schema({
    _id: Number,
    title: String,
    content: String,
    is_read: Number,
    type: Number,
    reference_id: Number,
    user_id: Number,
    rtime: { type: Date, default: Date.now },
    ctime: { type: Date, default: Date.now }
}, {versionKey : false});

var DictShema = new Schema({
    _id: Number,
    dict_name: String,
    dict_code: String,
    key_name: String,
    key_code: Number,
    ctime: { type: Date, default: Date.now }
}, {versionKey : false});

var ProductShema = new Schema({
    _id :  Number ,
    name : String
//    organization_id:Number,
//    income_expect:Number,
//    amount:Number,
//    mini_amount:Number,
//    RM:String,
//    remark:String,
//    ctime: { type: Date, default: Date.now }
}, {versionKey : false});

var MsgTaskShema = new Schema({
    _id : Number,
    type : String,
    action : String,
    body : Schema.Types.Mixed,
    model : String,
    status : Number,
    ctime: { type: Date, default: Date.now }
}, {versionKey : false});

exports.user = mongoose.model("user", UserSchema, "user");
exports.app = mongoose.model("app", AppSchema, "app");
exports.department = mongoose.model("department", DepartmentSchema, "department");
exports.role = mongoose.model("role", RoleSchema, "role");
exports.privilege = mongoose.model("privilege", PrivilegesSchema, "privilege");
exports.message = mongoose.model("message", MessageSchema, "message");
exports.dict = mongoose.model('dict', DictShema, 'dict');
exports.product = mongoose.model('product', ProductShema, 'product');
exports.msgTask = mongoose.model('msgTask', MsgTaskShema, 'msgTask');

var uncheckUrls = ['/index', '/login', '/logout'];
exports.uncheckUrls = uncheckUrls;


