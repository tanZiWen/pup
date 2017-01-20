/**
 * Module dependencies.
 */

//-init global
require('./globalExtention');

//-init app
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var moment = require('moment');
var jwt = require('express-jwt');

moment.lang('zh-cn');

var app = express(),
    sio = require('socket.io'),
    server = http.createServer(app),
    mapping = require('./app/crm/webSocket'),
    io = sio.listen(server),
    ioMiddleware = require('./lib/socketioMiddleware.js')(io),
    sender = require('./routes/sender'),
    eventReceiver = require('./event/Receiver.js'),
    wechatBatchRecord = require('./app/crm/wechat/batchRecord'),
    sioHelper = require('./lib/sioHelper.js'),

    G = require('./lib/global.js');

var _ = require('underscore'),
    userOperateLogDao = require('./db/upm/userOperateLogDao');
    _s = require('underscore.string');


var redis = require('redis');
var sessionClient = redis.createClient(global.appCfg.redis.port, global.appCfg.redis.host, {"return_buffers": true});
var RedisStore = require('connect-redis')(express);
var session = express.session({ store: new RedisStore({client: sessionClient, prefix: "ps:", ttl: global.appCfg.sessionTimeout.redis}), key: 'pups', cookie: { maxAge: global.appCfg.sessionTimeout.cookie }});
var domain = require('domain');
var serverDomain = domain.create();
var appLogger = global.lib.logFactory.getAppLogger();
var logger = global.lib.logFactory.getModuleLogger(module);
var dbs = require('./db/dbs');
var multer = require('multer');
var groupHandlers = require('express-group-handlers');


serverDomain.on('error', function(err) {
    appLogger.error('[server domain] : ' + err.stack);
});
wechatBatchRecord(io);
eventReceiver(io);
sioHelper.setup(io);
eventReceiver.reissueMsg();

// all environments

app.set('port', process.env.PORT || 10086);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('pups'));
app.use(function(req, res, next) {
    var serverDomain = domain.create();
    serverDomain.on('error', function(err) {
        if(!err) {
            err = {msg : "noting"};
        }
        appLogger.error('[server domain] : ' + JSON.stringify(err));
    });
    serverDomain.add(req);
    serverDomain.add(res);
    serverDomain.run(next);
});
//app.use(session);
//app.use(express.session({ store: new RedisStore }));


/**
 * App configuration.
 */

app.configure(function () {
    app.use(io.settings.resource, ioMiddleware);
});

app.use('/auth/user', express.static(__dirname +'/heatcanvas'));

app.use(function (req, res, next) {
    res.set({
        'Access-Control-Allow-Origin' : res.get('Origin'),
        'Access-Control-Allow-Credentials' : 'true',
        'Access-Control-Allow-Methods' : 'POST, PUT, GET, OPTIONS, DELETE',
        'Access-Control-Max-Age' : '3600',
        'Access-Control-Allow-Headers' : 'Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With'
    });
    if(req.session && req.session.user) {
        res.locals.session = req.session;
        sessionClient.expire('ps:user:' + req.session.id, appCfg.sessionTimeout.redis);
    }
    next();
});

console.log(G.UPLOAD_TMP_PATH);

app.use(multer({ dest: G.UPLOAD_TMP_PATH}));
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

groupHandlers.setup(app);

// development only
if ('product' == app.get('env')) {
    app.use(function(err, req, res, next) {
        logger.error(error);
        if(req.xhr) {
            res.send(500, {errMsg : err.msg});
        } else {
            res.status(500);
            res.render('error', {error : err});
        }
    });
} else {
    app.use(express.errorHandler());
}

//support reverse proxy in the front
if(appCfg.reverseProxy) {
    app.enable('trust proxy');
}


