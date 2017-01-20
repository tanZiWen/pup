/**
 * Created by wangnan on 14-6-3.
 */

var tagDao = require('../../db/crm/tagDao');
var _ = require('underscore');

exports.type = {
    CUSTOMER : 'customer',
    PRODUCT_TREND : 'productTrend'
};

exports.tags = function(type, callback) {
    tagDao.findByType(type, function(err, tags) {
        if(err)
            callback(err);
        else {
            callback(null, _.pluck(tags, '_doc'));
        }
    });
};