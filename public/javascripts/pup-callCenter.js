/**
 * Created by wangnan on 14-6-10.
 */

function CallCenter(name) {

    this.callListDetailConfirm = false;
    this.callStatus = null;
    this.close = null;
    this.save = null;
    this.name = name;

    this.show = function(customerId) {
        var thiz = this;
        thiz.callListDetailConfirm = false;
        pup.widgets.layerManager.open({
            layerKey : null,
            targetSelector : null,
            html : '',
            template : {
                key : 'customer.callList.detail',
                dataParam : {id : customerId, callCenterName : thiz.name},
                beforeRender : function() {
                    toastr.clear();
                    console.log('before customer.callList.detail');
                },
                afterRender : function() {
                    console.log('after customer.callList.detail');
                }
            },
            beforeClose : function() {
                if(!thiz.callListDetailConfirm) {
                    $('#customerCallListDetailCloseConfirm').modal('show');
                }
                console.log('call center beforeClose callListDetailConfirm=' + thiz.callListDetailConfirm);
                return thiz.callListDetailConfirm;
            }
        });
    };

    this.closeConfirm = function() {
        this.callListDetailConfirm = true;
        console.log('call center set callListDetailConfirm=true');
        pup.widgets.layerManager.close();
        if($.isFunction(this.close))
            this.close();
        $('#customerCallListDetailCloseConfirm').modal('hide');
    };

    this.setCallNextDays = function(days) {
        $('input[name=callNextDays]').val(days);
    };

    this.callSave = function(status) {
        var thiz = this;
        var callStatus = status || thiz.callStatus;
        $form = $('#formCall');
        var valid = $form.validate().form();
        if(valid) {
            console.debug($form.serialize());
            $.ajax({
                type: 'POST',
                url: '/crm/customer/callList/save',
                dataType: 'json',
                data: $form.serialize() + '&callStatus=' + callStatus,
                success: function (data) {
                    thiz.callListDetailConfirm = true;
                    $('#customerCallListDetailSubmitConfirm').modal('hide');
                    pup.widgets.layerManager.close();
                    toast(data.msg);
                    if($.isFunction(thiz.save))
                        thiz.save(data);
                }
            });
        }
    };

    this.callSaveConfirm = function(status) {
        this.callStatus = status || '';
        $('#customerCallListDetailSubmitConfirm').modal('show');
    };

    this.setCallSex = function(value) {
        $('[name=callSex]').val(value);
    };

    this.setCallInvestmentPreference = function(value) {
        $('[name=callInvestmentPreference]').val(value);
    };

    this.setCallBodyMass = function(value) {
        $('[name=callBodyMass]').val(value);
    };
}