var auth = require('./routes/auth.js'),
	portal = require('./app/portal'),
	crm = require('./app/crm'),
	customer = require('./app/crm/customer.js'),
    customerPlanManage = require('./app/crm/customerPlanManage.js'),
    customerBatch = require('./app/crm/customerBatch.js'),
    customerServiceRecord = require('./app/crm/customerServiceRecord.js'),
    customerActionPlan = require('./app/crm/customerActionPlan'),
    customerAttachment = require('./app/crm/customerAttachment'),
    customerOrder = require('./app/crm/customerOrder'),
    workGroup = require('./app/crm/workGroup.js'),
	product = require('./app/crm/product.js'),
    productTrend = require('./app/crm/productTrend.js'),
    productRefData = require('./app/crm/productRefData.js'),
    productAttachment = require('./app/crm/productAttachment.js'),
    order = require('./app/crm/order.js'),
    audit = require('./app/crm/audit.js'),
    employee = require('./app/crm/employee.js'),
    user = require('./app/crm/user.js'),
    online = require('./app/crm/online.js'),
    callListRequest = require('./app/crm/callListRequest'),
    template = require('./routes/template'),
    task = require('./app/crm/task.js'),
    wechat = require('./app/crm/wechat/wechat.js'),
    batchRecord = require('./app/crm/wechat/batchRecord.js'),
    attentNearby = require('./app/crm/wechat/attentNearby.js'),
    recording = require('./app/crm/recording.js'),
    examplePageLoad = require('./app/example/pageLoad'),
    example = require('./app/example/example'),
    changePwd = require('./app/upm/changePwd'),
    message = require('./app/crm/message'),
    news = require('./app/crm/news'),
    joinus = require('./app/crm/joinus.js'),
    cryptoHelper = require('./lib/cryptoHelper'),
    routerFilter = require('./routes/routerFilter'),
    test = require('./temp/test'),
    auditStatusRepair = require('./temp/auditStatusRepair'),
    customerCodeRepair = require('./temp/customerCodeRepair');
    //auditMismatch = require('./temp/auditMismatch');
    //mergerAccount = require('./temp/mergerAccount');
    //accountSucc = require('./temp/accountSucc');
    //wehcatAccountContact = require('./temp/wechatAccountContact');

var upmGroup = require('./app/upm/workGroup');

app.get('/login', auth.loginForm);
app.post('/login', auth.login);
app.get('/logout', auth.logout);

app.get('/forgetPwd', auth.forgetPwd);
app.get('/validateUsername', auth.validateUsername);
app.get('/sendVerifyCode', auth.sendVerifyCode);
app.get('/verifyCode', auth.verifyCode);
app.put('/changePwd', auth.changePwd);
app.get('/setPwd', auth.setPwd);
app.put('/setPwd', auth.changePwd);

app.get('/register', auth.registerForm);
app.post('/register', auth.register);

app.get('/template', template.get);
app.get('/template/config', template.getConfig);

