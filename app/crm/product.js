/**
 *
 * User: wuzixiu
 * Date: 2/11/14
 * Time: 4:39 PM
 */
var productDao = require('../../db/crm/productDao'),
    orderDao = require('../../db/crm/orderDao'),
    productTrendDao = require('../../db/crm/productTrendDao'),
    productRefDataDao = require('../../db/crm/productRefDataDao'),
    productAttachmentDao = require('../../db/crm/productAttachmentDao'),
    userDao = require('../../db/upm/userDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore');
    async = require('async');
    fs = require('fs'),
    idg = require('../../db/idg'),
    Pagination = require('../../lib/Pagination'),
    dictModel = require('../portal/dictModel'),
    G = require('../../lib/global'),
    eventReceiver = require('../../event/Receiver'),
    postgreHelper = require('../../db/postgreHelper'),
    appCfg = require('../../app.cfg.js'),
    global = require('../../lib/global.js'),
    httpHelper = require('../../lib/httpHelper'),
    galleryDirDao = require('../../db/crm/galleryDirDao'),
    util = require('util'),
    path = require('path'),
    gm = require('gm'),
    querystring = require('querystring');
    logger = require('../../lib/logFactory').getModuleLogger(module);


exports.list = function (req, res) {
    var data = {};
    var typeList = dictModel.getDictByType(dictionary.dictTypes.productType);
    var statusList = dictModel.getDictByType(dictionary.dictTypes.productStatus);
    data.typeList = typeList;
    data.statusList = statusList;
    userDao.findRM(function(err, rms) {
        if(!err) {
            data.rms = rms;
        } else {
            data.rms = [];
        }
        res.json(data);
    });

};

exports.dataList = function (req, res) {
    if(req.query.page.condition != undefined && req.query.page.condition.keyword != undefined) {
        req.query.page.condition = {$or : [{name: new RegExp(req.query.page.condition.keyword)}, {issueOrg: new RegExp(req.query.page.condition.keyword)}]};
    }
    var pagination = new Pagination(req);
    productDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            res.json({data : docs, pagination : pagination});
        }
    });
};

exports.detail = function (req, res) {

    var user = req.session.user;
    var attachtWhere = {privilege : {$elemMatch: {userPosition: user.position, read: true}}};

    var steps = {};
    steps.attachments = function(next) {
        productAttachmentDao.getLatestRecords(req.query.id, attachtWhere, next);
    };

    steps.trends = function(next) {
        var query = 'select * from t_wc_news where tagcode = $1 and del = false order by crt desc limit 3';
        postgreHelper.dbQuery(query, [req.query.id], next);
    };

    steps.refDatas = function(next) {
        productRefDataDao.getLatestRecords(req.query.id, next);
    };

    steps.getOrderAmountByPrd = function(next) {
        orderDao.sumOrderAmountByPrd(req.query.id, next);
    };

    steps.product = function(next) {
        productDao.findById(req.query.id, next);
    };

    async.parallel(steps, function(err, result) {
        if (err) {
            res.json({});
        } else {
            var typeList = dictModel.getDictByType(dictionary.dictTypes.productType);
            var statusList = dictModel.getDictByType(dictionary.dictTypes.productStatus);
            var typeObj = dictModel.getDictByTypeAndKey(dictionary.dictTypes.productType, result.product._doc.type);
            if(typeObj) {
                result.product._doc.typeName = typeObj.name;
            }
            result.product._doc.typeList = typeList;
            result.product._doc.statusList = statusList;
            result.product._doc.trends = result.trends.rows;
            result.product._doc.refDatas = result.refDatas;
            result.product._doc.attachments = result.attachments;
            result.product._doc.user = user;
            result.product._doc.orderAmount = result.getOrderAmountByPrd;
            result.product._doc.raisePro = parseInt((result.getOrderAmountByPrd * 100) / result.product.totalAmount);

            res.json(result.product);
        }
    });

};

