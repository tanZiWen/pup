
/**
 * Created by wangnan on 14-4-21.
 */

var dictionary = {
    //common
    sex : { male : 'male', female : 'female' },

    //upm
    orgType : { branch : 'branch', department : 'department' },
    userStatus : { ok : 'ok', stop : 'stop', exitWork : 'exitWork', delete : 'delete' },

    userPosition : { rm : 'rm', consultant : 'consultant', dm : 'dm', pm : 'pm', auditor : 'auditor', hr : 'hr', gm : 'gm', 'leader': 'leader', 'sm': 'sm' },

    fnType : { menu : 'menu', fn : 'fn',  fnFragment : 'fnFragment' },
    workerRole : {rm : 'rm', leader : 'leader', worker : 'worker'},

    //crm
    orderStatus : { signed : 'signed', income : 'income', complete : 'complete', cancel : 'cancel' },
    orderPRDSgin : {signed : 'signed', unsigned : 'unsigned'},
    employeeStatus : {working : 'working', exitWork : 'exitWork'},
    productType : {fixed : 'fixed', pe : 'pe', other : 'other'},
    productStatus : {selling : 'selling', hot : 'hot', exit : 'exit'},
    publishStatus: {published: 'published', unpublished: 'unpublished'},
    //客户证件类型
    identityDocType : {identityCard : 'identityCard', driveLicense : 'driveLicense'},
    //客户状态
    customerStatus : {
        potential : 'potential', bc20 : 'bc20', bc40 : 'bc40', bc60 : 'bc60', bc80 : 'bc80', deal : 'deal', vip : 'vip',
        diamondVip: 'diamondVip', crownedVip: 'crownedVip'
    },
    //客户新增状态
    customerAddType : {
        add : 'add', batch : 'batch'
    },

    userRoleCode: {
        dm: 'DM', rm: 'RM', pm: 'PM', auditor: 'AUDITOR', hr: 'HR', consultant: 'CONSULTANT', gm: 'GM', sm: 'SM', um: 'UM', wechatManager: 'wechatManager', wechatWorker: 'wechatWorker'
    },

    userOperatePriority: {
        level1: 'level1', level2: 'level2', level3: 'level3'
    },

    //客户拨打状态
    customerCallStatus : {
        noCall : 'noCall', connected : 'connected', proxyConnected : 'proxyConnected', noResponse : 'noResponse',
        closed : 'closed', busySignal : 'busySignal', refused : 'refused', vacant : 'vacant', reAssign : 'reAssign',
        fax : 'fax'
    },
    //客户质检状态
    customerAuditStatus: {
        auditing: 'auditing', ok: 'ok', reject: 'reject'
    },
    //客户审核状态
    customerReviewStatus: {
        reviewing: 'reviewing', reviewed: 'reviewed', unreviewed: 'unreviewed'
    },
    //客户住房信息
    customerHouseInfos: {
        apartment: 'apartment', personal: 'personal', villa: 'villa', investment: 'investment'
    },
    //客户职业类型
    customerProfessionTypes: {
        seniorExecutive: 'seniorExecutive', busiOwner: 'busiOwner', 'whiteCollar': 'whiteCollar', other: 'other'
    },
   //客户申领状态
    callListRequestStatus : {
        assigned : 'assigned', unassigned : 'unassigned', canceled : 'canceled'
    },
    //客户投资经验类型
    customerInvestmentPreferenceTypes : {
        trust : 'trust', pe : 'pe',  bankFinancing: 'bankFinancing', objectHousing: 'objectHousing',
        stockFuturesMetal: 'stockFuturesMetal', none: 'none', other : 'other'
    },
    //客户投资期限偏好
    customerInvestmentTimePreference: {
        lt2years: 'lt2years', gt2years: 'gt2years'
    },
    //客户风险偏好
    customerVenturePreference: {
        radical: 'radical', conservatives: 'conservatives'
    },
    //客户资金体量
    customerBodyMass : {
        level1 : '300w-500w', level2 : '500w-1000w', level3 : '1000w以上'
    },

    //客户服务记录类型
    customerServiceRecordType : {
        pureCall : 'pureCall', call : 'call', email : 'email', meet : 'meet', order : 'order'
    },
    //客户行动计划类型
    customerActionPlanType : {
        call : 'call', email : 'email', meet : 'meet'
    },
    //客户之间状态
    customerAuditRecordType : {
        bc20 : 'bc20', bc40 : 'bc40'
    },
    //客户等级
    customerLevel : {

    },
    //质检结果
    auditResult : {
        reject : 'reject', ok : 'ok'

    },
    //质检认领状态
    claimStatus: {
        claimed: 'claimed', notClaimed: 'notClaimed'
    },

    workGroupType : {
        consultant : 'consultant', wechat : 'wechat'
    },

    //任务类型
    taskType : {
        //行动计划
        customerActionPlan : 'customerActionPlan',
        //名单申领
        callListRequest : 'callListRequest',
        //质检
        customerAuditRecord : 'customerAuditRecord',
        //文件签收
        orderPRDSign : 'orderPRDSign',
        //客户回收分配
        customerRecycleDistribution : 'customerRecycleDistribution',
        //客户等级提升
        customerLevelPromotion : 'customerLevelPromotion'
    },

    //客户回收分配任务类型
    customerRecycleDistributionType : {
        //晋升
        promotion : 'promotion',
        //离职
        quitOffice : 'quitOffice'
    },

    //高级客户操作类型
    customerAdvancedOpType : {
        //顾问变更
        consultantModify : 'consultantModify',
        //客户经理变更
        rmModify : 'rmModify',
        //顾问和RM都变更
        consultantAndrmModify: 'consultantAndrmModify',
        //客户状态变更
        statusModify : 'statusModify',
        //客户回收
        recycle: 'recycle'
    },

    //客户回收分配优先级
    customerRecycleDistributionPriority: {
        //顾问优先
        consultantPriority: 'consultantPriority',
        rmPrioroty: 'rmPriority'
    },

    //完成状态
    doneType: {
        unfinished: 'unfinished', finished: 'finished'
    },


    //response msg
    resMsgType : {succ : 'success', info : 'info', waring : 'warning', error : 'error'},
    resMsgValue : {succ : 'success', 'error' : 'error'},

    //msg
    msgTaskType : {db : 'db', common : 'common', audit : 'audit', prdRefData : 'prdRefData'},
    dbAction : {save : 'save', del : 'del', update : 'update'},

    msgType : {prdTrend: 'prdTrend', prdRefData: 'prdRefData', fileSign: 'fileSign', meetPlan: 'meetPlan',
    listRequest: 'listRequest', listAssign: 'listAssign', productCreate: 'productCreate', audit: 'audit', checkRst: 'checkRst',
    orderCreate: 'orderCreate', orderDel: 'orderDel'},

    msgStatus : {new : 'new', 'read' : 'read'},

    plan : {check: 'check'},
    planStatus : {on : 'on', off: 'off'},
    messageCountType : {task : 'task', msg : 'msg'},

    wechatContactStatus : {ok : 'ok', del : 'del'},

    wechatMsgType : {contact : 'contact', group : 'group'},

    wechatTaskRefType : {privateMsg : 'privateMsg', groupMsg : 'groupMsg', massMsg : 'massMsg', batchAddContact : 'batchAddContact', attentNearbyPeople : 'attentNearbyPeople', modifyTags : 'modifyTags', shareMoments: 'shareMoments'},

    wechatBatchInsertType : {customize : 'customize', random : 'random'},

    customerWechatStatus : {unknown : 'unknown', opened : 'opened', unopen : 'unopen'},

    //customerHistory
    customerHistoryOperateType : {call : 'call', edit : 'edit', tag : 'tag'},
    //appCode
    appCode: {CRM: 'CRM', UPM: 'UPM'},
    //functionType
    functionType: {menu: 'menu', fn: 'fn'},
    //menuCRM
    menuCRM: {customer: 'customer', product: 'product', order: 'order', employee: 'employee', dataManage: 'dataManage', online: 'online', audit: 'audit'},
    //menuUPM
    menuUPM: { user: 'user'},
    //fn
    fn: {
        customerInfo: 'customerInfo', customerRequest: 'customerRequest',
        callListManage: 'callListManage', productList: 'productList',
        orderList: 'orderList', auditList: 'auditList',
        employeeList: 'employeeList', signList: 'signList',
        onlineList: 'onlineList', planManage: 'planManage',
        accountList: 'accountList', userList: 'userList', roleList: 'roleList'
    },

    //系统消息类型
    sysMessageType : {
        error : 'error', warn : 'warn', info : 'info'
    },

    //是否阅读
    isRead: {
        readed: true, unreaded: false
    },

    //朋友圈消息类型
    momentsMsgType: {
        image: 'image',
        text: 'text',
        url: 'url'
    },

    //客户评级
    customRateType: {
        high: 'high',
        middle: 'middle',
        low: 'low'
    },
    //是否完成约见
    isDoneType: {
        finished: 'finished',
        unfinished: 'unfinished',
        canceled: 'canceled'
    },
    galleryType: {
        wechatMoment: 'wechatMoment',
        news: 'news'
    },
    newsType: {
        newsCompany: 'newsCompany',
        newsMedia: 'newsMedia'
    },
    strategyType: {
        strategyResearch: 'strategyResearch'
    },
    channelPath: {
        newsCompany: '/news/company',
        newsMedia: '/news/media',
        strategyResearch: '/strategy/research'
    },
    channelType: {
        news: 'news',
        strategy: 'strategy'
    }
};

