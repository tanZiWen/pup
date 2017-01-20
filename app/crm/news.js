/**
 * Created by tanyuan on 12/22/15.
 */

var dictionary = require('../../lib/dictionary.js');
var idg = require('../../db/idg');
var async = require('async');
var G = require('../../lib/global');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var fs = require('fs');
var gm = require('gm');
var httpHelper = require('../../lib/httpHelper');
var global = require('../../lib/global.js');
var appCfg = require('../../app.cfg.js');
var path = require("path");
var Pagination = require('../../lib/Pagination');
var postgreHelper = require('../../db/postgreHelper');
var galleryDirDao = require('../../db/crm/galleryDirDao');
var moment = require('moment');
var dictModel = require('../portal/dictModel');
var _ = require('underscore');
var querystring = require('querystring');
var mkdirp = require('mkdirp');

exports.list = function(req, res) {
    var newsType = dictModel.getDictByType(dictionary.dictTypes.newsType);
    galleryDirDao.client.find({tagCode: dictionary.channelType.news}, {'name': 1}, {sort: {'_id': -1}}, function(err, result) {
        if(err) {
            logger.error('crm.news.list error:', err);
            res.json(500, {err: err.stack})
        }else {
            res.json({newsType: newsType, dirs: result});
        }
    });
};

exports.lists = function(req, res) {
    galleryDirDao.client.find({tagCode: dictionary.channelType.strategy}, {'name': 1}, {sort: {'_id': -1}}, function(err, result) {
        if(err) {
            logger.error('crm.news.list error:', err);
            res.json(500, {err: err.stack})
        }else {
            res.json({dirs: result});
        }
    });
};

exports.upload = function(req, res) {
    var code = req.param("code");
    var files = req.files;
    var steps = {};
    var newsPicturePath = G.NEWS_PICTURE_PATH;
    var newsThumbnailPath = G.NEWS_THUMBNAIL_PATH;
    var strategyPicturePath = G.STRATEGY_PICTURE_PATH;
    var strategyThumbnailPath = G.STRATEGY_THUMBNAIL_PATH;

    var renamePath = '';

    var dirName = moment(new Date()).format('YYYYMMDD');

    steps.upload = function(next) {
        var httpMultiparty = httpHelper.httpMultiparty(files);
        httpMultiparty.options.path = '/web/v1/news/upload/'+dirName;
        httpMultiparty.options.headers["Security-Key"] = global.KEYSECRET_NEWS;
        var httpReq = http.request(httpMultiparty.options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            if (res.statusCode != 200) {
                next(res.statusCode);
            }
            res.on('data', function (resultData) {
                try {
                    next(null, {statusCode: res.statusCode, resultData: resultData});
                } catch (e) {
                    logger.error('crm.news.uploadImages:', err);
                    next(e)
                }
            });
        });

        httpReq.on('error', function (err) {
            logger.error('crm.news.uploadImages:', err);
            next(e)
        });

        async.eachSeries(httpMultiparty.fileInfo, function (file, cb) {
            fs.readFile(file.filePath, function (err, content) {
                if (!err) {
                    httpReq.write(file.contentBinary);
                    httpReq.write(content);
                    httpReq.write(httpMultiparty.nextLine);
                }
                cb(err);
            })
        }, function (err) {
            if (err) {
                logger.error('crm.news.uploadImages:', err);
            }
            httpReq.end(httpMultiparty.enddata);
        });
    };

    steps.renamePicture = ['upload', function(next, data) {
        var renameDir = '';
        if(code == dictionary.channelType.news) {
            renameDir = newsPicturePath + dirName;
        }else {
            renameDir = strategyPicturePath + dirName;
        }
        renamePath = renameDir + '/' + files.img.name;
        mkdirp(renameDir, function(err) {
            if(err) {
                next(err)
            }else {
                fs.rename(files.img.path, renamePath, next);
            }
        });
    }];

    steps.thumbnail = ['renamePicture', function(next, data) {
        var thumbnailPath = '';
        if(code == dictionary.channelType.news) {
            thumbnailPath = newsThumbnailPath + dirName;
        }else {
            thumbnailPath = strategyThumbnailPath + dirName;
        }
        console.log('thumbnailPath', thumbnailPath);
        mkdirp(thumbnailPath, function(err) {
            if(err) {
                next(err)
            }else {
                gm(renamePath).thumb(180, 180, thumbnailPath+ '/' + files.img.name, 0, next);
            }
        });
    }];

    steps.add = ['thumbnail', function(next, data) {
        galleryDirDao.findOne({name: dirName}, function(err, result) {
            if(err) {
                logger.error('crm.news.upload.galleryDir error:', err);
                next(err)
            }else {
                if(_.isEmpty(result)) {
                    var galleryDir = {};
                    galleryDir.cuserid = req.session.user._id;
                    galleryDir.crealName = req.session.user.realName;
                    galleryDir.cusername = req.session.user.username;
                    galleryDir.name = dirName;
                    galleryDir.tagCode = code;
                    galleryDir.imageNames = [files.img.name];
                    galleryDirDao.add(galleryDir, next)
                }else {
                    galleryDirDao.pushImageNames({name: dirName}, {imageNames: [files.img.name]}, next)
                }
            }
        });
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.news.upload error:', err.stack);
            res.json({msg: {type: dictionary.resMsgType.error}})
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ}})
        }
    });
};