exports.view = function(req, res) {
    //TODO
}

exports.news = function (req, res) {
    res.render('crm/product/list', { title: 'CRM' });
};

exports.create = function (req, res) {
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;
    params.totalAmount = parseInt(params.totalAmount);
    params.minPeriod = parseInt(params.minPeriod);
    params.maxPeriod = parseInt(params.maxPeriod);
    params.publishStatus = dictionary.publishStatus.unpublished;
    productDao.create(params, function(err, result) {
        if(!err) {
            res.json({msg : {type : dictionary.resMsgType.succ, body : '添加成功'}});
        }else {
            res.json({msg : {type : dictionary.resMsgType.error, body : '添加失败'}});
        }
    });
};

exports.modify = function(req, res) {
    var params = req.body;
    var user = req.session.user;
    params.cuserid = user._id;
    params.cusername = user.username;
    params.crealName = user.realName;
    params.uuserid = user._id;
    params.uusername = user.username;
    params.urealName = user.realName;
    params.totalAmount = parseInt(params.totalAmount);
    params.minPeriod = parseInt(params.minPeriod);
    params.maxPeriod = parseInt(params.maxPeriod);

    var steps = {};

    steps.getOrderAmountByPrd = function(next) {
        orderDao.sumOrderAmountByPrd(params._id, next);
    };

    steps.product = function(next) {
        productDao.modify(params, function(err, result) {
            if(!err) {
                next(null, params);
            } else {
                next(err);
            }
        });
    };

    async.parallel(steps, function(err, data) {
        if(!err) {
            var product = data.product;
            product.orderAmount = data.getOrderAmountByPrd;
            product.raisePro = parseInt((data.getOrderAmountByPrd * 100) / data.product.totalAmount);
            var typeObj = dictModel.getDictByTypeAndKey(dictionary.dictTypes.productType, product.type);
            if(typeObj) {
                product.typeName = typeObj._doc.name;
            }
            res.json({msg : {type : dictionary.resMsgType.succ, body : '修改成功', attach: product}});
        }else {
            res.json({msg : {type : dictionary.resMsgType.error, body : '修改失败'}});
        }
    });
};

exports.publishList = function(req, res) {
    var productStatus = dictModel.getDictByType(dictionary.dictTypes.publishStatus);
    res.json({productStatus: productStatus});
};

exports.publishListTable = function(req, res) {
    var pagination = new Pagination(req);
    productDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            var publishListTable = _.pluck(docs, '_doc');
            _.each(publishListTable, function(value) {
                if(value.publishStatus) {
                    value.publishStatusName = dictModel.getDictByTypeAndKey(dictionary.dictTypes.publishStatus, value.publishStatus).name;
                }else {
                    value.publishStatusName = '未发布';
                }
            });
            res.json({data : docs, pagination : pagination});
        }
    });
};

exports.publish = function(req, res) {
    var steps = {};

    var id = req.param('id');

    steps.products = function(next) {
        if(id) {
            productDao.findById(id, next);
            return
        }
        productDao.find({}, next);
    };

    steps.publish = ['products', function(next, data) {
        var products = data.products;
        var proccess = {};
        if(Array.isArray(products)) {
            _.each(products, function(value) {
                proccess[value._id] = function(next) {
                    insertOrupdate(value, next);
                }
            });
            async.parallel(proccess, next);
        }else {
            insertOrupdate(products, next);
        }
    }];

    steps.syncProduct = ['publish', function(next, data) {
        if(data.publish) {
            var process = {};
            if(!_.isEmpty(data.publish)) {
                if(_.isArray(data.publish)) {
                    _.each(data.publish, function(value, key) {
                        process[key] = function(next) {
                            var product = {};
                            product._id = key;
                            if(value.rowCount > 0) {
                                product.publishStatus = dictionary.publishStatus.published;
                            }
                            productDao.modify(product, next);
                        }
                    });
                    async.parallel(process, next);
                    return
                }
                var product = {};
                product._id = id;
                if(data.publish.rowCount > 0) {
                    product.publishStatus = dictionary.publishStatus.published;
                }
                productDao.modify(product, next);
            }else {
                next('error');
            }
        }else {
            next('error');
        }
    }];

    async.auto(steps, function(err, result) {
        if(err) {
            logger.debug('crm.product.publishAll err:', err);
            res.json({msg :{type : dictionary.resMsgType.error, body : '系统错误,发布失败'}});
        }else {
            res.json({msg :{type : dictionary.resMsgType.succ, body : '发布成功'}});
        }
    })
};