var routeList = function(app) {
    app.post('/changePwd', changePwd.changePwd);
    app.get('/portal/appList', portal.listApp);
    app.get('/:appCode/main', portal.showApp);
    app.get('/crm', crm.index);

    app.beforeEach(routerFilter.customerFilter, function(app) {
        app.get('/crm/customer/list', customer.list);
        app.get('/crm/customer/list/table', customer.listData);
        app.get('/crm/customer/detail', customer.detail);
        app.get('/crm/customer/callList/list', customer.callList);
        app.get('/crm/customer/callList/listTable', customer.callListData);
        app.get('/crm/customer/callList/detail', customer.callListDetail);
        app.post('/crm/customer/callList/save', customer.callListSave);
        app.get('/crm/customer/callList/next', customer.callListNext);
        app.get('/crm/customer/custm/addList', customer.addList);
        app.post('/crm/customer/custm/create', customer.create);
        app.get('/crm/customer/custm/editList', customer.editList);
        app.post('/crm/customer/custm/edit', customer.edit);
        app.post('/crm/customer/custm/attachmentAdd', customer.attachmentAdd);
        app.get('/crm/customer/custm/attachmentList', customer.attachmentList);

        app.get('/crm/customer/custm/orderDataList', customer.orderDataList);
        app.post('/crm/customer/custm/orderAdd', customer.orderAdd);
        app.post('/crm/customer/custm/actionPlanAdd', customer.actionPlanAdd);
        app.post('/crm/customer/custm/actionPlanDel', customerActionPlan.delete);
        app.get('/crm/customer/custm/actionPlanList', customer.actionPlanList);

        app.get('/crm/customerServiceRecord/list', customerServiceRecord.listData);
        app.get('/crm/customerActionPlan/list', customerActionPlan.listData);
        app.get('/crm/customerActionPlan/complete', customerActionPlan.toComplete);
        app.post('/crm/customerActionPlan/complete', customerActionPlan.complete);
        app.get('/crm/customerActionPlan/mod', customerActionPlan.toMod);
        app.post('/crm/customerActionPlan/mod', customerActionPlan.mod);
        app.get('/crm/customerActionPlan/schedule/list', customerActionPlan.listUserSchedule);
        app.get('/crm/customerActionPlan/schedule', customerActionPlan.schedule);
        app.get('/crm/customerAttachment/list', customerAttachment.listData);
        app.get('/crm/customerAttachment/download', customerAttachment.download);
        app.get('/crm/customerOrder/list', customerOrder.listData);
        app.get('/crm/customerTag/view', customer.tag);
        app.post('/crm/customerTag/modify', customer.tagModify);
        app.get('/crm/customer/callList/auditInfo', audit.auditInfo);

        app.get('/crm/order/list', order.list);
        app.get('/crm/order/dataList', order.dataList);
        app.get('/crm/order/detail', order.detail);
        app.post('/crm/order/detail', order.view);
        app.get('/crm/order/signList', order.signList);
        app.get('/crm/order/signDataList', order.signDataList);
        app.get('/crm/order/sign', order.sign);
        app.post('/crm/order/modify', order.modify);
        app.post('/crm/order/dividend', order.dividend);
        app.get('/crm/order/dividendList', order.dividendList);
        app.delete('/crm/order/:id', order.remove);
        app.get('/crm/order/:id', order.detail);
        app.get('/crm/online/list', online.list);
        app.get('/crm/online/account', online.account);
        app.get('/crm/online/wachatList', online.wachatList);
        app.post('/crm/online/findOrSave', online.findOrSave);
        app.post('/crm/online/addCount', online.addCount);
        app.post('/crm/online/addInfo', online.addInfo);

        app.get('/crm/online/dataList', online.dataList);
        app.post('/crm/online/modifyInfo', online.modifyInfo);
        app.get('/crm/online/detailList', online.detailList);
        app.get('/crm/online/accountListTable',online.accountListTable);
        app.get('/crm/online/accountContact',online.accountContact);
        app.post('/crm/online/dataList', online.dataList);
        app.post('/crm/recording/add', recording.add);

        app.get('/crm/customer/data/list', callListRequest.list);
        app.get('/crm/customer/callListRequest/dataList', callListRequest.dataList);
        app.post('/crm/customer/callListRequest/create', callListRequest.create);
        app.get('/crm/customer/callListRequest/unassignCount', callListRequest.unassignCount);


        app.get('/crm/customer/myRecord', customer.myRecord);
        app.get('/crm/customer/myRecordModal', customer.myRecordModal);
        app.get('/crm/customer/:id', customer.detail);

        app.get('/crm/customer/custm/appointConsultant', customer.appointConsultant);
        app.post('/crm/customer/custm/appointConsultant/editConsultant:id', customer.editBelongUser);

    });

    app.beforeEach(routerFilter.pmFilter, function(app) {
        app.get('/crm/product/list', product.list);
        app.get('/crm/product/dataList', product.dataList);
        app.get('/crm/product/news', product.news);
        app.post('/crm/product/create', product.create);
        app.get('/crm/product/detail', product.detail);
        app.post('/crm/product/modify', product.modify);
        app.get('/crm/product/publishList', product.publishList);
        app.get('/crm/product/publishListTable', product.publishListTable);
        app.post('/crm/product/publishAll', product.publish);
        app.post('/crm/productTrend/mkdir', product.mkdir);
        app.post('/crm/product/publish/:id', product.publish);
        app.post('/crm/productTend/uploadImage', product.uploadImage);
        app.get('/crm/productTrend/addTrend/getInfo', product.getImageDir);
        app.get('/crm/productTrend/getImageDir', product.getImageDir);
        app.get('/crm/productTrend/imageView', product.imageView);
        app.get('/crm/product/trendData', product.trendData);
        app.get('/crm/product/newsDataList', product.newsDataList);
        app.get('/crm/product/news/showAdd', product.getImageDir);
        app.get('/crm/product/:id', product.view);

        app.delete('/crm/product/trend/delete/:id', product.delTrend);

        app.get('/crm/productTrend/dataList', productTrend.dataList);
        app.get('/crm/productTrend/latestList', productTrend.latestList);
        app.post('/crm/productTrend/create', productTrend.create);
        app.put('/crm/productTrend/modify', productTrend.modify);

        app.get('/crm/productRefData/dataList', productRefData.dataList);
        app.get('/crm/productRefData/latestList', productRefData.latestList);
        app.post('/crm/productRefData/create', productRefData.create);

        app.get('/crm/productAttachment/dataList', productAttachment.dataList);
        app.get('/crm/productAttachment/latestList', productAttachment.latestList);
        app.post('/crm/productAttachment/create', productAttachment.create);
        app.get('/crm/productAttachment/download', productAttachment.download);

        app.post('/crm/product/tag/add', product.tagAdd);
        app.get('/crm/product/news/getTags', product.getTags);
        app.get('/crm/product/image/showUploadImage', product.getTags);
        app.post('/crm/product/image/upload', product.upload);

    });

    app.beforeEach(routerFilter.dataManageFilter, function(app) {
        app.get('/crm/customer/data/manage', customer.dataManage);
        app.get('/crm/customer/data/request', customer.requestList);
        app.get('/crm/customer/data/assignMenu', customer.assignMenu);
        app.get('/crm/customer/data/toAssign', customer.toAssign);
        app.get('/crm/customerBatch/dataList', customerBatch.dataList);
        app.get('/crm/callListRequest/:id', callListRequest.view);
        app.get('/crm/workGroup/list', workGroup.getGroups);
        app.post('/crm/customerBatch/assign', customerBatch.assign);
        app.get('/crm/customer/data/importMenu', customer.importMenu);
        app.get('/crm/customer/data/historyMenu', customer.historyMenu);
        app.get('/crm/customer/data/recycleMenu', customer.recycleMenu);
        app.get('/crm/customer/data/recycleDM', customer.recycleDM);
        app.post('/crm/customer/data/recycleData', customer.recycleData);
        app.post('/crm/customer/data/reallocateData', customer.reallocateData);
        app.get('/crm/customer/data/reallocate', customer.reallocate);
        app.get('/crm/customer/data/recycleList', customer.recycleList);
        app.post('/crm/customerBatch/create', customerBatch.create);
        app.post('/crm/customerBatch/fileUpload', customerBatch.fileUpload);

        app.get('/crm/customerBatch/count', customerBatch.count);
        app.get('/crm/customerBatch/historyDataList', customerBatch.historyDataList);
        app.get('/crm/customerBatch/batchDetailDataList', customerBatch.batchDetailDataList);

        app.delete('/crm/customer/callListRequest/:id', callListRequest.delete);

        app.get('/crm/customer/custAdvanced/list', customer.customerAdvancedList);
        app.get('/crm/customer/custAdvanced/listTable', customer.customerAdvancedListTable);
        app.get('/crm/customer/custAdvanced/status', customer.customerStatus);
        app.get('/crm/customer/custAdvanced/consultant', customer.customerConsultant);
        app.get('/crm/customer/custAdvanced/rm', customer.customerRM);
        app.get('/crm/customer/custAdvanced/basicInfo', customer.basicInfo);
        app.post('/crm/customer/custAdvanced/editStatus/:id', customer.editStatus);
        app.post('/crm/customer/custAdvanced/editConsultant/:id', customer.editConsultant);
        app.post('/crm/customer/custAdvanced/editRM/:id', customer.editRM);
        app.post('/crm/customer/custAdvanced/exportCustomerList', customer.exportCustomerList);
        app.get('/crm/customer/custAdvanced/multiModify', customer.multiModifyInfo);
        app.post('/crm/customer/custAdvanced/confirmNumberOverVlaue', customer.confirmNumberOverVlaue);
        app.get('/crm/customer/custAdvanced/multiModifyTable', customer.multiModifyTable);
        app.post('/crm/customer/custAdvanced/multiModifyCust',customer.multiModifyCust);
        app.get('/crm/customer/data/statisticList', customer.statisticList);
        app.get('/crm/user/getWorkGroupUsers', user.list);
    });


    app.beforeEach(routerFilter.auditorFilter, function(app) {
        app.get('/crm/audit/listData', audit.listData);
        app.get('/crm/audit/listData', audit.listData);
        app.get('/crm/audit/detail', audit.detail);
        app.get('/crm/audit/actionPlanList', audit.actionPlanList);
        app.get('/crm/audit/serviceRecordList', audit.serviceRecordList);
        app.post('/crm/audit/auditClaim', audit.auditClaim);
        app.get('/crm/audit/list', audit.list);
        app.post('/crm/audit/add/:id', audit.add);
    });

    app.beforeEach(routerFilter.actionPlanFilter, function(app) {
        app.get('/crm/customer/plan/list', customerPlanManage.list);
        app.get('/crm/customer/plan/listTable', customerPlanManage.listTable);
        app.post('/crm/customer/plan/detail', customerPlanManage.detail);
        app.get('/crm/audit/record', audit.getInfo);
        app.get('/crm/audit/recordModal', audit.recordModal);
    });

    app.beforeEach(routerFilter.umFilter, function(app) {
        app.get('/crm/employee/list', employee.list);
        app.get('/crm/employee/dataList', employee.dataList);
        app.post('/crm/employee/add', employee.add);
        app.post('/crm/employee/code', employee.code);
        app.post('/crm/employee/modify', employee.modify);
        app.post('/crm/employee/:id', employee.view);
        app.delete('/crm/employee/:id', employee.delete);

        app.get('/crm/user/userListByArea', user.userListByArea);
        app.get('/crm/user/departingLeaveUsers',user.departingLeaveUsers);
        app.get('/upm/role/list', user.roleList);
        app.post('/ump/user/function/:id', user.functionList);
        app.get('/upm/user/listData', user.listData);
        app.get('/upm/user/list', user.listInfo);
        app.get('/upm/user/listEmployee', user.dataList);
        app.get('/upm/user/dataInfo', user.dataInfo);
        app.post('/upm/user/add', user.add);
        app.post('/upm/user/view', user.data);
        app.get('/upm/user/detail', user.detail);
        app.post('/upm/user/edit', user.edit);
        app.post('/upm/user/delete', user.delete);
        app.get('/upm/group/list', upmGroup.list);
        app.get('/upm/group/listData', upmGroup.listData);
        app.post('/crm/group/create', upmGroup.create);
        app.post('/crm/group/edit', upmGroup.edit);
        app.get('/upm/group/data', upmGroup.get);
        app.delete('/crm/group/:id',upmGroup.delete);

        app.get('/org/:id/users', user.findAllByOrg);
        app.get('/users', user.list);
    });

    app.beforeEach(routerFilter.wechatFilter, function(app) {
        app.get('/crm/wechat/chatRoom', wechat.chatRooms);
        app.get('/crm/wechat/contactList', wechat.contactList);
        app.get('/crm/wechat/msgContactList',wechat.msgContactList);
        app.get('/crm/wechat/accountList', wechat.accountList);
        app.get('/crm/wechat/historyList', wechat.historyList);
        app.get('/crm/wechat/activityList', wechat.activityList);
        app.post('/crm/wechat/contact/modifyTags', wechat.modifyTags);
        app.post('/crm/wechat/contact/avatar/upload', wechat.avatarUpload);
        app.post('/crm/wechat/contact/moments/upload', wechat.momentsUpload);
        app.get('/crm/wechat/avatar/:id', wechat.avatar);
        app.get('/crm/wechat/moments/:id', wechat.momentsPhoto);
        app.get('/crm/wechat/contact/:id', auth.checkAuth, wechat.contactDetail);

        app.get('/crm/wechat/batchRecordList', batchRecord.batchRecordList);
        app.get('/crm/wechat/batchRecordDataList', batchRecord.batchRecordDataList);
        app.post('/crm/wechat/batchRecord/add', batchRecord.create);

        app.get('/crm/wechat/editWechatAccount',batchRecord.editWechatAccount);
        app.post('/crm/wechat/wehcatEdit/edit', batchRecord.edit);
        app.get('/crm/wechat/momentsMsg', batchRecord.momentsMsg);
        app.post('/crm/wechat/momentsMsg/add', batchRecord.momentsMsgAdd);
        app.get('/crm/wechat/momentsMsgTable', batchRecord.momentsMsgTable);
        app.post('/crm/wechat/momentsMsg/uploadImage', batchRecord.uploadImage);
        app.get('/crm/wechat/momentsImageList', batchRecord.imageList);
    });

    app.beforeEach(routerFilter.wechatManageFilter, function(app) {
        app.get('/crm/wechat/addListTable', batchRecord.addListTable);
        app.get('/crm/wechat/addList', batchRecord.addList);
        app.post('/crm/wechat/wehcatAdd/add', batchRecord.add);
        app.post('/crm/wechat/device/add', batchRecord.deviceAdd);
        app.get('/crm/wechat/deviceTable', batchRecord.deviceTable);
        app.get('/crm/wechat/HNWC', batchRecord.HNWC);
        app.get('/crm/wechat/HNWC/:accountId', batchRecord.contactsTel);
        app.get('/crm/wechat/HNWCTable', batchRecord.HNWCTable);
        app.post('/crm/wechat/addHNWC',batchRecord.addHNWC);
        app.get('/crm/wechat/editHNWCList', batchRecord.editHNWCList);
        app.post('/crm/wechat/editHNWC', batchRecord.editHNWC);
        app.get('/crm/wechat/HNWCDetail', batchRecord.HNWCDetail);
        app.post('/crm/wechat/addAppointManage', batchRecord.addAppointManage);
        app.get('/crm/wechat/appointManageList', batchRecord.appointManageList);
        app.post('/crm/wechat/appointResult', batchRecord.appointResult);
        app.get('/crm/wechat/HNWCManage', batchRecord.HNWCManage);
        app.get('/crm/wechat/HNWCManageList', batchRecord.HNWCManageList);

        app.get('/crm/wechat/attentNearbyList', attentNearby.attentNearbyList);
        app.get('/crm/wechat/attentNearbyDataList', attentNearby.attentNearbyDataList);
        app.post('/crm/wechat/attentNearby/add', attentNearby.create);
    });

    app.get('/crm/news/list', news.list);
    app.post('/crm/news/upload/:code', news.upload);
    app.post('/crm/news/add', news.add);
    app.get('/crm/news/imageView', news.imageView);
    app.get('/crm/news/dataList', news.dataList);
    app.delete('/crm/news/delete', news.delete);
    app.get('/crm/new/modifyData/:id', news.modifyData);
    app.put('/crm/news/modify', news.modify);

    app.get('/crm/strategy/list', news.lists);
    app.post('/crm/strategy/add', news.add);
    app.get('/crm/strategy/dataList', news.dataList);
    app.delete('/crm/strategy/delete', news.delete);
    app.get('/crm/strategy/modifyData/:id', news.modifyData);
    app.put('/crm/strategy/modify', news.modify);
    app.post('/crm/strategy/upload/:code', news.upload);

    app.get('/crm/joinus/list', joinus.list);
    app.get('/crm/joinus/dataList', joinus.dataList);
    app.post('/crm/joinus/add', joinus.add);
    app.get('/crm/joinus/modifyData/:id', joinus.modifyData);
    app.put('/crm/joinus/modify/:id', joinus.modify);
    app.delete('/crm/joinus/delete/:id', joinus.delete);

    app.get('/crm/message/list', message.list);
    app.post('/crm/message/messageContent/:id', message.content);


    app.get('/external/auth', auth.externalAuth);

    app.get('/', routes.index);

    app.get('/crm/task/list', task.list);
    app.get('/crm/task/listData', task.listData);
    app.get('/crm/task/customerRecycleDistribution', task.customerRecycleDistributionShow);
    app.post('/crm/task/customerRecycleDistribution', task.customerRecycleDistributionSubmit);
    app.get('/crm/task/recycleDistributionDeatil', task.recycleDistributionDetail);
    app.get('/crm/task/customerLevelPromotion', task.customerLevelPromotion);
    app.post('/crm/task/customerRecycleDistribution/getAllGroupLeaders', task.getAllGroupLeaders);
    app.post('/crm/task/customerRecycleDistribution/convertLeader', task.convertLeader);
    app.post('/crm/task/customerLevelPromotion/reject/:taskId', task.customerLevelPromotionReject);
    app.post('/crm/task/customerLevelPromotion/success/:taskId', task.customerLevelPromotionSuccess);
};

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
}

