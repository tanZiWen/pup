/**
 * Created by michael on 5/20/14.
 */

var model = exports.model = require('../../db/upm/model'),
    dictionaryDao = require('../../db/upm/dictionaryDao'),
    _ = require('underscore');

var dictMap = {};

init();

exports.getDictByType = function(type) {
    return _.has(dictMap, type) ? dictMap[type] : [];
};

exports.getDictByTypeAndKey = function(type, key) {
    var typeList = dictMap[type];
    return _.find(typeList, function(type) {return type.key == key; });
};

exports.getDictByTypesAndKey = function(typeArray, key) {
    var dMap = exports.getMapByTypes(typeArray);
    return dMap[key];
};

exports.getListByTypes = function(typeArray) {
    if(!typeArray || typeArray.length == 0)
        return;
    var dList = [];
    for(var i in typeArray) {
        var dictArray = exports.getDictByType(typeArray[i]);
        for(var j in dictArray) {
            dList.push(dictArray[j]);
        }
    }
    return dList;
};

exports.getMapByTypes = function(typeArray) {
    if(!typeArray || typeArray.length == 0)
        return;
    var dMap = {};
    var dList = exports.getListByTypes(typeArray);
    for(var i in dList) {
        dMap[dList[i].key] = dList[i];
    }
    return dMap;
};

function init() {
    dictionaryDao.findAll(function(err, dicts) {
        _.each(dicts, function(dict) {
            if(_.has(dictMap, dict.type)) {
                dictMap[dict.type].push(dict);
            } else {
                dictMap[dict.type] = [];
                dictMap[dict.type].push(dict);
            }
        });
    });
};