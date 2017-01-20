/**
 * Created by wangnan on 14-8-19.
 */

var pathToDwrServlet = '';

var CallCenterUIController = (function() {

    var callCenterUIvalid = null;
    var callCenterUIAddress = null;

    return {

        setup : function(options) {
            console.log('CallCenterUIController: options=');
            console.log(options);
            if(!options) {
                console.log('CallCenterUIController: not valid, because callCenter is not set valid to true');
                return;
            }
            callCenterUIvalid = options.valid;
            callCenterUIAddress = options.uiAddress;
            var thiz = this;
            var callCenterUIEngineUrl = 'http://' + callCenterUIAddress + '/ui/engine.js';
            var callCenterUIControllerUrl = 'http://' + callCenterUIAddress + '/ui/interface/UIController.js';
            pathToDwrServlet = "http://" + callCenterUIAddress + "/ui";

            if(callCenterUIvalid == 'true') {
                $.getScript(callCenterUIEngineUrl, function(data, textStatus, jqxhr) {
                    if(jqxhr.status == 200 && textStatus == 'success') {
                        $.getScript(callCenterUIControllerUrl, function(data, textStatus, jqxhr) {
                            if(jqxhr.status == 200 && textStatus == 'success') {
                                UIController._path = 'http://' + callCenterUIAddress + '/ui';
                                thiz.client = UIController;
                                console.log('CallCenterUIController: OK');
                            } else {
                                console.log('CallCenterUIController: can\'t load [' + callCenterUIControllerUrl + ']');
                            }
                        });
                    } else {
                        console.log('CallCenterUIController: can\'t load [' + callCenterUIEngineUrl + ']');
                    }
                });
            } else {
                console.log('CallCenterUIController: not valid, because callCenter is not set valid to true');
            }
        }
    };
}());