exports.mkdir = function(req, res) {
    var params = req.body;
    var steps = [];
    var data = {};
    data.newsdir = params.newsdir;
    mkDirStep(req, data, steps);
    async.waterfall(steps, function(err, result) {
        if(err) {
            logger.error('crm.product.mkdir error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(result == 500) {
                res.json({msg :{type : dictionary.resMsgType.error, body : '该新闻目录已存在!'}});
                return
            }
            if(_.isNumber(result) && result != 200 ) {
                res.json({msg :{type : dictionary.resMsgType.error, body : '新建失败!'}});
                return
            }
            res.json({msg :{type : dictionary.resMsgType.succ, body : '新建成功'}});
        }
    })
};

function insertOrupdate(value, next) {
    var procedure = [];
    procedure[0] = function(next) {
        var selectQuery = 'select * from t_wc_tag where tagcode = $1';
        postgreHelper.dbQuery(selectQuery, [value._id], next);
    };

    procedure[1] = function(data, next) {
        if(data.rows.length > 0) {
            var updateQuery = 'update t_wc_tag set brief = $1, lut = $2 where tagcode=$3';
            postgreHelper.dbQuery(updateQuery, [value.name, new Date(), value._id.toString()], next);
            return
        }
        var insertQuery = 'insert into t_wc_tag (tagcode, brief, crt, lut) values ($1, $2, $3, $4)';
        postgreHelper.dbQuery(insertQuery, [value._id.toString(), value.name, new Date(), new Date()], next)
    };
    async.waterfall(procedure, next);
};

exports.uploadImage = function(req, res) {
    var steps = {};
    var data = {};
    data.newsdir = req.body.newsdir;
    uploadImageStep(req, data, steps);
    async.auto(steps, function(err, result) {
        if(!err) {
            if(result.upload.statusCode == 200){
                res.json({msg: {type: dictionary.resMsgType.succ, body: '上传成功!'}});
                return
            }
            res.json({msg :{type : dictionary.resMsgType.error, body : '上传失败!'}});
            return
        }
        res.json({msg :{type : dictionary.resMsgType.error, body : '上传失败!'}});
    })
};

