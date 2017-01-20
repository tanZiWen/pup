

var model = exports.model = require('../../db/upm/model'),
    organizationDao = require('../../db/upm/organizationDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore');

var orgArr = [];
var orgMap = {};

init();

exports.getRootOrgs = function() {
    var rootOrgs = [];
    _.each(orgArr, function(org) {
        var rootOrg = {};
        rootOrg.code = org.code;
        rootOrg.name = org.name;
        rootOrgs.push(rootOrg);
    });
    return rootOrgs;
}

exports.getRootOrgByCode = function(code) {

    var rootOrg =  _.find(this.getRootOrgs(), function(rootOrg){
        return _.contains(this.getOrgCodesByParentCode(rootOrg.code), code);
    })

    if(rootOrg != null && rootOrg != undefined) {
        return rootOrg.code;
    }
    return null;
}

exports.getOrgCodesByParentCode = function(code) {
    var rootOrg = findByCode(code, orgArr);
    var orgCodes = [];
    if(rootOrg != null && _.has(rootOrg, 'children')) {
        _.each(rootOrg.children, function(org) {
            orgCodes.push(org.code);
        });
    }
    return orgCodes;
}

exports.getDepartsByParentCode = function(code) {
    var rootOrg = findByCode(code, orgArr);
    var orgs = [];
    if(rootOrg != null && _.has(rootOrg, 'children')) {
        _.each(rootOrg.children, function(org) {
            if(org.type == dictionary.orgType.department) {
                var subOrg = {};
                subOrg.code = org.code;
                subOrg.name = org.name;
                orgs.push(subOrg);
            }
        });
    }
    return orgs;
}

exports.getOrgsByParentCode = function(code) {
    var rootOrg = findByCode(code, orgArr);
    var orgs = [];
    if(rootOrg != null && _.has(rootOrg, 'children')) {
        _.each(rootOrg.children, function(org) {
            var subOrg = {};
            subOrg.code = org.code;
            subOrg.name = org.name;
            orgs.push(subOrg);
        });
    }
    return orgs;
}

exports.getOrgByCode = function(code) {
    return orgMap[code];
}


function init() {
    var rootCode = 'root';
    organizationDao.findAll(function(err, orgs) {
        if(err) {
            callback(err, null);
        } else {
            try {
                orgMap = _.indexBy(orgs, 'code');
                orgArr = buildOrg({code : rootCode}, orgs);
            } catch(e) {
            }

        }
    });

}

function buildOrg(parent, orgs) {
    var children = getChildren(parent.code, orgs);
    if(children.length > 0) {
        parent.children = children;
        for(var i = 0; i < children.length; i++) {
            buildOrg(children[i], orgs);
        }
    }
    return children;
}

function getChildren(parentCode, orgs) {
    var children = [];
    for(var i = 0; i < orgs.length; i++) {
        if(orgs[i].parentCode == parentCode) {
            children.push(orgs[i]._doc);
        }
    }
    return children;
}

function findByCode(code, orgs) {
    var org = null;
    for(var i = 0; i < orgs.length; i++) {
        if(org == null) {
            if(orgs[i].code == code) {
                org = orgs[i];
                break;
            } else if (_.has(orgs[i], 'children')) {
                org = findByCode(code, orgs[i].children);
            }
        } else {
            break;
        }
    }
    return org;
}