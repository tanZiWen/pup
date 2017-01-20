/**
 * Created by wangnan on 14-6-3.
 */

var customerDao = require('../../../db/crm/customerDao');

var Customer = customerDao.client;

Customer.find({tags : {$in : ['富二代']}}, function(err, docs) {
    if(err)
        console.error(err);
    else
        console.dir(docs);
});