var jwtHandler = jwt({
    secret:fs.readFileSync(G.PRIVATE_KEY),
    credentialsRequired: false,
    userProperty: 'jwt',
    getToken: function(req) {
        var cookies = parseCookies(req);
        session = {};
        var token = "";
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        } else if (cookies.authorize_token) {
            token = cookies.authorize_token;
        }else if (req.query && req.query.code) {
            token = req.query.code;
        }
        session.id = token;
        req.session = session;
        return token;
    }
});

app.beforeEach(jwtHandler, auth.checkAuth, routeList);

app.get('/redis/delete', test.deleteReidsCache);
//test example
app.get('/example/pageLoad/show', auth.checkAuth, examplePageLoad.show);
app.get('/example/calendar', example.calendarExample);
app.get('/example/uicontroller', example.uicontroller);


var nicknames = {};

io.set('log level', 2);

io.set('authorization', function (req, res, handshake, accept) {
    var ua = handshake.headers['user-agent'];
    var version = handshake.headers['v'] || '0';

    if(_s.isBlank(ua)){
        return accept('No user agent found.', false);
    }

    ua = ua.toLowerCase();

    console.log('UA: ' + ua + ', VERSION: ' + version);
    var platform;

    if (_s.contains(ua, 'android')) {
        platform = 'a';
    } else {
        platform = 'b';//browser
    }

    handshake.v = version;
    handshake.p = platform;

    if(!req.session) {
        return accept('No session', false);
    }

    if(platform == 'a') {
        if(!req.session.user) {
            req.session.user = {"nickname": "guest"};
        }
    } else {
        if(!req.session || !req.session.user) {
            return accept('No session', false);
        }
    }

    handshake.session = req.session;

    return accept(null, true);
});