exports.imageView = function(req, res) {
    var query = req.query;
    galleryDirDao.client.findOne({name: query.name}, null, function(err, result) {
        if(err) {
            logger.error('crm.news.imageView error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            var imageInfos = new Array();
            var reqImageBasicUrl = '';
            if(query.code == dictionary.channelType.news) {
                reqImageBasicUrl = global.HOST + 'news/trends/';
            }else {
                reqImageBasicUrl = global.HOST + 'news/strategy/';
            }
            _.each(result.imageNames, function(value, key) {
                var imageInfo = {};
                var index = parseInt(key/6);
                if(key % 6 == 0) {
                    imageInfos[index] = new Array();
                }
                imageInfo.thumbImageName = reqImageBasicUrl + 'thumbnail/' + result.name+ '/' + value;
                imageInfo.originImageName = reqImageBasicUrl + 'picture/' + result.name+ '/' + value;
                imageInfo.name = value.name;
                imageInfos[index].push(imageInfo);
            });
            res.json({imageInfos: imageInfos});
        }
    })
};

exports.add = function(req, res) {
    var params = req.body;
    var options = appCfg.nodejsTogoRequestOptions;
    options.path = '/web/v1/news/create';
    options.headers['Content-Type'] =  'application/json';

    if(params.titleImage) {
        var paths = params.titleImage.split("/");
        params.titleImage = paths[paths.length -2]+ '/' + paths[paths.length-1] ;
    }

    var postData = JSON.stringify(params);

    options.headers['Content-Length'] = Buffer.byteLength(postData);
    httpHelper.httpHelper(options, postData, function(err, result) {
        if(err) {
            logger.error('crm.news.httprequest error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '添加成功!'}})
        }
    });
};

exports.dataList = function(req, res) {
    var pagination = new Pagination(req);
    var limit = pagination.pageCount;
    var offset = (pagination.currentPage - 1 ) * limit;
    var channelPaths = {};
    var newsType = dictModel.getDictByType(dictionary.dictTypes.newsType);
    switch(pagination.condition.type) {
        case dictionary.channelType.news:
            channelPaths = [dictionary.channelPath.newsCompany, dictionary.channelPath.newsMedia];
            break;
        case dictionary.newsType.newsCompany:
            channelPaths = [dictionary.channelPath.newsCompany];
            break;
        case dictionary.newsType.newsMedia:
            channelPaths = [dictionary.channelPath.newsMedia];
            break;
        case dictionary.strategyType.strategyResearch:{
            channelPaths = [dictionary.channelPath.strategyResearch];
            break;
        }
        default:
            break;
    }
    var countQuery = "select count(*) from t_content where status = 1 and channel_path =  ANY ($1)";
    var selectQuery = "select id, channel_path, title, release_time, local from t_content where status = 1 and channel_path =  ANY ($3) order by id desc limit $1 offset $2";

    var steps = {};

    steps.count = function(next) {
        postgreHelper.websiteQuery(countQuery, [channelPaths], next);
    };

    steps.data = function(next) {
        postgreHelper.websiteQuery(selectQuery, [limit, offset, channelPaths], next);
    };

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.news.dataList error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            pagination.total = result.count.rows[0].count;
            var dataList = result.data.rows;
            _.each(dataList, function(value) {
                if(value.channel_path == dictionary.channelPath.newsCompany) {
                    value.channelPathName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.newsType, dictionary.newsType.newsCompany).name;
                }else {
                    value.channelPathName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.newsType, dictionary.newsType.newsMedia).name;
                }
            });
            res.json({dataList: dataList, pagination: pagination, newsType: newsType});
        }
    });
};

