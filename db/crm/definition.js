/**
 * Created by wangnan on 14-4-21.
 *
 * db crm definition
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var dictionary = require('../../lib/dictionary');
var _ = require('underscore');
var utils = require('../../lib/utils');

exports.crm_employee = new Schema({
    _id: {type: Number, unique: true, required: true},
    name: {type: String, required: true},
    workno: {type: String, required: true},
    sex: {type: String, required: true, enum: dictionary.sex.list()},
    telNo: String,
    email: String,
    area: {type: String, required: true},
    orgCode: {type: String, required: false},
    status: {type: String, required: true, enum: dictionary.employeeStatus.list()},
    comment: String,
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, required: true },
    //创建人真实姓名
    crealName: {type: String, required: true },
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true},
    //最后更新人ID
    uuserid: {type: Number, required: true },
    //最后更新人用户名
    uusername: { type: String, required: true },
    //最后更新人真实姓名
    urealName: { type: String, required: true },
    //最后更新时间
    utime: { type: Date, default: utils.getCurrentDate, required: true}
})

exports.crm_product = new Schema({
    _id: {type: Number, unique: true, required: true},
    //名称
    name: {type: String, required: true},
    //类型
    type: {type: String, required: true, enum: dictionary.productType.list()},
    //状态
    status: {type: String, required: true, enum: dictionary.productStatus.list()},
    //发布状态
    publishStatus: {type: String, enum: dictionary.publishStatus.list()},
    //发行机构
    issueOrg: {type: String, required: true},
    //总金额
    totalAmount: {type: Number, required: true},
    //税前预期收益
    preExpectedEarning: {type: String, required: true},
    //最小周期
    minPeriod: {type: Number, required: true},
    //最大周期
    maxPeriod: {type: Number, required: true},
    //周期单位
    periodUnit: {type: String, required: true},
    //最低金额
    minAmount: {type: String, required: true},
    //计息日
    dividendDate: { type: Date, default: utils.getCurrentDate, required: true},
    //管理人
    manager: {type: String, required: true},
    //备注
    comment: String,
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, required: true },
    //创建人真实姓名
    crealName: {type: String, required: true },
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true},
    //最后更新人ID
    uuserid: {type: Number, required: true },
    //最后更新人用户名
    uusername: { type: String, required: true },
    //最后更新人真实姓名
    urealName: { type: String, required: true },
    //最后更新时间
    utime: { type: Date, default: utils.getCurrentDate, required: true}
})

exports.crm_product_trend = new Schema({
    _id: {type: Number, unique: true, required: true},
    //产品ID
    productId: {type: Number, required: true},
    //标签
    tags: [String],
    //描述
    description: {type: String, required: true},
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, required: true },
    //创建人真实姓名
    crealName: {type: String, required: true },
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true}
})

exports.crm_product_ref_data = new Schema({
    _id: {type: Number, unique: true, required: true},
    //产品ID
    productId: {type: Number, required: true},
    //资料名
    name: {type: String, required: true},
    //描述
    description: {type: String, required: true},
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, required: true },
    //创建人真实姓名
    crealName: {type: String, required: true },
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true}
})

exports.crm_product_attachment = new Schema({
    _id: {type: Number, unique: true, required: true},
    //产品ID
    productId: {type: Number, required: true},
    //附件编号
    code: {type: String, unique: true, required: true},
    //附件名称
    name: {type: String, required: true},
    //描述
    description: String,
    //扩展名
    extension: String,
    //附件权限
    privilege: [
        {
            userPosition: {type: String, required: true},
            read: {type: Boolean, required: true},
            download: {type: Boolean, required: true}
        }
    ],
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, required: true },
    //创建人真实姓名
    crealName: {type: String, required: true },
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true}
})

//客户
var customerDataModel =  {
    _id : {type: Number, unique: true, required: true},
    //客户编号
    code : {type: String, unique: true, require: true, index : true},
    //历史备份ID
    preid : {type: Number, required: false, default : 1},
    //电话号
    telNo: {type: String, required: true, index : true},
    //坐标
    //random: [Number, Number],
    //客户名称
    name: {type: String, required: false},
    //客户等级
    level: {type: String, required: false},
    //客户状态
    status: {type: String, required: false},
    //拨打状态
    callStatus: {type: String, required: false, default: 'noCall'},
    //质检状态
    auditStatus: {type:String, required: false},
    //审核状态
    reviewStatus: {type: String, required: false},
    //所属区域
    belongArea: {
        //区域编号
        areaCode: {type: String, required: true},
        //区域名称
        areaName: {type: String, required: true}
    },
    //性别
    sex: {type: String, required: false},
    //城市
    city: String,
    //证件类型
    identityDocType: {type: String, required: false},
    //证件号码
    identityDocNo: {type: String, required: false},
    //生日
    birthday: {type: Date, required: false},
    //邮件地址
    email: {type: String, required: false},
    //微信号
    wechatNo: {type: String, required: false},
    //是否微博认证
    wechatAuth: {type: Boolean, required: true, default: false},
    //微信账号性别
    wechatSex : String,
    //当前扫描批次中是否被扫描过:0-n,1-y
    wechatCurScanStatus : {type: Number, required: true, default: 0},
    //所属管控的微信账号
    wechatManager : {
        accountId : Number,
        accountNo : String,
        ctime : Date
    },
    //微信添加记录
    wechatAddRecord : [
        {
            accountId : {type: Number, required: true},
            accountNo : {type: String, required: true},
            wechatStatus : {type: String, required: true},
            ctime : { type: Date, default: utils.getCurrentDate, required: true}
        }
    ],
    //记录被添加的次数
    wechatAddCount: {type: Number, require: true, default: 0},
    //个人主页
    homepage: {type: String, required: false},
    //QQ号
    qqNo: {type: String, required: false},
    //住房信息
    houseInfo: {type: String, required: false},
    //职业
    profession: {
        type: {type: String, required: false},
        describe: {type: String, required: false}
    },
    //工作地点
    workAddress: {type: String, required: false},
    //车型
    carType: {type: String, required: false},
    //最后联系信息
    lastContact: {
        //最后联系时间
        lastContactDate: {type: Date, required: false},
        //最后联系用户ID
        lastContactUID: {type: String, required: false},
        //最后联系用户名
        lastContactUName: {type: String, required: false},
        //服务类型
        type: {type: String, required: false},
        //沟通产品
        product: {type: String, required: false},
        //备注
        comment: {type: String, required: false}
    },
    //最后呼叫信息
    lastCall: {
        //最后呼叫时间
        lastCallDate: {type: Date, required: false},
        //最后呼叫用户ID
        lastCallUID: {type: String, required: false},
        //最后呼叫用户名
        lastCallUName: {type: String, required: false},
        //服务类型
        type: {type: String, required: false},
        //沟通产品
        product: {type: String, required: false},
        //备注
        comment: {type: String, required: false}
    },
    //备注
    comment: {type: String, required: false},
    //标签
    tags: {type: [String], required: false},
    //拨打次数
    callTimes: {type: Number, required: true, default: 0},
    //客户投资经验
    investmentPreference: {
        type: {type: String, required: false},
        describe: {type: String, required: false}
    },
    //投资期限偏好
    investmentTimePreference: {type: String, required: false},
    //风险偏好
    venturePreference: {type: String, required: false},
    //是否愿意参加活动
    isLikeAction: {type: Boolean, required: false},
    //资金体量
    bodyMass: {type: String, required: false},
    //资金回笼时间
    fundBackTime: {type: Date, required: false},
    //暂无投资意向原因
    noInvestmentReason: {type: String, required: false},
    //新增方式
    addType: {type: String, required: false},
    //导入批次Id
    ImpBatchId: {type: Number, required: false, index : true},
    //是否游离
    free: {type: Boolean, required: true, default: true},
    //未办行动计划数量
    unDoActionPlanCount: {type: Number, required: false, default: 0},
    //所属用户
    belongUser: {type: Number, required: false, index: true},
    //所属RM
    manager : {type: Number, required: false, index: true},
    //分配人
    assignUser: {type: Number, required: false},
    //分配时间
    assignTime: {type: Date, required: false},
    //随机坐标
    //random : [Number],
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, required: true },
    //创建人真实姓名
    crealName: {type: String, required: true },
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true},
    //最后更新人ID
    uuserid: {type: Number, required: true },
    //最后更新人用户名
    uusername: { type: String, required: true },
    //最后更新人真实姓名
    urealName: { type: String, required: true },
    //最后更新时间
    utime: { type: Date, default: utils.getCurrentDate, required: true}
};
exports.crm_customer = new Schema(customerDataModel);
//exports.crm_customer.index({random : '2d'});

//历史客户
var customerHistoryDataModal = _.defaults(
    {
        _id : {type: Number, unique: true, required: true},
        hisId : {type: Number, required: true},
        hisOperateType : {type: String, required: true},
        hisOperateTime : {type: String, required: true},
        hisOperateUser : {
            id : {type: Number, required: true},
            username : {type: String, required: true},
            realName : {type: String, required: true}
        },
        //值发生改变的字段名称
        changeColumns : [String],
        //修改后的客户对象
        changeCustomer : Schema.Types.Mixed
    },
    customerDataModel
);
delete customerHistoryDataModal.code.unique;
delete customerHistoryDataModal.code.index;


//无意向操作记录
exports.crm_customer_giveup_user = new Schema({
    _id : {type: Number, unique: true, required: true},
    customerId : {type: Number, required: true},
    userId : {type: Number, required: true},
    opTime : {type: Date, required: true, default: utils.getCurrentDate}
}),

exports.crm_customer_history = new Schema(customerHistoryDataModal);

exports.crm_customer_service_record = new Schema({
    _id: {type: Number, unique: true, required: true},
    //服务记录类型
    type: {type: String, required: true},
    //客户ID
    customerId: {type: Number, required: true, index: true},
    //客户状态
    customerStatus: {type: String, required: false},
    //客户拨打状态
    customerCallStatus: {type: String, required: false},
    //客户质检状态
    customerAuditStatus: {type: String, required: false},
    //服务产品记录
    product: {type: String, required: false},
    //录音信息
    recording: {type: [String], required: false},
    //客户投资经验
    investmentPreference: {
        type: {type: String, required: false},
        describe: {type: String, required: false}
    },
    //体量
    bodyMass: {type: String, required: false},
    //订单编号
    orderCode: {type: String, required: false},
    //服务记录备注
    comment: {type: String, required: false},
    //创建人ID
    cuserid: {type: Number, required: true},
    //创建人用户名
    cusername: {type: String, required: true},
    //创建人真实姓名
    crealName: {type: String, required: false},
    //创建时间
    ctime: {type: Date, required: false}
});

exports.crm_customer_action_plan = new Schema({
    _id: {type: Number, unique: true, required: true},
    //行动类型
    type: {type: String, required: true},
    //客户ID
    customerId: {type: Number, required: true, index: true},
    //任务ID
    taskId : Number,
    //录音信息
    recording: {type: [String], required: false},
    //预计执行时间
    actionDate: {type: Date, required: true},
    //预计结束时间
    actionEndDate: {type: Date, required: true},
    //见面地点类型
    addressType : {type: String, reqiured: false},
    //约见类型
    meetType : {type: String, required: false},
    //是否提醒
    remind : {type : Boolean, required : false},
    //客户经理ID
    rm: {type: Number, required: false},
    //约见地址
    dateAddress: {type: String, required: false},
    //备注
    comment: {type: String, required: false},
    //创建人ID
    cuserid: {type: Number, required: true},
    //创建人用户名
    cusername: {type: String, required: true},
    //创建人真实姓名
    crealName: {type: String, required: false},
    //创建时间
    ctime : {type : Date, default : Date.now, required : false},
    //最后更新人ID
    uuserid: {type: Number, required: true },
    //最后更新人用户名
    uusername: { type: String, required: true },
    //最后更新人真实姓名
    urealName: { type: String, required: false },
    //最后更新时间
    utime: { type: Date, default: utils.getCurrentDate, required: true},
    //实际执行人用户ID
    doUserid: {type: Number, required: false},
    //实际执行人用户名
    doUsername: {type: String, required: false},
    //实际执行人真实姓名
    doUserRealName: {type: String, required: false},
    //实际执行时间
    doTime: {type: Date, required: false},
    //是否已完成
    done: {type: Boolean, required: false, default: false}
});
exports.crm_customer_action_plan.index({rm : 1}, {sparse : true});

exports.crm_customer_attachment = new Schema({
    //ID
    _id: {type: Number, unique: true, required: true},
    //客户ID
    customerId: {type: Number, required: true, index: true},
    //附件编号
    code: {type: String, unique: true, required: true},
    //附件名称
    name: {type: String, required: true},
    //扩展名
    extension: {type: String, required: false},
    //创建人ID
    cuserid: {type: Number, required: true},
    //创建人用户名
    cusername: {type: String, required: true},
    //创建人真实姓名
    crealName: {type: String, required: false},
    //创建时间
    ctime: {type: String, required: false}
});

exports.crm_tag = new Schema({
    _id: {type: Number, unique: true, required: true},
    //标签类型
    type: { type: String, required: true },
    //标签名称
    name: { type: String, required: true }
});

exports.crm_order = new Schema({
    _id: {type: Number, unique: true, required: true},
    //订单号
    code: {type: String, unique: true, required: true},
    //客户
    customer: {
        customerId: {type: Number, required: true },
        name: {type: String, required: true },
        telNo: {type: String, required: true }
    },
    //产品
    product: {
        productId: {type: Number, required: true },
        name: {type: String, required: true },
        type: {type: String, required: true }
    },
    //状态
    status: {type: String, required: true },
    //订单金额
    amount: {type: Number, required: true },
    //所属机构
    belongOrg: {type: String, required: true },
    //所属区域
    belongArea: {type: String, required: false },
    //备注
    comment: String,
    //派息
    dividend: [
        {
            //成立日
            establishDate: { type: Date, required: true},
            //起息日
            valueDate: { type: Date, required: true},
            //金额
            amount: { type: Number, required: true},
            //备注
            comment: String,
            //创建人ID
            cuserid: {type: Number, required: true },
            //创建人用户名
            cusername: {type: String, required: true },
            //创建人真实姓名
            crealName: {type: String, required: true },
            //创建时间
            ctime: { type: Date, default: utils.getCurrentDate, required: true}
        }
    ],
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, required: true },
    //创建人真实姓名
    crealName: {type: String, required: true },
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true},
    //最后更新人ID
    uuserid: {type: Number, required: true },
    //最后更新人用户名
    uusername: { type: String, required: true },
    //最后更新人真实姓名
    urealName: { type: String, required: true },
    //最后更新时间
    utime: { type: Date, default: utils.getCurrentDate, required: true}
});

exports.crm_orderPRDSign = new Schema({
    _id: {type: Number, unique: true, required: true},
    //订单ID
    orderId : {type: Number, required: true},
    //任务ID
    taskId : {type: Number, required: true},
    //客户
    customer: {
        //客户ID
        customerId: {type: Number, required: true},
        //客户名称
        name: {type: String, required: true},
        //客户电话
        telNo: {type: String, required: true}
    },
    //产品
    product: {
        //产品ID
        productId: {type: Number, required: true},
        //产品名称
        name: {type: String, required: true},
        //产品类型
        type: {type: String, required: true}
    },
    //产品签收状态
    productorSigned: {type: String, required: true},
    //销售签收状态
    salesSigned: {type: String, required: true},
    //下发资料
    productRefData: {
        //下发资料ID
        refDataId: {type: Number, required: true},
        //下发资料名
        name: {type: String, required: true}
    },
    //签收人ID
    signUserid: Number,
    //签收人用户名
    signUsername: String,
    //签收人真实姓名
    signUserRealName: String,
    //签收时间
    signTime: { type: Date, default: utils.getCurrentDate},
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true}
});


exports.crm_callList_request = new Schema({
    _id: {type: Number, unique: true, required: true},
    //数据级别
    level: {type: String, required: true},
    //任务ID
    taskId : {type: Number, required: true},
    //份数
    count: {type: Number, required: true},
    //状态
    status: {type: String, required: true},
    //描述
    comment: String,
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, required: true },
    //创建人真实姓名
    crealName: {type: String, required: true },
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true}
})

exports.crm_customerImpl_batch = new Schema({
    _id: {type: Number, unique: true, required: true},
    //批次名称
    name: {type: String, required: true},
    //数据等级
    dataLevel: {type: String, required: true},
    //采购者
    buyer: {
        //采购者ID
        userid: Number,
        //采购者用户名
        username: String,
        //采购者真是姓名
        realName: String
    },
    //所属区域
    belongArea: {
        //区域编号
        areaCode: {type: String, required: true},
        //区域名称
        areaName: {type: String, required: true}
    },
    //导入数量
    totalCount: {type: Number, required: true},
    //成功导入数量
    successCount: {type: Number, required: true},
    //空闲总数
    freeCount: {type: Number, required: true},
    //可用总数
    availableCount: {type: Number, required: true},
    //非商机总数
    unbcCount: {type: Number, required: true},
    //商机总数
    bcCount: {type: Number, required: true},
    //已拨打总数
    callCount: {type: Number, required: true},
    //未拨打总数
    noCallCount: {type: Number, required: true},
    //分配记录
    assign: [
        {
            //分配数量
            assignCount: {type: Number, required: true},
            //被分配者
            assignTo: [
                {
                    //被分配者ID
                    userid: {type: Number, required: true},
                    //被分配者用户名
                    username: {type: String, required: true},
                    //被分配者真是姓名
                    realName: {type: String, required: true},
                    //被分配数量
                    count: {type: Number, required: true}
                }
            ],
            //分配人用户ID
            userid: {type: Number, required: true},
            //分配人用户名
            username: {type: String, required: true},
            //分配人真实姓名
            realName: {type: String, required: true},
            //分配时间
            ctime: {type: Date, required: true}
        }
    ],
    //备注
    comment: String,
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, required: true },
    //创建人真实姓名
    crealName: {type: String, required: true },
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true},
    //最后更新人ID
    uuserid: {type: Number, required: true },
    //最后更新人用户名
    uusername: { type: String, required: true },
    //最后更新人真实姓名
    urealName: { type: String, required: true },
    //最后更新时间
    utime: { type: Date, default: utils.getCurrentDate, required: true}
});

exports.crm_customer_audit_record = new Schema({
    _id : {type: Number, unique: true, required: true},
    //质检类型
    type : {type: String, required: true},
    //任务表taskId
    taskId : {type: Number, required: true},
    //服务客户
    customer : {
        //客户ID
        customerId : {type: Number, required: true},
        //客户名称
        name : String,
        //客户电话
        telNo : { type: String, required: true },
        //客户状态
        status : { type: String, required: false },
        //微信号
        wechatNo: {type: String, required: false}
    },
    //录音
    recording : [String],
    //通话信息
    call : {
        //通话时间
        callTime : { type: Date, required: true},
        //通话内容
        content : String,
        //通话用户
        callUser : {
            //联系人ID
            userid : {type: Number, required: true},
            //联系人用户名
            username : { type: String, required: true },
            //联系人真实姓名
            realName : { type: String, required: true }
        }
    },
    //质检信息
    audit : {
        //质检结果
        result : { type: String, required: false },
        //质检客户状态
        customerStatus : { type: String, required: false },
        //是否微信电话添加
        wechatTelAdded : { type: String, required: false },
        //是否微信号录入
        wecharInput : { type: String, required: false },
        //备注
        comment : String,
        //质检时间
        auditTime : { type: Date, required: false},
        //质检人
        auditUser : {
            //质检人ID
            userid : {type: Number, required: false},
            //质检人用户名
            username : { type: String, required: false },
            //质检人真实姓名
            realName : { type: String, required: false }
        }
    },
    //是否完成
    done : {
        type: Boolean, required: true
    }

});

//消息 已废弃
exports.crm_message = new Schema({
    _id: {type: Number, unique: true, required: true},
    //类型
    type: {type: String, required: true},
    //状态
    status: {type: String, required: true},
    //是否已推送
    pushed: {type: Boolean, required: true},
    //发送用户
    userId: {type: Number, required: true},
    //消息内容
    content: {type: Schema.Types.Mixed, required: true},
    //创建时间
    ctime: { type: Date, default: utils.getCurrentDate, required: true}
});

//消息任务 已废弃
exports.crm_msgTask = new Schema({
    _id: {type: Number, unique: true, required: true},
    //消息任务类型
    type: {type: String, required: true},
    //消息任务主体
    body: {
        type: {type: String, required: true},
        model: {type: String, required: true},
        data: Schema.Types.Mixed,
        receiverIds: { type: [Number], required: true },
        referenceId: Number
    },
    processed: {type: Boolean, required: true},
    ctime: { type: Date, default: utils.getCurrentDate, required: true}
});

exports.crm_task = new Schema({
    _id: {type: Number, unique: true, required: true},
    refId: {type: Number, required: true},
    refObj: Schema.Types.Mixed,
    type: {type: String, required: true, enum: dictionary.taskType.list()},
    belongUser: {type: [Number], required: true},
    done: {type: Boolean, required: true, default: false},
    lock: {type: Number, default: 0},
    ctime: {type: Date, required: true, default: utils.getCurrentDate},
    doneTime: Date
});

exports.crm_recording = new Schema({
    _id: {type: Number, unique: true, required: true},
    recordId : {type : String, required: true, unique : true},
    customerId: {type: Number, required: true, index : true},
    userId: {type: Number, required: true, index : true},
    ctime: {type: Date, required: true, default: utils.getCurrentDate}
});

exports.crm_wechat_account = new Schema({
    _id: {type: Number, unique: true, required: true},
    code : {type : String, unique : true, required : true},
    telNo : String,
    nickname : {type : String, required : true},
    password : {type : String, required : true},
    deviceId : String,
    deviceNo : Number,
    deviceName : String,
    qq: {type: String},
    contacts : [
        {
            contactId : Number,
            wechatNo : String,
            nickname : String,
            comment : String
        }
    ],
    groups : [
        {
            groupId : Number,
            nickname : String
        }
    ],
    status : {type: String, required: true },
    //沟通人员Id
    commuUserId: {type: Number},
    //沟通人员用户名
    commuUsername : {type: String},
    //沟通人员真实名字
    commuRealName : {type: String},
    //开始沟通时间
    commuStartTime: { type: Date},
    //结束沟通时间
    commuEndTime: { type: Date},
    ctime : { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_account_contact = new Schema({
    _id : {type: Number, unique: true, required: true},
    belongAccount: {
        accountId: {type: Number, required: true, index : true },
        accountCode: {type: String, required: true },
        accountNickname: {type: String, required: true }
    },
    //微信账号
    wechatNo : String,
    //昵称
    nickname : String,
    //备注
    comment : String,
    //性别
    sex : String,
    //行业标签
    industryTags : [String],
    //职位标签
    jobTags : [String],
    //住址标签
    addressTags : [String],
    //标签
    tags : [String],
    //该联系人对应客户的ID
    customerId : Number,
    //对应客户电话
    telNo : String,
    //状态
    status : {type: String, required: true },
    //创建时间
    ctime :  { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_account_group = new Schema({
    _id : {type: Number, unique: true, required: true},
    belongWechatNo : {type : String, required : true},
    nickname : {type : String, required : true},
    members : [
        {
            wechatNo : {type : String, required : true},
            nickname : {type : String, required : true},
            comment : String
        }
    ],
    status : {type : String, required : true},
    ctime : { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_task = new Schema({
    _id : {type: Number, unique: true, required: true},
    //微信账号
    wechatNo : {type : String, required : true, index: true},
    //任务类型
    type : {type : String, required : true},
    //任务内容
    refObj : Schema.Types.Mixed,
    //是否完成
    done : {type : Boolean, required : true},
    //完成时间
    doneTime : Date,
    //优先级
    priority : {type: Number, required: true },
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建时间
    ctime: { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_msg = new Schema({
    _id : {type: Number, unique: true, required: true},
    from : {
        wechatNo : {type :String, index: true},
        nickname : {type :String, index: true},
        comment : {type :String, index: true},
        crmUser : {
            userId : {type: Number, required: false },
            realName : {type : String, required : false}
        }
    },
    to : {
        wechatNo : {type :String, index: true},
        nickname : {type :String, index: true},
        comment : {type :String, index: true}
    },
    group : {
        groupId : Number,
        nickname : String
    },
    content : {type : String, required : true},
    type : {type : String, required : true},
    ctime : { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_user_msg = new Schema({
    _id : {type: Number, unique: true, required: true},
    userId : {type: Number, required: true, index: true},
    accountNo : {type : String, required : true, index: true},
    contactWechatNo : String,
    groupId : Number,
    lastChat : {
        ctime : Date,
        content : String
    },
    type : {type : String, required : true},
    lastTimeStamp : { type: Date, required: true},
    ctime : { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_batch_add_record = new Schema({
    _id : {type: Number, unique: true, required: true},
    count : {type: Number, required: true},
    accountId : {type: Number, required: true},
    accountNickname : {type: String, required: true},
    accountCode : {type: String, required: true},
    repeat : {type: Number, required: false},
    accounts : [String],
    validateMsg : String,
    type : {type: String, required: true},
    cuserid : {type: Number, required: true},
    cusername : {type: String, required: true},
    crealName : {type: String, required: true},
    ctime : { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_account_telNo = new Schema({
    _id : {type: Number, unique: true, required: true},
    accountId : {type: Number, required: true},
    telNo : {type: String, unique: true, require: true},
    status : {type: String, require: true},
    ctime : { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_repeat_batch_add_telNo = new Schema({
    _id : {type: Number, unique: true, required: true},
    accountId : {type: Number, unique: true, required: true},
    utime : { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_attent_nearby = new Schema({
    _id : {type: Number, unique: true, required: true},
    accountId : {type: Number, required: true},
    accountNickname : {type: String, required: true},
    accountCode : {type: String, required: true},
    pos : [],
    posComment : String,
    validateMsg : String,
    count : {type: Number, required: true},
    cuserid : {type: Number, required: true},
    cusername : {type: String, required: true},
    crealName : {type: String, required: true},
    ctime : { type: Date, default: Date.now(), required: true}
});

//exports.crm_wechat_moments = new Schema({
//    _id : {type: Number, unique: true, required: true},
//    //所属账号ID
//    accountCode : {type: String, required: true},
//    contactWechatNo : {type: String, required: true},
//    //动态类型
//    type : {type: String, required: true},
//    //动态简略描述
//    title : String,
//    //动态内容
//    content : String,
//    //转载内容的备注
//    mediaComment : String,
//    //缩略图地址
//    thumbUrl : String,
//    //上传照片的地址
//    photos : [String],
//    //转载的链接地址
//    reprintUrl : String,
//    ctime : { type: Date, default: Date.now(), required: true}
//});

exports.crm_wechat_customer = new Schema({
    _id : {type: Number, unique: true, required: true},
    customerId : Number,
    telNo : {type: String, required: true},
    wechatStatus : {type: String, required: true},
    isContact : {type: Boolean, required: true},
    random : [Number],
    ctime : { type: Date, default: Date.now(), required: true}
});

exports.crm_wechat_account_operate = new Schema({
    _id: {type: Number, unique : true, required: true},
    accountCode : {type: String, required: true},
    operateDate : {type: String, required: true},
    tryCount : {type: Number, default : 0},
    successCount : {type: Number, default : 0},
    authCustomers : [{
        authAccount : String,
        telNo : String,
        nickName : String
    }]
});



exports.crm_import_customer = new Schema({
    _id : {type: Number, unique : true, required: true},
    name :  {type: String, required: true},
    mobile :  {type: String, required: true},
    city : String,
    batchNo :  {type: Number, required: true}
});

exports.crm_wechat_telNo = new Schema({
    telNo : {type: String, require: true}
});


//系统消息
exports.crm_sys_message = new Schema({
    _id : {type: Number, unique : true, required: true},
    //标题
    title : String,
    //消息类型
    type : {type : String, enum : dictionary.sysMessageType.list()},
    //是否已读
    read : {type : Boolean, default : false},
    //接收者
    receiver : {
        userid : Number,
        username : String,
        realName : String
    },
    //被操作人
    beOptPer: {
        userid: Number,
        username: String,
        realName: String
    },
    //消息内容
    content : String,
    //发送时间
    sendTime : {type: Date, required: true, default: utils.getCurrentDate},
    //阅读时间
    readTime : Date
});

//高级客户操作日志
exports.crm_customer_advanced_op_log = new Schema({
    _id : {type: Number, unique : true, required: true},
    //操作类型
    type : {type: String, required: true, enum: dictionary.customerAdvancedOpType.list()},
    //客户ID
    customerId : {type: Number, required: true},
    //操作原因
    reason : {type: String, required: true},
    //操作详情 保存被修改属性的修改前后属性值
    opDetail : [{
        //中文名
        displayName : String,
        //修改前属性值
        preValue : String,
        //修改后属性值
        postValue : String
    }],
    //操作用户
    opUser : {
        uid : Number,
        username : String,
        realName : String
    },
    //操作时间
    opTime : {type: Date, required: true, default: utils.getCurrentDate}
});

//发朋友圈
exports.crm_wechat_moments = new Schema({
    _id : {type: Number, unique: true, required: true},
    //微信账号
    wechatNos : {type : [String], required : true},
    //发朋友圈类型
    type : {type : String, required : true},
    //发朋友圈内容
    refObj : Schema.Types.Mixed,
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建时间
    ctime: { type: Date, default: Date.now(), required: true}
});

//图片库
exports.crm_gallery = new Schema({
    _id : {type: Number, unique: true, required: true},
    //name
    name: {type: String, require: true},
    type: {type: String, require: true},
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建时间
    ctime: { type: Date, default: Date.now(), required: true}
});

//设备信息
exports.crm_wechat_device = new Schema({
    _id : {type: Number, unique: true, required: true},
    //name
    name: {type: String, require: true},
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, require: true},
    //创建人真实姓名
    crealName: {type: String, require: true},
    //创建时间
    ctime: { type: Date, default: Date.now(), required: true}
});


//高净值客户表
exports.crm_wechat_hnwc = new Schema({
    _id:  {type: Number, unique: true, required: true},
    //微信工作号
    accountId :  {type: Number, require: true},
    //微信工作号
    accountCode : {type: String, require: true},
    //客户评级
    rate : {type: String},
    //客户姓名
    name : {type: String},
    //客户联系方式
    telNo : {type: String},
    //客户初步接触情况
    primaryComment : {type: String},
    //备注
    comment: {type: String},
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, require: true},
    //创建人真实姓名
    crealName: {type: String, require: true},
    //创建时间
    ctime: { type: Date, default: Date.now(), required: true},
    //最后修改人ID
    uuserid: {type: Number, required: true },
    //最后修改人用户名
    uusername: {type: String, require: true},
    //最后修改人真实姓名
    urealName: {type: String, require: true},
    //最后修改时间
    utime: { type: Date, default: Date.now(), required: true}
});

//预约约见表
exports.crm_wechat_appoint = new Schema({
    _id:  {type: Number, unique: true, required: true},
    //高净值客户Id
    hnwcId: {type: Number, unique: true, required: true},
    //约见时间
    appointTime: { type: Date, required: true},
    //见面地点类型
    addressType : {type: String, reqiured: true},
    //约见类型
    meetType : {type: String, required: true},
    //客户经理ID
    rm: {type: Number, required: true},
    //创建人ID
    cuserid: {type: Number, required: true },
    //创建人用户名
    cusername: {type: String, require: true},
    //创建人真实姓名
    crealName: {type: String, require: true},
    //是否完成
    isDone: {type: String, required: true, enum: dictionary.isDoneType.list()},
    //备注
    comment: {type: String, required: false},
    //约见情况
    appointComment: {type: String, required: false}
});

exports.crm_gallery_dir = new Schema({
    _id: {type: Number, unique: true, require: true},
    //对应标签的code
    tagCode: {type: String, require: true},
    //创建目录的名称
    name: {type: String, require: true},
    //图片名称
    imageNames: {type: [String], require: true, default: []},
    //创建人ID
    cuserid: {type: Number, require: true },
    //创建人用户名
    cusername: {type: String, require: true},
    //创建人真实姓名
    crealName: {type: String, require: true},
    //创建时间
    ctime: { type: Date, default: Date.now(), required: true}
});

exports.crm_joinus = new Schema({
    _id: {type: Number, unique: true, require: true},
    //办公编码
    officeCode: {type: String, require: true},
    position: String,
    responsibilities: String,
    qualification: String,
    priority: {type: Number, require: true},
    status: {type: Boolean, require: true, default: false},
    //创建人ID
    cuserid: {type: Number, require: true },
    //创建人用户名
    cusername: {type: String, require: true},
    //创建人真实姓名
    crealName: {type: String, require: true},
    //创建时间
    ctime: { type: Date, default: Date.now(), required: true}
});