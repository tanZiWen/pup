/**
 * Created by wangnan on 14-4-24.
 */

exports.templates = {
    'example.pageLoad.show' : {
        'requestUrl' : '/example/pageLoad/show'

        /** default to #main, jquery selector expression */
        //'targetSelector' : '#main',

        /** default to true */
        //'templateCache' : true,

        /** default to '/template', do not change */
        //'templateUrl' : '/template',

        /** default to requestUrl */
        //'templateName' : '',

        /** default to true */
        //'data' : true,

        /** default to true */
        //'dataCache' : true,

        /** default to 'GET' */
        //'dataRequestType' : 'GET',

        /** default to requestUrl */
        //'dataUrl' : '',

        /** default to {} */
        //'dataParams' : {}
    },
    'customer' : {
        'requestUrl' : '/crm/customer/index',
        'data' : false
    },
    'customer.list' : {
        'requestUrl' : '/crm/customer/custm/list',
        'targetSelector' : '#customerContent',
        'dataUrl' : '/crm/customer/list'
    },
    'customer.list.table' : {
        'requestUrl' : '/crm/customer/custm/listTable',
        'targetSelector' : '#customerListTable',
        'dataUrl' : '/crm/customer/list/table'
    },
    'customer.add' : {
        'requestUrl' : '/crm/customer/custm/add',
        'targetSelector' : '#modalCustomerAddModal',
        'dataUrl' : '/crm/customer/custm/addList'
    },
    'customer.edit' : {
        'requestUrl' : '/crm/customer/custm/edit',
        'targetSelector' : '#customerEditModal',
        'dataUrl' : '/crm/customer/custm/editList'
    },
    'customer.tag' : {
        'requestUrl' : '/crm/customer/custm/tag',
        'targetSelector' : '#customerTagModal',
        'dataUrl' : '/crm/customerTag/view'
    },
    'customer.actionPlanAdd' : {
        'requestUrl' : '/crm/customer/custm/actionPlanAdd',
        'targetSelector' : '#customerActionPlanAddModal',
        'dataUrl' : '/crm/customer/custm/actionPlanList'
    },
    'customer.attachmentAdd' : {
        'requestUrl' : '/crm/customer/custm/attachmentAdd',
        'targetSelector' : '#customerAttachmentAddModal',
        'dataUrl' : '/crm/customer/custm/attachmentList'
    },
    'customer.orderAdd' : {
        'requestUrl' : '/crm/customer/custm/orderAdd',
        'targetSelector' : '#customerOrderAddModal',
        'dataUrl' : '/crm/customer/custm/orderDataList'
    },
    'customer.data.request' : {
        'requestUrl' : '/crm/customer/data/request',
        'dataUrl' : '/crm/customer/data/list'
    },
    'customer.data.requestList' : {
        'requestUrl' : '/crm/customer/data/requestListTable',
        'targetSelector' : '#requestListData',
        'dataUrl' : '/crm/customer/data/request'
    },
    'customer.data.recycleList' : {
        'requestUrl' : '/crm/customer/data/recycleCallListTable',
        'targetSelector' : '#reclycleCallListData',
        'dataUrl' : '/crm/customer/data/recycleList'
    },
    'customer.data.reallocateList' : {
        'requestUrl' : '/crm/customer/data/reallocateCallListTable',
        'targetSelector' : '#reallocateListData',
        'dataUrl' : '/crm/customer/data/recycleList'
    },
    'customerBatch.dataList' : {
        'requestUrl' : '/crm/customer/data/batchListTable',
        'targetSelector' : '#batchListData',
        'dataUrl' : '/crm/customerBatch/dataList'
    },
    'customerBatch.count' : {
        'requestUrl' : '/crm/customer/data/batchTotalCount',
        'targetSelector' : '#batchListData',
        'dataUrl' : '/crm/customerBatch/dataList'
    },
    'user.dataList' : {
        'requestUrl' : '/crm/customer/data/userListTable',
        'targetSelector' : '#userListData',
        'dataUrl' : '/crm/user/getWorkGroupUsers'
    },
    'dataManage.manage' : {
        'requestUrl' : '/crm/customer/data/manage',
        'dataUrl' : '/crm/customer/data/manage'
    },
    'dataManage.plan' : {
        'requestUrl' : '/crm/customer/plan/list',
        'dataUrl' : '/crm/customer/plan/list'
    },
    'customer.plan.listTable' : {
        'requestUrl' : '/crm/customer/plan/listTable',
        'targetSelector' : '#customerPlanData',
        'dataUrl' : '/crm/customer/plan/listTable'
    },
    'customer.schedule' : {
        'targetSelector' : '#customerScheduleContent',
        'requestUrl' : '/crm/customer/schedule',
        'dataUrl' : '/crm/customerActionPlan/schedule'
    },
    'customer.assignMenu' : {
        'targetSelector' : '#requests',
        'requestUrl' : '/crm/customer/data/assign',
        'dataUrl' : '/crm/customer/data/assignMenu'
    },
    'customer.assignData' : {
        'targetSelector' : '#toAssign',
        'requestUrl' : '/crm/customer/data/assignData',
        'dataUrl' : '/crm/customer/data/toAssign',
        'dataCache' : false
    },
    'customer.task.assignData' : {
        'targetSelector' : '#callListRequestTaskBody',
        'requestUrl' : '/crm/customer/data/assignData',
        'dataUrl' : '/crm/customer/data/toAssign',
        'dataCache' : false
    },
    'customer.task.customerRecycleDistribution' : {
        'requestUrl' : '/crm/task/customerRecycleDistribution'
    },
    'customer.importMenu' : {
        'targetSelector' : '#import',
        'requestUrl' : '/crm/customer/data/import',
        'dataUrl' : '/crm/customer/data/importMenu'
    },
    'customer.historyMenu' : {
        'targetSelector' : '#history',
        'requestUrl' : '/crm/customer/data/history',
        'dataUrl' : '/crm/customer/data/historyMenu'
    },
    'customer.recycleMenu' : {
        'targetSelector' : '#recycle',
        'requestUrl' : '/crm/customer/data/recycle',
        'dataUrl' : '/crm/customer/data/recycleMenu'
    },
    'customer.leaderRecycleMenu' : {
        'requestUrl' : '/crm/customer/data/leaderRecycle',
        'data' : false
    },
    'customer.data.recycleDM' : {
        'targetSelector' : '#recycleList',
        'requestUrl' : '/crm/customer/data/recycleDM',
        'dataUrl' : '/crm/customer/data/recycleDM'
    },
    'customer.data.reallocate' : {
        'targetSelector' : '#reallocate',
        'requestUrl' : '/crm/customer/data/reallocate',
        'dataUrl' : '/crm/customer/data/reallocate'
    },
    'crm.message.list' : {
        'requestUrl' : '/crm/message/list',
        'dataUrl': '/crm/message/list'
    },
    'call.list' : {
        'requestUrl' : '/crm/call/list',
        'data' : false
    },
    'product.list' : {
        'requestUrl' : '/crm/product/list'
    },
    'product.publishList': {
        'requestUrl': '/crm/product/publishList'
    },
    'publish.dataList': {
        'requestUrl': '/crm/product/publishListTable',
        'targetSelector': '#publishListData',
        'dataUrl': '/crm/product/publishListTable'
    },
    'product.dataList' : {
        'requestUrl' : '/crm/product/listTable',
        'targetSelector' : '#prodListData',
        'dataUrl' : '/crm/product/dataList'
    },
    'productTrend.dataList' : {
        'requestUrl' : '/crm/product/trendListTable',
        'targetSelector' : '#productTrendData',
        'dataUrl' : '/crm/productTrend/dataList'
    },
    'productTrend.latestList' : {
        'requestUrl' : '/crm/product/trendLatestListTable',
        'targetSelector' : '#productTrendData',
        'dataUrl' : '/crm/productTrend/latestList'
    },
    'productRefData.dataList' : {
        'requestUrl' : '/crm/product/refDataListTable',
            'targetSelector' : '#productRefData',
            'dataUrl' : '/crm/productRefData/dataList'
    },
    'productRefData.latestList' : {
        'requestUrl' : '/crm/product/refDataLatestListTable',
        'targetSelector' : '#productRefData',
        'dataUrl' : '/crm/productRefData/latestList'
    },
    'productAttachment.dataList' : {
        'requestUrl' : '/crm/product/attachmentListTable',
        'targetSelector' : '#productAttachmentData',
        'dataUrl' : '/crm/productAttachment/dataList'
    },
    'productAttachment.latestList' : {
        'requestUrl' : '/crm/product/attachmentLatestListTable',
        'targetSelector' : '#productAttachmentData',
        'dataUrl' : '/crm/productAttachment/latestList'
    },
    'productOrder.dataList' : {
        'requestUrl' : '/crm/product/prdOrderListTable',
        'targetSelector' : '#prdOrderListData',
        'dataUrl' : '/crm/order/dataList'
    },
    'product.detail' : {
        'requestUrl' : '/crm/product/detail',
        'targetSelector' : '#secondMain'
    },
    'product.newsList': {
        'requestUrl' : '/crm/product/newsList',
        'data': false
    },
    'product.newsDataList': {
        'requestUrl': '/crm/product/newsDataList',
        'targetSelector': '#newsListData'
    },
    'news.showAdd': {
        'requestUrl': '/crm/product/showAddNew',
        'targetSelector': '#addNews',
        'data': false
    },
    'news.getTag' : {
        'requestUrl': '/crm/product/showTag',
        'targetSelector': '#showTags',
        'dataUrl': '/crm/product/news/getTags'
    },
    'tag.showAdd': {
        'requestUrl': '/crm/product/showAddTag',
        'targetSelector': '#addTag',
        'data': false
    },
    'image.showUpload': {
        'requestUrl': '/crm/product/showUploadImage',
        'targetSelector': '#uploadImage',
        'dataUrl': '/crm/product/image/showUploadImage'
    },
    'news.imageInsert': {
        'requestUrl' : '/crm/product/imageInsert',
        'targetSelector' : '#imageInsert',
        'dataUrl' : '/crm/productTrend/addTrend/dataList'
    },
    'news.getImageView': {
        'requestUrl' : '/crm/product/imageView',
        'targetSelector' : '#imageView',
        'dataUrl' : '/crm/productTrend/imageView'
    },
    'newsAdd.getImageView': {
        'requestUrl' : '/crm/product/imageView',
        'targetSelector' : '#addNewsimageView',
        'dataUrl' : '/crm/productTrend/imageView'
    },
    'newsEdit.getImageView': {
        'requestUrl' : '/crm/product/imageView',
        'targetSelector' : '#newsEditImageView',
        'dataUrl' : '/crm/productTrend/imageView'
    },
    'news.imageView': {
        'requestUrl' : '/crm/news/imageView',
        'targetSelector' : '#imageViewContent',
        'dataUrl' : '/crm/news/imageView'
    },
    'news.imageViews': {
        'requestUrl' : '/crm/news/imageView',
        'targetSelector' : '#imageViewsContent',
        'dataUrl' : '/crm/news/imageView'
    },
    'news.imageViewModify': {
        'requestUrl' : '/crm/news/imageView',
        'targetSelector' : '#imageViewModifyContent',
        'dataUrl' : '/crm/news/imageView'
    },
    'news.dataList': {
        'requestUrl' : '/crm/news/dataList',
        'targetSelector' : '#newsDataList',
        'dataUrl' : '/crm/news/dataList'
    },
    'order.edit' : {
        'requestUrl' : '/crm/order/editForm',
        'data' : false
    },
    'order.list' : {
        'requestUrl' : '/crm/order/list'
    },
    'order.detail' : {
        'requestUrl' : '/crm/order/detail'
    },
    'order.dividendList' : {
        'requestUrl' : '/crm/order/dividendListTable',
        'targetSelector' : '#dividendListData',
        'dataUrl' : '/crm/order/dividendList'
    },
    'order.dataList' : {
        'requestUrl' : '/crm/order/listTable',
        'targetSelector' : '#orderListData',
        'dataUrl' : '/crm/order/dataList'
    },
    'sign.list' : {
        'requestUrl' : '/crm/order/signList'
    },
    'order.signDataList' : {
        'requestUrl' : '/crm/order/signListTable',
        'targetSelector' : '#signListData',
        'dataUrl' : '/crm/order/signDataList'
    },
    'audit.list' : {
        'requestUrl' : '/crm/audit/list',
        'dataUrl' : '/crm/audit/listData'
    },
    'customer.audit.table' : {
        'requestUrl' : '/crm/audit/listTable',
        'targetSelector' : '#auditListTable',
        'dataUrl' : '/crm/audit/list'
    },
    'customer.audit.detail' : {
        'requestUrl' : '/crm/audit/detail',
        'dataUrl' : '/crm/audit/detail'
    },
    'employee.list' : {
        'requestUrl' : '/crm/employee/list'
    },
    'online.list' : {
        'requestUrl' : '/crm/online/list',
        'data' : false
    },
    'online.wachatAdd' : {
        'requestUrl' : '/crm/online/wachatAdd',
        'targetSelector' : '#add',
        'dataUrl' : '/crm/online/wachatList'
    },
    'online.wachatGather' : {
        'requestUrl' : '/crm/online/wachatReport',
        'targetSelector' : '#report',
        'data' : false
    },
    'online.dataList' : {
        'requestUrl' : '/crm/online/wachatList',
        'targetSelector' : '#wechatList',
        'dataUrl' : '/crm/online/dataList'
    },
    'account.list' : {
        'requestUrl' : '/crm/online/account',
        'data' : false
    },
    'portal.index' : {
        'requestUrl' : ''
    },
    'portal.appList' : {
        'requestUrl' : '/portal/appList'
    },
    'portal.menu' : {
        'requestUrl' : '/portal/menu',
        'targetSelector' : '#appMenu'
    },
    'employee.dataList' : {
        'requestUrl' : '/crm/employee/listTable',
        'targetSelector' : '#employeeListData',
        'dataUrl' : '/crm/employee/dataList'
    },
    'customer.callList.list' : {
        'requestUrl' : '/crm/customer/callList/list',
        'targetSelector' : '#customerContent'
    },
    'customer.callList.listTable' : {
        'requestUrl' : '/crm/customer/callList/listTable',
        'targetSelector' : '#customerCallListTable'
    },
    'customer.callList.detail' : {
        'requestUrl' : '/crm/customer/call',
        'data' : true,
        'dataUrl' : '/crm/customer/callList/detail'
    },
    'customer.detail' : {
        'requestUrl' : '/crm/customer/custm/detail',
        'dataUrl' : '/crm/customer/detail'
    },
    'customer.baseInfo' : {
        'requestUrl' : '/crm/customer/custm/baseInfo',
        'targetSelector' : '#customerBaseInfo',
        'dataUrl' : '/crm/customer/detail'
    },
    'customer.callListRequest.dataList' : {
        'requestUrl' : '/crm/customer/data/requestTable',
        'targetSelector' : '#callListRequestListData',
        'dataUrl' : '/crm/customer/callListRequest/dataList'
    },
    'customerBatch.history.dataList' : {
        'requestUrl' : '/crm/customer/data/historyListTable',
        'targetSelector' : '#historyListData',
        'dataUrl' : '/crm/customerBatch/historyDataList'
    },
    'customerBatch.history.detailDataList' : {
        'requestUrl' : '/crm/customer/data/batchDetailDataListTable',
        'targetSelector' : '#batchDetailDataList',
        'dataUrl' : '/crm/customerBatch/batchDetailDataList'
    },
    'customer.serviceRecord.pageList' : {
        'requestUrl' : '/crm/customer/custm/serviceRecordList',
        'targetSelector' : '#customerServiceRecordList',
        'dataUrl' : '/crm/customerServiceRecord/list'
    },
    'customer.actionPlan.pageList' : {
        'requestUrl' : '/crm/customer/custm/actionPlanList',
        'targetSelector' : '#customerActionPlanList',
        'dataUrl' : '/crm/customerActionPlan/list'
    },
    'customer.actionPlan.complete' : {
        'requestUrl' : '/crm/customer/custm/actionPlanComplete',
        'targetSelector' : '#customerActionPlanCompleteModal',
        'dataUrl' : '/crm/customerActionPlan/complete'
    },
    'customer.actionPlan.mod' : {
        'requestUrl' : '/crm/customer/custm/actionPlanMod',
        'targetSelector' : '#customerActionPlanModModal',
        'dataUrl' : '/crm/customerActionPlan/mod'
    },
    'customer.attachment.pageList' : {
        'requestUrl' : '/crm/customer/custm/attachmentList',
        'targetSelector' : '#customerAttachmentList',
        'dataUrl' : '/crm/customerAttachment/list'
    },
    'customer.order.pageList' : {
        'requestUrl' : '/crm/customer/custm/orderList',
        'targetSelector' : '#customerOrderList',
        'dataUrl' : '/crm/customerOrder/list'
    },
    'crm.task.list' : {
        'requestUrl' : '/crm/task/list'
    },
    'crm.task.list.table' : {
        'requestUrl' : '/crm/task/listTable',
        'targetSelector' : '#taskListTable',
        'dataUrl' : '/crm/task/listData'
    },
    'wechat.detailList' : {
        'requestUrl': '/crm/online/detailList',
        'targetSelector' : '#detailList',
        'dataUrl': '/crm/online/detailList'
    },
    'online.accountContact': {
        'requestUrl': '/crm/online/accountContact',
        'targetSelector': '#accountContact',
        'dataUrl': '/crm/online/accountContact'
    },
    'wechatAccount.dataList': {
        'requestUrl': '/crm/online/accountListTable',
        'targetSelector': '#accountListTable',
        'dataUrl': '/crm/online/accountListTable'
    },
    'wechat.rooms' : {
        'requestUrl' : '/crm/wechat/chatRoom'
    },
    'wechat.accountList' : {
        'requestUrl' : '/crm/wechat/accountListTable',
        'dataUrl' : '/crm/wechat/accountList',
        'targetSelector' : '#accountListTable'
    },
    'wechat.contactList' : {
        'requestUrl' : '/crm/wechat/contactListTable',
        'dataUrl' : '/crm/wechat/contactList',
        'targetSelector' : '#contactListTable'
    },
    'wechat.msgContactList' : {
        'requestUrl' : '/crm/wechat/recentContactListTable',
        'dataUrl' : '/crm/wechat/msgContactList',
        'targetSelector' : '#msgContactListTable'
    },
    'wechat.historyList' : {
        'requestUrl' : '/crm/wechat/historyListTable',
        'dataUrl' : '/crm/wechat/historyList',
        'targetSelector' : '#msgHistoryPanel'
    },
    'wechat.activityList' : {
        'requestUrl' : '/crm/wechat/activityListTable',
        'dataUrl' : '/crm/wechat/activityList',
        'targetSelector' : '#moments'
    },
    'wechat.batchInsert' : {
        'requestUrl' : '/crm/wechat/batchRecordList',
        'dataUrl': '/crm/wechat/batchRecordList'
    },
    'wechat.add' : {
        'requestUrl' : '/crm/wechat/addList'
    },
    'wechat.moments': {
        'requestUrl': '/crm/wechat/momentsMsg',
        'dataUrl': '/crm/wechat/momentsMsg'
    },
    'momentsMsg.dataList': {
        'requestUrl': '/crm/wechat/momentsMsgTable',
        'dataUrl': '/crm/wechat/momentsMsgTable',
        'targetSelector': '#momentsMsgListData'
    },
    'momentsMsg.imageList': {
        'requestUrl': '/crm/wechat/momentsImageList',
        'dataUrl': '/crm/wechat/momentsImageList',
        'targetSelector': '#momentsImages'
    },
    'wechatAccountAdd.dataList': {
        'requestUrl' : '/crm/wechat/addListTable',
        'dataUrl' : '/crm/wechat/addListTable',
        'targetSelector': '#addListData'
    },
    'wechatAccountEdit.dataList': {
        'requestUrl': '/crm/wechat/editWechatAccount',
        'dataUrl' : '/crm/wechat/editWechatAccount',
        'targetSelector': '#editAccount'
    },
    'batchRecord.dataList' : {
        'requestUrl' : '/crm/wechat/batchRecordListTable',
        'dataUrl' : '/crm/wechat/batchRecordDataList',
        'targetSelector' : '#batchRecordListData'
    },
    'wechat.nearbyPeople' : {
        'requestUrl' : '/crm/wechat/attentNearbyList'
    },
    'wechatManage.deviceManage': {
        'requestUrl': '/crm/wechat/deviceManage',
        'data': false
    },
    'wechatDevice.dataList': {
        'requestUrl': '/crm/wechat/deviceTable',
        'dataUrl': '/crm/wechat/deviceTable',
        'targetSelector': '#deviceData'
    },
    'wechatManage.HNWC': {
        'requestUrl': '/crm/wechat/HNWC'
    },
    'momentsMsg.HNWCList': {
        'requestUrl' : '/crm/wechat/HNWCTable',
        'dataUrl': '/crm/wechat/HNWCTable',
        'targetSelector': '#HNWCListData'
    },
    'wechatMsg.editHNWC': {
        'requestUrl' : '/crm/wechat/editHNWC',
        'dataUrl': '/crm/wechat/editHNWCList',
        'targetSelector': '#editHNWC'
    },
    'hnwc.detail': {
        'requestUrl' : '/crm/wechat/HNWCDetail'
    },
    'momentsMsg.appointManageList': {
        'requestUrl' : '/crm/wechat/appointManageList',
        'dataUrl': '/crm/wechat/appointManageList',
        'targetSelector': '#appointManageList'
    },
    'wechatManage.HNWCManage': {
        'requestUrl' : '/crm/wechat/HNWCManage'
    },
    'momentsMsg.HNWCManageList': {
        'requestUrl' : '/crm/wechat/HNWCManageTable',
        'dataUrl': '/crm/wechat/HNWCManageList',
        'targetSelector': '#HNWCManageListData'
    },
    'attentNearby.dataList' : {
        'requestUrl' : '/crm/wechat/attentNearbyListTable',
        'dataUrl' : '/crm/wechat/attentNearbyDataList',
        'targetSelector' : '#attentNearbyListData'
    },
    'user.list' : {
        'requestUrl' : '/upm/user/list',
        'dataUrl': '/upm/user/list'
    },
    'user.listData' : {
        'requestUrl' : '/upm/user/listTable',
        'targetSelector' : '#userData',
        'dataUrl' : '/upm/user/listData'
    },
    'employee.listData': {
        'requestUrl': '/upm/user/listEmployee',
        'targetSelector': '#employeeData',
        'dataUrl': '/upm/user/listEmployee'
    },
    'user.dataInfo': {
        'requestUrl': '/upm/user/add',
        'targetSelector': '#listNewUser',
        'dataUrl': '/upm/user/dataInfo'
    },
    'user.detail': {
        'requestUrl': '/upm/user/edit',
        'targetSelector': '#listDetailUser',
        'dataUrl': '/upm/user/detail'
    },
    'role.list': {
        'requestUrl' : '/upm/user/roleList',
        'data': false

    },
    'role.listTable': {
        'requestUrl': '/upm/user/roleTable',
        'targetSelector': '#roleData',
        'dataUrl': '/upm/role/list'
    },
    'workGroup.list' : {
        'requestUrl' : '/upm/group/list',
        'dataUrl': '/upm/group/list'
    },
    'workGroup.listData': {
        'requestUrl': '/upm/group/listData',
        'targetSelector': '#groupData',
        'dataUrl': '/upm/group/listData'
    },
    'record.list': {
        'requestUrl': '/crm/audit/record',
        'dataUrl': '/crm/audit/record'
    },
    'audit.recordModal': {
        'requestUrl': '/crm/audit/recordModal',
        'targetSelector': '#recordingModal',
        'dataUrl': '/crm/audit/recordModal'
    },
    'customer.myRecord': {
        'requestUrl': '/crm/customer/myRecord/myRecord',
        'dataUrl': '/crm/customer/myRecord'
    },
    'customer.myRecordModal': {
        'requestUrl': '/crm/customer/myRecord/myRecordModal',
        'targetSelector': '#myRecordModal',
        'dataUrl': '/crm/customer/myRecordModal'
    },
    'customer.audit.actionPlanList': {
        'requestUrl': '/crm/audit/actionPlanList',
        'targetSelector': '#actionPlanList',
        'dataUrl': '/crm/audit/actionPlanList'
    },
    'customer.callList.auditTable': {
        'requestUrl': '/crm/customer/callList/auditInfo',
        'targetSelector': '#customerAuditInfo',
        'dataUrl': '/crm/customer/callList/auditInfo'
    },
    'dataManage.customerAdvanced': {
        'requestUrl': '/crm/customer/custAdvanced/list',
        'dataUrl': '/crm/customer/custAdvanced/list'
    },
    'customer.custAdvanced.listTable': {
        'requestUrl': '/crm/customer/custAdvanced/listTable',
        'targetSelector': '#customerAdvancedListTable',
        'dataUrl': '/crm/customer/custAdvanced/listTable'
    },
    'customer.custAdvanced.status': {
        'requestUrl': '/crm/customer/custAdvanced/edit',
        'targetSelector': '#editStatus',
        'dataUrl': '/crm/customer/custAdvanced/status'
    },
    'customer.custAdvanced.consultant': {
        'requestUrl': '/crm/customer/custAdvanced/editConsultant',
        'targetSelector': '#editConsultant',
        'dataUrl': '/crm/customer/custAdvanced/consultant'
    },
    'customer.custAdvanced.rm': {
        'requestUrl': '/crm/customer/custAdvanced/editRM',
        'targetSelector': '#editRM',
        'dataUrl': '/crm/customer/custAdvanced/rm'
    },
    'customer.custAdvanced.customerBasicInfo': {
        'requestUrl': '/crm/customer/custAdvanced/basicInfo',
        'targetSelector': '#customerBasicInfo',
        'dataUrl': '/crm/customer/custAdvanced/basicInfo'
    },
    'customer.appoint.consultant': {
        'requestUrl': '/crm/customer/custm/appointConsultant',
        'targetSelector': '#appointConsultant',
        'dataUrl': '/crm/customer/custm/appointConsultant'
    },
    'customer.task.recycleDistributionDetail': {
        'requestUrl': '/crm/task/recycleDistributionDetail',
        'targetSelector': '#recycleDistributionDetail',
        'dataUrl': '/crm/task/recycleDistributionDeatil'
    },
    'crm.message.listTable': {
        'requestUrl': '/crm/message/listTable',
        'targetSelector': '#sysMessageTable',
        'dataUrl': '/crm/message/listTable'
    },
    'customer.statisticMenu': {
        'requestUrl': '/crm/customer/data/statisticList',
        'targetSelector': '#statistic',
        'dataUrl': '/crm/customer/data/statisticList'
    },
    'customer.audit.serviceRecordList': {
        'requestUrl': '/crm/audit/serviceRecordList',
        'targetSelector': '#serviceRecordList',
        'dataUrl': '/crm/audit/serviceRecordList'
    },
    'customer.task.customerLevelPromotion': {
        'requestUrl': '/crm/task/customerLevelPromotion',
        'targetSelector': '#customerLevelPromotion',
        'dataUrl': '/crm/task/customerLevelPromotion'
    },
    'customer.custAdvanced.multiModify' : {
        'requestUrl' : '/crm/customer/custAdvanced/multiModify',
        'dataUrl': '/crm/customer/custAdvanced/multiModify'
    },
    'customer.custAdvanced.multiModifyTable' : {
        'requestUrl' : '/crm/customer/custAdvanced/multiModifyTable',
        'targetSelector': '#multiModifyTable',
        'dataUrl': '/crm/customer/custAdvanced/multiModifyTable'
    },
    'news.list' : {
        'requestUrl': '/crm/news/list'
    },
    'strategy.list': {
        'requestUrl': '/crm/strategy/list'
    },
    'strategy.dataList': {
        'requestUrl': '/crm/strategy/dataList',
        'targetSelector': '#strategyDataList',
        'dataUrl': '/crm/strategy/dataList'
    },
    'joinus.list': {
        'requestUrl': '/crm/joinus/list'
    },
    'joinus.dataList': {
        'requestUrl': '/crm/joinus/dataList',
        'targetSelector': '#joinusDataList',
        'dataUrl': '/crm/joinus/dataList'
    }
};