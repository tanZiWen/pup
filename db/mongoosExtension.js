/**
 * Created by wangnan on 14-5-21.
 */

var _ = require('underscore');
var async = require('async');
var util = require('../lib/utils');

/**
 *
 * @param definition
 */
exports.extendStatic = function(definition) {
    _.each(definition, function(value, key) {
        value.statics.findByPage = function(pagination, callback) {
            var steps = {};
            var model = this;
            steps.count = function(next) {
                var query = model.where(pagination.condition);
                if(pagination.where) {
                    query.$where(pagination.where);
                }
                query.count(function(err, count) {
                    if(!err) {
                        next(null, count);
                    } else {
                        next(err);
                    }
                });
            };
            steps.docs = function(next) {
                var query = model.where(pagination.condition);
                if(pagination.where) {
                    query.$where(pagination.where);
                }
                query.sort(pagination.sort)
                    .skip(pagination.getBegin())
                    .limit(pagination.pageCount)
                    .exec(function(err, docs) {
                        if(!err) {
                            next(null, docs);
                        } else {
                            next(err);
                        }
                    });
            }
            async.parallel(steps, function(err, result) {
                if(!err) {
                    pagination.total = result.count;
                    callback(null, result.docs);
                } else {
                    callback(err);
                }
            });
        };

        value.statics.add = function(modelObj, idg, cb) {
            var model = this;
            idg.next(model.collection.name, function (err, result){
                if(err){
                    cb(err);
                }
                else {
                    var id = parseInt(result.toString());
                    if(!modelObj._id) {
                        modelObj._id = id;
                    }
                    model.create(modelObj, function(err, m){
                        if(!err) {
                            cb(null, m);
                        } else {
                            cb(err);
                        }
                    });
                }
            });
        };

        value.statics.addManual = function(modelObj, id, cb) {
            var model = this;
            if(!modelObj._id) {
                modelObj._id = id;
            }
            model.create(modelObj, function(err, m){
                if(!err) {
                    cb(null, m);
                } else {
                    cb(err);
                }
            });
        };

        /**
         *
         * @param data 源数据对象集合
         * @param optional
         *  idFieldName : 源数据对象ID字段名
         *  refFieldName : 源数据对象中的引用对象ID字段名
         *  refDataFieldName : 源数据对象中的引用对象字段名
         * @param callback
         */
        value.statics.loadRefFor = function(data, optional, callback) {
            if(!optional) {
                throw new Error('params refFieldName, refDataFieldName is required !');
            }
            var idFieldName = optional.idFieldName || '_id';
            var refFieldName = optional.refFieldName;
            var refDataFieldName = optional.refDataFieldName;

            if(!refFieldName) {
                throw new Error('param "refFieldName" is required !');
            }
            if(!refDataFieldName) {
                throw new Error('param "refDataFieldName" is required !');
            }

            var refList = [];

            if(data) {
                if(_.isArray(data)) {
                    refList = data;
                } else {
                    refList.push(data);
                }
                var conditions = {};
                var idCondition = _.without(_.pluck(refList, refFieldName), undefined, null, '');
                if(!idCondition) {
                    idCondition = [];
                }
                conditions[idFieldName] = {$in : idCondition};

                this.find(conditions, function(err, docs) {
                    if(err) {
                        callback(err);
                    } else {
                        for(var j in refList) {
                            for(var i in docs) {
                                if(docs[i][idFieldName] == refList[j][refFieldName]) {
                                    refList[j][refDataFieldName] = docs[i]._doc;
                                    break;
                                } else if((i + 1) == docs.length) {
                                    refList[j][refDataFieldName] = {};
                                }
                            }
                        }
                        callback(null, refList);
                    }
                });
            } else {
                callback(null, refList);
            }
        };
    });
};