var count = 0;
var usernameMap = {};

io.sockets.on('connection',function (socket) {
    var clientAppVersion = socket.handshake.p + socket.handshake.v;
    console.log('Client version: ' + clientAppVersion);
    count++;
    _.each(mapping, function(value, key) {
        var handler;

        if(typeof value === 'function') {
            handler = value;
        } else {
            if(value === Object(value)) {
                if(!_.isEmpty(clientAppVersion) && typeof value[clientAppVersion] === 'function') {
                    handler = value[clientAppVersion];
                } else if(typeof value['all'] === 'function') {
                    handler = value['all'];
                }
            } else {
                console.error('Bad handler mapping to event ' + key + ', the handler shoule be a function.');
            }
        }

        if(!handler) {
            console.info('Skip event ' + key + ', not supported in version: ' + clientAppVersion);
        } else {
            console.info("Add listener to event " + key);
            if(value.length == 3) {
                socket.on(key, function(message) {
                    return handler(io, socket, message);
                });
            } else {
                socket.on(key, function(message, fn) {
                    handler(io, socket, message, fn);
                });
            }
        }
    });

    var user = socket.handshake.session.user;

    socket.emit("welcome", user);

    if(user._id) {
        usernameMap[socket.id] = user.realName;
        socket.join('r:' + user._id);
        io.sockets.in('r:1000001').emit('usernum',{number:count, usernames : _.values(usernameMap)});
    } else {
        usernameMap[socket.id] = 'android客户端';
        socket.join('r:guest');
    }

    socket.on('disconnect', function () {
        count --;
        delete usernameMap[socket.id];
        io.sockets.in('r:1000001').emit('usernum',{number:count, usernames : _.values(usernameMap)});
        if (!socket.nickname) return;

        delete nicknames[socket.nickname];
        socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
        socket.broadcast.emit('nicknames', nicknames);
    });

});

server.on('close', function() {
    dbs.close();
    console.log('server closed');
    appLogger.error('[server close]');
});

process.on('exit', function(code) {
    console.log('[process exit] : code:' + code);
    appLogger.error('[process exit] : code:' + code);
});

process.on('uncaughtException', function(err) {
    console.log('[process uncaughtException] : code:' + err.stack);
    appLogger.error('[process uncaughtException] : code:' + err.stack);
});

exports.server = server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
