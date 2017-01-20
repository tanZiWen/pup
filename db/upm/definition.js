/**
 * Created by wangnan on 14-4-17.
 *
 * db upm defintion
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var dictionary = require('../../lib/dictionary');
var utils = require('../../lib/utils');

//数据字典定义 For enum validator
var enums = {
    orgType : dictionary.orgType.list(),
    sex : dictionary.sex.list(),
    userStatus : dictionary.userStatus.list(),
    userPosition : dictionary.userPosition.list(),
    fnType : dictionary.fnType.list(),
    workerRole : dictionary.workerRole.list()
};

exports.upm_app = new Schema({
    _id : {type : Number, unique : true, required : true},
    //应用系统编号
    code : { type : String, unique : true, required : true },
    //应用系统名称
    name : { type : String, required : true },
    //应用系统描述
    desc : String,
    //图标
    icon : String,
    //背景颜色
    bgColor : String,
    //背景图片地址
    bgUrl : String,
    //应用系统地址
    appUrl : String,
    //注销地址
    logoutUrl:String,
    //主页
    indexPage : String,
    //显示顺序
    viewOrder : {type : Number, default : 0 },
    //创建人ID
    cuserid : {type : Number, required : true },
    //创建人用户名
    cusername : {type : String, required : true },
    //创建人真实姓名
    crealName : {type : String, required : true },
    //创建时间
    ctime : { type : Date, default : utils.getCurrentDate, required : true},
    //最后更新人ID
    uuserid : {type : Number, required : true },
    //最后更新人用户名
    uusername : { type : String, required : true },
    //最后更新人真实姓名
    urealName : { type : String, required : true },
    //最后更新时间
    utime : { type : Date, default : utils.getCurrentDate, required : true}
});
//机构 Collection

exports.upm_organization = new Schema({
    _id : {type : Number, unique : true, required : true},
    //机构编号
    code : { type : String, unique : true, required : true },
    //机构类型
    type : { type : String, enum : enums.orgType, required : true },
    //机构名称
    name : { type : String, required : true },
    //地址
    address : String,
    //固定电话
    tel : { type : String, match : /^[\-\d]*$/ },
    //父机构编号
    parentCode : {type : String, default : 'root'},
    //显示顺序
    viewOrder : {type : Number, default : 0 },
    //最后创建人ID
    cuserid : {type : Number, required : true },
    //创建人用户名
    cusername : {type : String, required : true },
    //创建人真实姓名
    crealName : {type : String, required : true },
    //创建时间
    ctime : { type : Date, default : utils.getCurrentDate, required : true},
    //最后更新人ID
    uuserid : {type : Number, required : true },
    //最后更新人用户名
    uusername : { type : String, required : true },
    //最后更新人真实姓名
    urealName : { type : String, required : true },
    //最后更新时间
    utime : { type : Date, default : utils.getCurrentDate, required : true},
    //是否已删除标识
    deleted : { type : Boolean, required : true },
    //外拨组号
    callCenterGroup : { type : String}
});

//用户 Collection
exports.upm_user = new Schema({
    _id : {type : Number, unique : true, required : true},
    //用户名
    username : { type : String, unique : true, required : true },
    //密码
    password : { type : String, required : true },
    //真实姓名
    realName : { type : String, required : true },
    //性别
    sex : { type : String, enum : enums.sex, required : true },
    //岗位
    position : { type : String, enum : enums.userPosition, required : true },
    //用户状态
    status : { type : String, enum : enums.userStatus, required : true  },
    //员工ID
    employeeid : Number,
    //工号
    workno : String,
    //分机号
    extNo : String,
    //邮件
    email : String,
    //在线标识
    online : { type : Boolean, required : true },
    //所属机构编号
    orgCode : { type : String, required : true },
    //包含的角色编号
    roleCodes : [String],
    //最后创建人ID
    cuserid : {type : Number, required : true },
    //创建人用户名
    cusername : {type : String, required : true },
    //创建人真实姓名
    crealName : {type : String, required : true },
    //创建时间
    ctime : { type : Date, default : utils.getCurrentDate, required : true},
    //最后更新人ID
    uuserid : {type : Number, required : true },
    //最后更新人用户名
    uusername : { type : String, required : true },
    //最后更新人真实姓名
    urealName : { type : String, required : true },
    //最后更新时间
    utime : { type : Date, default : utils.getCurrentDate, required : true}
});

//角色 Collection
exports.upm_role = new Schema({
    _id : {type : Number, unique : true, required : true},
    //角色编号
    code : { type : String, unique: true, required : true },
    //角色名称
    name : { type : String, required : true },
    //所属应用系统
    appCode : { type : String, required : true },
    //包含的功能
    fnCodes : { type : [String], required : true }
});

//系统功能 Collection
exports.upm_function = new Schema({
    _id : {type : Number, unique : true, required : true},
    //功能编号
    code : { type : String, unique: true, required : true },
    //功能名称
    name : { type : String, required : true },
    //功能URL
    funcAction : Schema.Types.Mixed,
    //父功能编号
    parentCode : { type : String, default : 'root'},
    //功能层级
    treeLevel : { type : Number, required : true },
    //功能类型
    type : { type : String, enum : enums.fnType, required : true },
    //所属应用系统编号
    appCode : { type : String, required : true },
    //最后创建人ID
    cuserid : {type : Number, required : true },
    //创建人用户名
    cusername : {type : String, required : true },
    //创建人真实姓名
    crealName : {type : String, required : true },
    //创建时间
    ctime : { type : Date, default : utils.getCurrentDate},
    //最后更新人ID
    uuserid : {type : Number, required : true },
    //最后更新人用户名
    uusername : { type : String, required : true },
    //最后更新人真实姓名
    urealName : { type : String, required : true },
    //最后更新时间
    utime : { type : Date, default : utils.getCurrentDate },
    //是否隐藏
    hidden : { type : Boolean, default : false }
});

//数据字典 Collection
exports.upm_dictionary = new Schema({
    _id : {type : Number, unique : true, required : true},
    //字典键
    key : { type : String, required : true  },
    //字典类型
    type : { type : String, required : true },
    //字典名称
    name : { type : String, required : true },
    //父字典键
    parentKey : String,
    //显示顺序
    viewOrder : {type : Number, default : 0 }
});

//工作组 Collection
exports.upm_workgroup = new Schema({
    _id : {type : Number, unique : true, required : true},
    //工作组编号
    code : { type : String, unique : true, required : true  },
    //工作组名称
    name : { type : String, required : true  },
    //所属机构编号
    orgCode : { type : String, required : true  },
    //类型
    type : { type : String, required : true, default: dictionary.workGroupType.consultant},
    //包含用户
    workers : [{
        //用户编号
        userid : {type : Number, unique : false, required : true},
        //微信工作组所分配的微信号
        assignAccounts : [
            {
                accountId : {type : Number, required : true },
                code : {type : String, required : true }
            }
        ],
        //成员类型
        workerRoles : [{type : String, unique : false, required : false, enum : enums.workerRole}]
    }],
    //所分配的微信号
    wechatAccounts : [
        {
            accountId : {type : Number, required : true },
            code : {type : String, required : true }
        }
    ],
    //最后创建人ID
    cuserid : {type : Number, required : true },
    //创建人用户名
    cusername : {type : String, required : true },
    //创建人真实姓名
    crealName : {type : String, required : true },
    //创建时间
    ctime : { type : Date, default : utils.getCurrentDate, required : true},
    //最后更新人ID
    uuserid : {type : Number, required : true },
    //最后更新人用户名
    uusername : { type : String, required : true },
    //最后更新人真实姓名
    urealName : { type : String, required : true },
    //最后更新时间
    utime : { type : Date, default : utils.getCurrentDate, required : true},
    //删除
    isDel: {type: Boolean, required : true}
});

//区域
exports.upm_area = new Schema({
    _id : {type : Number, unique : true, required : true},
    //区域编号
    code : {type : String, unique : true, required : true},
    //区域名称
    name : { type : String, required : true  },
    //包含机构
    orgCodes : [String],
    //创建人ID
    cuserid : {type : Number, required : true },
    //创建人用户名
    cusername : {type : String, required : true },
    //创建人真实姓名
    crealName : {type : String, required : true },
    //创建时间
    ctime : { type : Date, default : utils.getCurrentDate, required : true},
    //最后更新人ID
    uuserid : {type : Number, required : true },
    //最后更新人用户名
    uusername : { type : String, required : true },
    //最后更新人真实姓名
    urealName : { type : String, required : true },
    //最后更新时间
    utime : { type : Date, default : utils.getCurrentDate, required : true}
});

exports.upm_user_operate_log = new Schema({
    _id: {type: Number, unique: true, required: true},
    userid: {type: Number, required: true},
    username: {type: String, required: true},
    realName: {type: String, required: true},
    ip: {type: String, required: true},
    agent: {type: String, required: true},
    originalUrl: {type: String, required: true},
    priority: {type: String, require: true},
    ctime: {type: Date, default: utils.getCurrentDate(), required: true}
});