var CallCenterController = (function() {

    return {
        login : function(optional) {
            var agent = optional.agent;
            var ext = optional.extension;
            var group = optional.group;
            if(!$.isNumeric(ext)) {
                return {success : false, msg : '分机号不正确:[' + ext + ']'};
            }
            var o = MyPhoner.Login(agent,group,ext,null,null);
            console.log("Login:" + o +"(" + MyPhoner.Reason + ")");
            if(o >= 0){
                var obj = MyPhoner.GetLoginInfo();
                if(obj >= 0){
                    console.log("Agent:"+MyPhoner.Agent+", Extension:"+MyPhoner.Extension);
                }
                var events = MyPhoner.GetEvents(function(message) {
                    CallCenterController.callCenterEventCallback(message);
                });
                console.log("GetEvents:" + events +"(" + MyPhoner.Reason + ")");
                return {success : true};
            } else {
                return {success : false, msg : '呼叫中心登录认证失败'};
            }
        },

        setup : function(optional) {
            var callCenterAddress = optional.callCenterAddress;
            $.getScript('http://' + callCenterAddress + '/MyCallProxy/MyPhoner.js', function() {
                MyPhoner.host = callCenterAddress;
                var callCenterAgent = optional.callCenterAgent;
                var callCenterExtension = optional.callCenterExtension;
                var callCenterGroup = optional.callCenterGroup;
                console.log('callCenterLogin: agent=' + callCenterAgent + ', extension=' + callCenterExtension + ', group=' + callCenterGroup);
                var callCenterLoginResult = CallCenterController.login({agent : callCenterAgent, extension : callCenterExtension, group : callCenterGroup});

                if(!callCenterLoginResult.success) {
                    toast({type : 'error', body : '登录呼叫中心失败'}, true);
                    console.log('登录呼叫中心失败:' + callCenterLoginResult.msg);
                } else {
                    toast({type : 'success', body : "已成功登录呼叫中心"}, true);
                }
            });
        },

        callCenterEventCallback : function(message) {
            console.log(message);
        }

//        callCenterLogout : function(optional) {
//            console.log("Logout:" + MyPhoner.Logout() +"(" + MyPhoner.Reason + ")");
//        },
//
//        callCenterPageInit : function() {
//            var totalCount = MyPhoner.GetCallInfo();
//            if(MyPhoner.callback == "") {
//                if(totalCount >= 0) {
//                    console.log("callCenterPageInit GetCallInfo:" + JSON.stringify(MyPhoner.Calls));
//                }
//            } else {
//                console.log("callCenterPageInit GetCallInfo:" + totalCount +"(" + MyPhoner.Reason + ")");
//            }
//        },

//        callCenterAddRecording : function() {
//            var totalCount = MyPhoner.GetCallInfo();
//            if(MyPhoner.callback == ""){
//                if(totalCount >= 0) {
//                    console.log("GetCallInfo:" + JSON.stringify(MyPhoner.Calls));
//                    CallCenterController.callCenterRecordingList.push(MyPhoner.Calls.recordId);
//                    var recording = {};
//                    recording.customerId = '#{customer._id}';
//                    recording.recordId = MyPhoner.Calls.recordId;
//                    $.ajax({
//                        type: 'POST',
//                        dataType: 'json',
//                        url: '/crm/recording/add',
//                        data: recording,
//                        success: function(data){
//                            console.log(data.toast.body);
//                        }
//                    });
//                } else {
//                    console.log("GetCallInfo:" + totalCount +"(" + MyPhoner.Reason + ")");
//                }
//            }
//        },
//
//        callCenterGetStatusFromMessage : function(message) {
//            if(!message) {
//                return null;
//            }
//            //拨打中但未呼出
//            var pdial = /Dial.0.Succeed.*/;
//            //拨打中已呼出
//            var pdialed = /Dial.[0-9]{11}/;
//            //拨打失败
//            var pdialFailed = /Dial:-1.*/;
//            //已接通
//            var pconnected = /Connected/;
//            //主动挂断
//            var phangup = /Hangup.*Succeed.*/;
//            //已挂断
//            var pdisconnect = /Disconnect/;
//            //登入
//            var plogin = /Login:0.Succeed.*/;
//            //登出
//            var plogout = /Close/;
//            //开始录音
//            var precording = /Recording/;
//
//            if(pdial.test(message)) {
//                return CallCenterController.callCenterStatus.dial;
//            } else if(pdialed.test(message)) {
//                return CallCenterController.callCenterStatus.dialed;
//            } else if(pconnected.test(message)) {
//                return CallCenterController.callCenterStatus.connected;
//            } else if(phangup.test(message)) {
//                return CallCenterController.callCenterStatus.hangup;
//            } else if(pdisconnect.test(message)) {
//                return CallCenterController.callCenterStatus.disconnect;
//            } else if(plogin.test(message)) {
//                return CallCenterController.callCenterStatus.login;
//            } else if(plogout.test(message)) {
//                return CallCenterController.callCenterStatus.logout;
//            } else if(pdialFailed.test(message)) {
//                return CallCenterController.callCenterStatus.dialFailed;
//            } else if(precording.test(message)) {
//                return CallCenterController.callCenterStatus.recording;
//            } else {
//                return message;
//            }
//        },
//
//        callCenterEventCallback : function(message) {
//            var status = CallCenterController.callCenterGetStatusFromMessage(message);
//            console.log('status : ' + status);
//            if(!status) {
//                return;
//            }
//            if(status == CallCenterController.callCenterStatus.dialed) {
//                CallCenterController.callCenterCurrentStatus = CallCenterController.callCenterStatus.dialed;
//                toast({type : 'info', body : '已呼出,等待接听...'}, true);
//            } else if(status == CallCenterController.callCenterStatus.connected) {
//                CallCenterController.callCenterCurrentStatus = CallCenterController.callCenterStatus.connected;
//                CallCenterController.callCenterChangeViewTo(CallCenterController.callCenterViewType.connected);
//                toast({type : 'info', body : '已接听,通话中...'}, true);
//            } else if(status == CallCenterController.callCenterStatus.hangup) {
//                CallCenterController.callCenterCurrentStatus = CallCenterController.callCenterStatus.hangup;
//            } else if(status == CallCenterController.callCenterStatus.disconnect) {
//                CallCenterController.callCenterCurrentStatus = CallCenterController.callCenterStatus.disconnect;
//                CallCenterController.callCenterChangeViewTo(CallCenterController.callCenterViewType.disconnect);
//                toast({type : 'info', body : '已挂机'}, true);
//                //callCenterLogout();
//            } else if(status == CallCenterController.callCenterStatus.logout) {
//
//
//            } else if(status == CallCenterController.callCenterStatus.recording) {
//                CallCenterController.callCenterAddRecording();
//            } else {
//                console.log("undeal status : " + status);
//            }
//        },
//
//
//        callCenterStatus : {
//            //拨打中
//            dial : 'Dial',
//            //已呼出
//            dialed : 'Dialed',
//            //拨打失败
//            dialFailed : 'DialFailed',
//            //接通
//            connected : 'Connected',
//            //挂断
//            hangup : 'Hangup',
//            //已断开
//            disconnect : 'Disconnect',
//            //登入
//            login : 'login',
//            //登出
//            logout : 'logout',
//            //开始录音
//            recording : 'recording'
//        },
//
//        callCenterViewType : {
//            //拨打中
//            dial : 'dial',
//            //接通
//            connected : 'connected',
//            //已断开
//            disconnect : 'disconnect',
//            //主动挂机
//            hangup : 'hangup'
//        },
//
//        callCenterCurrentStatus : '',
//
//        callCenterRecordingList : [],
//
//        clear : function() {
//            CallCenterController.callCenterCurrentStatus = '';
//            CallCenterController.callCenterRecordingList = [];
//        }
    }
}());