exports.delete = function(req, res) {
    var params = req.body;
    var options = appCfg.nodejsTogoRequestOptions;
    options.path = '/web/v1/news/static';

    options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';

    var postData = querystring.stringify({contentId: params.id});

    options.headers['Content-Length'] = Buffer.byteLength(postData);

    var steps = [];

    steps[0] = function(next) {
        var deleteQuery = 'update t_content set status = 0 where id= $1';
        postgreHelper.websiteQuery(deleteQuery, [params.id], next);
    };

    steps[1] = function(data, next) {
        httpHelper.httpHelper(options, postData, next);
    };

    async.waterfall(steps, function(err, result) {
        if(err) {
            logger.error('crm.news.dataList error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '删除成功!'}});
        }
    });
};

exports.modifyData = function(req, res) {
    var id = req.param('id');
    var modifyQuery = 'select id, channel_path, title, release_time, local, content, summary  from t_content where id = $1 and status = 1';
    postgreHelper.websiteQuery(modifyQuery, [id], function(err, result) {
        if(err) {
            logger.error('crm.news.dataList error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            var data = result.rows[0];
            var reqImageBasicUrl = global.HOST + 'news/trends/';
            data.title_image = reqImageBasicUrl + 'picture/' + data.title_image;
            if(data.channel_path == dictionary.channelPath.newsCompany) {
                data.newsType = dictionary.newsType.newsCompany;
            }else {
                data.newsType = dictionary.newsType.newsMedia;
            }
            res.json({data: data});
        }
    })
};

exports.modify = function(req, res) {
    var params = req.body;
    if(params.titleImage) {
        var paths = params.titleImage.split("/");
        params.titleImage = paths[paths.length -2]+ '/' + paths[paths.length-1] ;
    }

    //
    //var reg = new RegExp('"http:.*?"', 'g');
    //
    //var allReg = params.content.match(reg);
    //
    //var baseImageUrl = global.HOST + '/news/';
    //
    //allReg = _.uniq(allReg);
    //
    //console.log(allReg);
    //_.each(allReg, function(value) {
    //    var paths = value.split('/');
    //    var replace = new RegExp('<img src=' + value + '.*?>', "g");
    //    console.log('replace', replace);
    //    console.log('paths', paths);
    //    //var path = '<img src="' + baseImageUrl + paths[paths.length - 3] + '/' + paths[paths.length - 2]  + '/picture/' + paths[paths.length - 1] + ' _src="http://'+ baseImageUrl + paths[paths.length - 3] + '/' + paths[paths.length - 2]  + '/picture/' + paths[paths.length - 1]+ '/>';
    //    //trend.content = trend.content.replace(replace, path);
    //});
    var steps = {};
    var modifyQuery = "";
    steps.update = function(next) {
        if(params.type == dictionary.strategyType.strategyResearch) {
            modifyQuery = 'update t_content set title=$2, summary=$3, release_time=$4, content=$5, where id= $1';

            postgreHelper.websiteQuery(modifyQuery, [params.id, params.title, params.summary, params.releaseTime, params.content],  next);
        }else {
            modifyQuery = 'update t_content set title=$2, summary=$3, local=$4, release_time=$5, content=$6, title_image=$7 where id= $1';

            postgreHelper.websiteQuery(modifyQuery, [params.id, params.title, params.summary, params.local, params.releaseTime, params.content, params.titleImage],  next);
        }

    };
    steps.refresh = ['update', function(next, data) {
        var options = appCfg.nodejsTogoRequestOptions;

        options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';

        var postData = querystring.stringify({contentId: params.id});

        options.headers['Content-Length'] = Buffer.byteLength(postData);

        options.path = '/web/v1/news/static';

        httpHelper.httpHelper(options, postData, next);
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.news.dataList error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({msg: {type: dictionary.resMsgType.succ, body: '修改成功!'}});
        }
    });
};