var dictTypes = {
    sex: 'sex', orgType: 'orgType', userStatus: 'userStatus', userPosition: 'userPosition',
    fnType: 'fnType', orderStatus: 'orderStatus', employeeStatus: 'employeeStatus', productType: 'productType',
    productStatus: 'productStatus', orderPRDSign : 'orderPRDSign', customerStatus : 'customerStatus', customerCallStatus : 'customerCallStatus',
    customerDataLevel : 'dataLevel', callListRequestStatus : 'callListRequestStatus',
    customerInvestmentPreferenceTypes: 'customerInvestmentPreferenceTypes', customerBodyMass : 'customerBodyMass',
    customerServiceRecordType : 'customerServiceRecordType', customerActionPlanType : 'customerActionPlanType',
    customerLevel : 'customerLevel', identityDocType : 'identityDocType', taskType : 'taskType', customerAuditRecordType : 'customerAuditRecordType',
    wechatBatchInsertType : 'wechatBatchInsertType', customerWechatStatus : 'customerWechatStatus',
    customerAddressType : 'customerAddressType', customerMeetType: 'customerMeetType', customerAuditResult: 'customerAuditResult',
    customerHistoryOperateType : 'customerHistoryOperateType', customerAuditStatus: 'customerAuditStatus', customerHouseInfos: 'customerHouseInfos',
    customerProfessionTypes: 'customerProfessionTypes', customerInvestmentTimePreference: 'customerInvestmentTimePreference',
    customerVenturePreference: 'customerVenturePreference', claimStatus: 'claimStatus', doneType: 'doneType',customerAddType: 'customerAddType',
    //客户回收分配任务类型
    customerRecycleDistributionType: 'customerRecycleDistributionType',
    //高级客户操作类型
    customerAdvancedOpType : 'customerAdvancedOpType',
    //系统消息类型
    sysMessageType : 'sysMessageType',
    //是否阅读
    isRead: 'isRead',
    //客户回收分配优先级
    customerRecycleDistributionPriority: 'customerRecycleDistributionPriority',
    //客户审核状态
    customerReviewStatus: 'customerReviewStatus',
    //朋友圈类型
    momentsMsgType: 'momentsMsgType',
    //客户评级类型
    customRateType: 'customRateType',
    //是否完成约见
    isDoneType: 'isDoneType',
    //产品发布状态
    publishStatus: 'publishStatus',
    //新闻类型
    newsType: 'newsType',
    //办公室类型
    officeType: 'officeType'
};

exports.dictTypes = dictTypes;

var _ = require('underscore');

function list() {
    return _.filter(_.values(this), function(value) {
        if(_.isString(value)) {
            return true;
        }
    });
}

for(var key in dictionary) {
    dictionary[key].list = list;
    exports[key] = dictionary[key];
}
