/**
 * Created by michael on 5/20/14.
 */

var model = exports.model = require('../../db/upm/model'),
    areaDao = require('../../db/upm/areaDao'),
    _ = require('underscore');

var areas = [];

init();

exports.getAreaByCode = function(code) {
    return _.find(areas, function(area) {
        return area.code == code;
    });
}

exports.getAreas = function() {
    var simpleAreas = [];
    _.each(areas, function(area) {
        var areaSimple = {};
        areaSimple.code = area.code;
        areaSimple.name = area.name;
        simpleAreas.push(areaSimple);
    });
    return simpleAreas;
}

function init() {
    areaDao.findAll(function(err, docs) {
        _.each(docs, function(doc) {
            areas.push(doc._doc);
        });
    });
}