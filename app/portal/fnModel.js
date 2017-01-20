/**
 * Created by wangnan on 14-5-5.
 */

var functionDao = require('../../db/upm/functionDao');
var logger = require('../../lib/logFactory').getModuleLogger(module);
var _ = require('underscore');
var dictionary = require('../../lib/dictionary');

exports.buildMenuTree = function(appCode, parentCode, sessionUser, callback) {
    var rootCode = 'root';
    var includeCodes = null;
    var menuTree = [];
    if(parentCode) {
        rootCode = parentCode;
    }
    if(sessionUser) {
        includeCodes = _.pluck(sessionUser.functionList, 'code');
    }

    functionDao.findByApp(appCode, function(err, funcs) {
        if(err) {
            callback(err, null);
        } else {
            try {
                menuTree = buildTree(
                    {code : rootCode},
                    funcs,
                    [dictionary.fnType.menu, dictionary.fnType.fn],
                    includeCodes
                )
            } catch(e) {
                callback(e, null);
            }
            callback(null, menuTree);
        }
    });

};

function buildTree(parent, funcs, includeTypes, includeCodes) {
    var children = getChildren(parent.code, funcs, includeTypes, includeCodes);
    if(children.length > 0) {
        parent.children = children;
        for(var i = 0; i < children.length; i++) {
            buildTree(children[i], funcs, includeTypes);
        }
    }
    return children;
}

function getChildren(parentCode, funcs, includeTypes, includeCodes) {
    var children = [];
    for(var i = 0; i < funcs.length; i++) {
        if(funcs[i].parentCode == parentCode
            && _.contains(includeTypes, funcs[i].type)) {
            if(!includeCodes || (includeCodes && _.contains(includeCodes, funcs[i].code))) {
                children.push(funcs[i]._doc);

            }
        }
    }
    return children;
}