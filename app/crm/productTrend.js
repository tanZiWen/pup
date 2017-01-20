/**
 *
 * User: wuzixiu
 * Date: 2/11/14
 * Time: 4:39 PM
 */
var productTrendDao = require('../../db/crm/productTrendDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore');
    idg = require('../../db/idg'),
    Pagination = require('../../lib/Pagination'),
    eventReceiver = require('../../event/Receiver'),
    G = require('../../lib/global'),
    http = require('http'),
    querystring = require('querystring'),
    async = require('async'),
    postgreHelper = require('../../db/postgreHelper'),
    dictModel = require('../portal/dictModel'),
    fs = require('fs'),
    global = require('../../lib/global'),
    gm = require('gm'),
    logger = require('../../lib/logFactory').getModuleLogger(module);


exports.dataList = function (req, res) {
    var pagination = new Pagination(req);
    var steps = {};
    var query = '';
    steps.docs = function(next) {
        query = 'select * from t_wc_news where tagcode = $1 and del=false order by crt desc limit $2 offset $3';
        postgreHelper.dbQuery(query, [pagination.condition.tagcode, pagination.pageCount, (pagination.currentPage - 1) * pagination.pageCount], next);
    };

    steps.count = function(next) {
        query = 'select count(*) from t_wc_news where tagcode = $1 and del = false';
        postgreHelper.dbQuery(query, [pagination.condition.tagcode], next);
    };

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.productTrend.dataList error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            var docs = result.docs.rows;
            var count = result.count;
            pagination.total = parseInt(count.rows[0].count);
            res.json({trends: docs, pagination: pagination});
        }
    })

};

exports.latestList = function (req, res) {
    productTrendDao.getLatestRecords(req.query.id, function(err, result) {
        if(err) res.json(500, {err : err.stack});
        else {
            res.json({data : result});
        }
    });
};

exports.create = function (req, res) {
    var params = req.body;
    var values = [];
    values.push(params.title);
    values.push(params.summary);

    var steps = {};

    steps.splitUrl = function(next) {
        clientToRemote(params, next);
    };

    steps.new = ['splitUrl', function(next, data) {
        values.push(params.content);
        values.push(params.tagcode);
        console.log(params);
        var query = 'insert into t_wc_news (title, summary, content, tagcode) values ($1, $2, $3, $4)';
        postgreHelper.dbQuery(query, values, next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err});
        }else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '添加成功'}});
        }
    });
};

exports.modify = function(req, res) {
    var params = req.body.data;
    var values = [];
    var steps = {};

    steps.splitUrl = function(next) {
        clientToRemote(params, next);
    };

    steps.modify = ['splitUrl', function(next, data) {
        values.push(params.title);
        values.push(params.summary);
        values.push(params.content);
        values.push(params.id);
        var query = 'update t_wc_news set title = $1, summary =$2, content=$3 where id = $4';
        console.log(values);
        postgreHelper.dbQuery(query, values, next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            res.json(500, {err: err});
        }else {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '编辑成功'}});
        }
    });

};

function clientToRemote(params, next) {
    var reg = new RegExp('"http:.*?"', 'g');

    var r = params.content.match(reg);

    var baseImageUrl = global.NEW_SERVER_HOST;

    var localBaseImageUrl = global.NEWS_BASIC_PATH;

    var paces = {};
    _.each(_.uniq(r), function(value, key) {
        paces[key] = function(next) {
            var paths = value.split('/');
            var replace = new RegExp('<img src=' + value + '.*?>', "g");
            var path = '<img src="http://' + baseImageUrl + '/wxqyh/v1/files/' + paths[paths.length - 4] + '/' + paths[paths.length - 3]  + '/' + paths[paths.length - 1] + ' style="height:auto; max-width:100%" />';
            var previewPath = '<figure itemprop="associatedMedia" itemscope=""><a href="http://' +
                baseImageUrl + '/wxqyh/v1/files/' +
                paths[paths.length - 4] + '/' +
                paths[paths.length - 3] + '/' +
                paths[paths.length - 1];

            var imgPath = localBaseImageUrl + paths[paths.length - 4] + '/' + paths[paths.length - 3]  + '/picture/' + paths[paths.length - 1];
            gm(imgPath.substring(0, imgPath.length - 1)).identify(function(err, data) {
                if(!err) {
                    if(data.size.height > 768) {
                        params.content = params.content.replace(replace, path);
                    }else {
                        previewPath +=  ' data-size="'+data.size.width+'x'+data.size.height+'"><img src="http://' +
                        baseImageUrl + '/wxqyh/v1/files/' +
                        paths[paths.length - 4] + '/' +
                        paths[paths.length - 3] + '/' +
                        paths[paths.length - 1] +
                        ' itemprop="thumbnail" style="height:auto; max-width:100%" />' +
                        '</a></figure>';
                        params.content = params.content.replace(replace, previewPath);
                    }
                    next(null, null);
                }else {
                    next(err);
                }
            });
        };
    });
    async.parallel(paces, next);
}



