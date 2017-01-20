/**
 * Created by wangnan on 14-9-2.
 */

var dateStr = '2014-07-24';
var dir = '/Users/wangnan/crm-statistics';


var auditClient = require('../db/crm/model.js').crm_customer_audit_record;
var userClient = require('../db/upm/model.js').upm_user;
var dbs = require('../db/dbs');
var csv = require('to-csv');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var dateArry = dateStr.split('-');
var dateBegin = new Date();
dateBegin.setYear(parseInt(dateArry[0]));
dateBegin.setMonth(parseInt(dateArry[1]) - 1);
dateBegin.setDate(parseInt(dateArry[2]));
dateBegin.setHours(0);
dateBegin.setMinutes(0);
dateBegin.setSeconds(0);
dateBegin.setMilliseconds(0);
var dateEnd = new Date();
dateEnd.setYear(dateArry[0]);
dateEnd.setMonth(dateArry[1]);
dateEnd.setDate(dateArry[2]);
dateEnd.setHours(23);
dateEnd.setMinutes(59);
dateEnd.setSeconds(59);
dateEnd.setMilliseconds(999);


(function() {
    auditClient.aggregate([
        {$match : {
            done : true,
            "audit.result" : 'ok',
            "audit.customerStatus" : {$in : ['bc20', 'bc40']},
            "call.callTime" : {$gte : dateBegin, $lt : dateEnd}
        }},
        {$group : {
            _id : {user : "$call.callUser.userid", status : "$audit.customerStatus"},
            total : {$sum : 1}
        }}
    ], function(err, docs) {
        if(err) {
            console.error(err.stack);
            dbs.close();
        } else {
            userClient.find({_id : {$in : _.pluck(_.pluck(docs, '_id'), 'user')}}, function(err, users) {
                if(err) {
                    console.error(err.stack);
                } else {
                    var cvsMap = {};
                    for(var i in docs) {
                        if(!cvsMap[docs[i]._id.user]) {
                            cvsMap[docs[i]._id.user] = {};
                        }
                        cvsMap[docs[i]._id.user][docs[i]._id.status] = docs[i].total;
                    }
                    var cvsDocs = [];
                    for(var userid in cvsMap) {
                        for(var i in users) {
                            if(userid == users[i]._id) {
                                cvsDocs.push({'顾问' : users[i].realName, 'bc20' :  cvsMap[userid].bc20, bc40 :  cvsMap[userid].bc40});
                                break;
                            }
                        }
                    }
                    fs.writeFileSync(path.normalize(dir + path.sep + dateStr) + '.csv', csv(cvsDocs));
                    dbs.close();
                }
            });

        }
    });
}())