exports.getImageDir = function(req, res) {
    var params = req.query;
    console.log(params);
    galleryDirDao.getDirs(params, function(err, result) {
        if(err) {
            logger.error('crm.product.getDir error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            res.json({dirs: result});
        }
    })
};

exports.imageView = function(req, res) {
    var params = req.query;
    galleryDirDao.findOne(params, function(err, result) {
        if(err) {
            logger.error('crm.product.getDir error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(!_.isEmpty(result)) {
                var imageNames = result.imageNames;
                var imageInfos = new Array();
                var reqImageBasicUrl = global.HOST + '/news/';
                _.each(imageNames, function(name, key) {
                    var imageInfo = {};
                    var index = parseInt(key/6);
                    if(key % 6 == 0) {
                        imageInfos[index] = new Array();
                    }
                    var reqImagePrefixUrl = reqImageBasicUrl + result.tagCode + '/' + result.name;
                    imageInfo.thumbImageName = reqImagePrefixUrl + '/thumbnail/' + name;
                    imageInfo.originImageName = reqImagePrefixUrl + '/picture/' + name;
                    imageInfo.name = result.name + '_' + key;
                    imageInfos[index].push(imageInfo);
                });
                res.json({imageInfos: imageInfos});
            }else {
                res.json({imageInfos: []});
            }

        }
    });
};

exports.trendData = function(req, res) {
    var id = req.param('id');
    var tagcode = req.param('tagcode');

    var steps = {};
    steps.trend = function(next) {
        var selectQuery = 'select * from t_wc_news where id = $1';
        postgreHelper.dbQuery(selectQuery, [id], next);
    };

    steps.dirs = function(next) {
        galleryDirDao.getDirs({tagCode: tagcode}, next);
    };

    async.auto(steps, function(err, result) {
        if(err) {
            logger.error('crm.product.trendData error:', err.stack);
            res.json(500, {err: err.stack});
            return
        }
        var trends = result.trend;
        var dirs = result.dirs;
        if(trends.rowCount == 1) {
            var trend = trends.rows[0];
            var content = trend.content;

            var reg;

            var index = content.indexOf('<figure itemprop="associatedMedia" itemscope="">');
            if (index != -1) {
                reg = new RegExp('<figure itemprop="associatedMedia" itemscope=""><a href="http:.*?"', 'g');
            }

            var partReg = content.match(reg);

            reg = new RegExp('"http:.*?"', 'g');

            var allReg = content.match(reg);

            var baseImageUrl = global.HOST + '/news/';

            allReg = _.uniq(allReg);
            _.each(partReg, function (value) {
                var paths = value.split('/');
                var replace = new RegExp(value + '.*?</figure>', "g");
                var path = '<img src="' + baseImageUrl + paths[paths.length - 3] + '/' + paths[paths.length - 2] + '/picture/' + paths[paths.length - 1] + '/>';
                trend.content = trend.content.replace(replace, path);
                reg = new RegExp('"http:.*?"', 'g');
                allReg = _.difference(allReg, value.match(reg));
            });
            _.each(allReg, function(value) {
                var paths = value.split('/');
                var replace = new RegExp('<img src=' + value + '.*?>', "g");
                var path = '<img src="' + baseImageUrl + paths[paths.length - 3] + '/' + paths[paths.length - 2]  + '/picture/' + paths[paths.length - 1] + ' _src="http://'+ baseImageUrl + paths[paths.length - 3] + '/' + paths[paths.length - 2]  + '/picture/' + paths[paths.length - 1]+ '/>';
                trend.content = trend.content.replace(replace, path);
            });
            res.json({trend: trend, dirs: dirs});
            return
        }
        res.json({trend: {},  dirs: dirs});
    });
};


exports.delTrend = function(req, res) {
    var id = req.param('id');
    var selectQuery = 'update t_wc_news set del = true where id = $1';
    postgreHelper.dbQuery(selectQuery, [id], function(err, result) {
        if(err) {
            logger.error('crm.prodcut.delTrend error:', err.stack);
            res.json(500, {err: err.stack});
            return;
        }
        res.json({msg :{type : dictionary.resMsgType.succ, body : result}});
    });
};


exports.newsDataList = function(req, res) {
    var pagination = new Pagination(req);
    var selectQuery = '';
    var params = [];
    if(pagination.condition.title != undefined && pagination.condition.tag == undefined) {
        selectQuery = 'select t.brief, n.title, n.crt, n.id, n.tagcode from t_wc_news n, t_wc_tag t where n.del=false and n.tagcode = t.tagcode and title like $1 order by crt desc limit $2 offset $3';
        params.push('%'+pagination.condition.title+'%');
    }else if(pagination.condition.title == undefined && pagination.condition.tag != undefined) {
        selectQuery = 'select t.brief, n.title, n.crt, n.id, n.tagcode from t_wc_news n, t_wc_tag t where n.del=false and n.tagcode = t.tagcode and t.brief like $1 order by crt desc limit $2 offset $3';
        params.push('%'+pagination.condition.tag+'%');
    }else if(pagination.condition.title != undefined && pagination.condition.tag != undefined) {
        selectQuery = 'select t.brief, n.title, n.crt, n.id, n.tagcode from t_wc_news n, t_wc_tag t where n.del=false and n.tagcode = t.tagcode and title lick $1 and t.brief like $2 order by crt desc limit $3 offset $4';
        params.push('%'+pagination.condition.title+'%');
        params.push('%'+pagination.condition.tag+'%');
    }else {
        selectQuery = 'select t.brief, n.title, n.crt, n.id, n.tagcode from t_wc_news n, t_wc_tag t where n.del=false and n.tagcode = t.tagcode order by crt desc limit $1 offset $2';
    }

    params.push(pagination.pageCount);
    params.push((pagination.currentPage - 1) * pagination.pageCount);

    postgreHelper.dbQuery(selectQuery, params, function(err, result) {
        if(err) {
            logger.error('crm.prodcut.delTrend error:', err.stack);
            res.json(500, {err: err.stack});
            return;
        }
        var news = result.rows;
        pagination.total = news.length;
        res.json({pagination: pagination, newsList: news});
    });
};

exports.tagAdd = function(req, res) {
    var params = req.body;

    var steps = [];

    steps.push(function(next) {
        var selectQuery = 'select count(*) from t_wc_tag where tagcode = $1';
        postgreHelper.dbQuery(selectQuery, [params.tagcode], next);
    });

    steps.push(function(data, next) {
        if(data.rows && data.rows[0].count == 0) {
            var insertQuery = 'insert into t_wc_tag (tagcode, brief, crt, lut) values ($1, $2, $3, $4)';
            postgreHelper.dbQuery(insertQuery, [params.tagcode, params.brief, new Date(), new Date()], next)
        }else {
            next(null, false)
        }
    });

    async.waterfall(steps, function(err, result) {
        if(err) {
            logger.error('crm.product.tagAdd error:', err.stack);
            res.json(500, {err: err.stack});
            return
        }
        if(result) {
            res.json({msg :{type : dictionary.resMsgType.succ, body : '新建成功'}});
            return
        }
        res.json({msg :{type : dictionary.resMsgType.info, body : '标签编码已存在!'}});
        return
    })
};

exports.getTags = function(req, res) {
    var insertQuery = 'select tagcode, brief from t_wc_tag where del = false';
    postgreHelper.dbQuery(insertQuery, [], function(err, result) {
        if(err) {
            logger.error('crm.product.showAddNew error:', err.stack);
            res.json(500, {err: err.stack});
            return
        }
        res.json({tags: result.rows});
    })
};

exports.upload = function(req, res) {
    var params = req.body;
    var steps = [];
    var data = {};

    if(params.suffix_dir != '') {
        data.newsdir = params.prefix_dir + '_' + params.suffix_dir;
    }else {
        data.newsdir = params.prefix_dir;
    }
    steps.push(function(next) {
        var paces = [];
        mkDirStep(req, data, paces);
        async.waterfall(paces, next);
    });

    steps.push(function(doc, next) {
        var paces = {};
        uploadImageStep(req, data, paces);
        async.auto(paces, next);
    });
    async.waterfall(steps, function(err, result) {
        if(err) {
            logger.error('crm.product.upload error:', err.stack);
            res.json(500, {err: err.stack});
        }else {
            if(result) {
                res.json({msg :{type : dictionary.resMsgType.success, body : '上传成功!'}});
            }else {
                res.json({msg :{type : dictionary.resMsgType.error, body : '目录存在!'}});
            }
        }
    })
};

//创建目录实现
function mkDirStep(req, dirObj, steps) {
    var options = appCfg.nodejsTogoRequestOptions;

    var tagcode = req.body.tagcode;

    options.path = '/wxqyh/v1/files/' + tagcode;
    options.headers['Content-Type'] =  'application/json';

    var postData = JSON.stringify(dirObj);

    options.headers['Content-Length'] = Buffer.byteLength(postData);


    steps[0] = function(next) {
        httpHelper.httpHelper(options, postData, next);
    };

    steps[1] = function(data, next) {
        if(data.statusCode == 200) {
            var trendsDir = {};
            console.log(tagcode, dirObj.newsdir);
            trendsDir.tagCode = tagcode;
            trendsDir.name = dirObj.newsdir;
            trendsDir.cuserid = req.session.user._id;
            trendsDir.cusername = req.session.user.name;
            trendsDir.crealName = req.session.user.realName;
            galleryDirDao.add(trendsDir, next);
            return
        }
        next(null, data.statusCode)
    };
}

//上传图片实现
function uploadImageStep(req, dirObj, steps) {
    var params = req.body;
    var files = req.files;

    var httpMultiparty = httpHelper.httpMultiparty(files);
    httpMultiparty.options.path = '/wxqyh/v1/files/'+params.tagcode+'/' + dirObj.newsdir;


    steps.upload = function(next) {
        var httpReq = http.request(httpMultiparty.options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            if(res.statusCode != 200) {
                next(res.statusCode);
            }
            res.on('data', function (resultData) {
                try {
                    console.log("insert new error:", resultData);
                    next(null, {statusCode: res.statusCode, resultData: resultData});
                } catch (e) {
                    logger.error('crm.product.uploadImages:', err);
                    next(e)
                }
            });
        });

        httpReq.on('error', function(err) {
            logger.error('crm.product.uploadImages:', err);
            next(e)
        });

        async.eachSeries(httpMultiparty.fileInfo, function(file, cb) {
            fs.readFile(file.filePath, function(err, content) {
                if(!err) {
                    httpReq.write(file.contentBinary);
                    httpReq.write(content);
                    httpReq.write(httpMultiparty.nextLine);
                }
                cb(err);
            })
        }, function(err) {
            if(err) {
                logger.error('crm.product.uploadImages:', err);
            }
            httpReq.end(httpMultiparty.enddata);
        });
    };

    var paces = {};
    var productNewsPaht = global.NEWS_BASIC_PATH + params.tagcode +'/'+  dirObj.newsdir + '/';
    var productNewsPicPath = productNewsPaht + 'picture/';
    var productNewsThumPath = productNewsPaht + 'thumbnail/';
    var i= 0;

    steps.remove = ['upload', function(next, data) {
        _.each(files, function(value, key) {
            paces[i++] = function (cb) {
                var renamePath = '';
                async.series([
                    function(next) {
                        var walk = {};
                        walk.thumbnailDir = function (next) {
                            fs.exists(productNewsPicPath, function (exist) {
                                if (!exist) {
                                    fs.mkdir(productNewsPicPath, 511, true, next);
                                    return
                                }
                                next(null, false);
                            });
                        };
                        walk.pictureDir = function (next) {
                            fs.exists(productNewsThumPath, function (exist) {
                                if (!exist) {
                                    fs.mkdir(productNewsThumPath, 511, true, next);
                                    return
                                }
                                next(null, false);
                            });
                        };
                        async.parallel(walk, next);
                    },
                    function(next) {
                        renamePath = productNewsPicPath + value.name;
                        fs.rename(value.path, renamePath, next);
                    },
                    function(next) {
                        var thumbnailPath = productNewsThumPath + value.name;
                        gm(renamePath).thumb(100, 100, thumbnailPath, 0, next);
                    }
                ], cb);
            };
        });
        async.parallel(paces, next);
    }];

    steps.addImages = ['remove', function(next, data) {
        galleryDirDao.pushImageNames({tagCode: params.tagcode, name: dirObj.newsdir}, {imageNames: httpMultiparty.fileNames}, next);
    }];
}



