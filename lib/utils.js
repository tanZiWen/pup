/**
 *
 * User: wuzixiu
 * Date: 12/31/12
 * Time: 10:33 AM
 */

var _ = require('underscore'),
    _s = require('underscore.string'),
    path = require('path');
    util = require('util');

String.prototype.replaceAll = function (s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

exports.isDigit = function (str) {
    var pattern = new RegExp('^[0-9]$');

    if (_s.isBlank(str)) return false;

    str = _s.trim(str);

    return (str.search(/^[0-9]+$/) == 0);
};

exports.decode = function (C) {
    var digi = 16;
    var add = 10;
    var plus = 7;
    var cha = 36;
    var I = -1;
    var H = 0;
    var B = "";
    var J = C.length;
    var G = C.charCodeAt(J - 1);
    C = C.substring(0, J - 1);
    J--;
    for (var E = 0; E < J; E++) {
        var D = parseInt(C.charAt(E), cha) - add;
        if (D >= add) {
            D = D - plus
        }
        B += (D).toString(cha);
        if (D > H) {
            I = E;
            H = D
        }
    }
    var A = parseInt(B.substring(0, I), digi);
    var F = parseInt(B.substring(I + 1), digi);
    var L = (A + F - parseInt(G)) / 2;
    var K = (F - L) / 100000;
    L /= 100000;
    return {
        lat: K,
        lng: L
    }
};

exports.fillCreateAndUpdateTime = function (doc) {
    var time = new Date();

    if (!doc.crt) {
        doc.crt = time;
    }

    if (!doc.lut) {
        doc.lut = time;
    }
};

exports.mapItemsById = function (items) {
    if (!_.isArray(items)) {
        return items;
    } else {
        var map = {};

        for (var i = 0; i < items.length; i++) {
            map[items[i]._id] = items[i];
        }

        return map;
    }
};

exports.getProjectPath = function(pathname) {
    if(!pathname || pathname == path.sep || !_.isString(pathname)) {
        return global.projectRoot;
    } else {
        return path.normalize(path.join(global.projectRoot, pathname));
    }
};

exports.strFill = function(sourceStr, fillStr, leftOrRight, maxLength) {
    if(!sourceStr) {
        sourceStr = '';
    }
    if(!fillStr) {
        return sourceStr;
    }
    var sLength = sourceStr.length;
    var fLength = fillStr.length;
    if(fLength > 1) {
        fillStr = fillStr.substr(0, 1);
    }
    if(sLength >= maxLength) {
        return sourceStr;
    }
    var loops = maxLength-sLength;
    for(var i = 0; i < loops; i++) {
        if(leftOrRight == 'left') {
            sourceStr = fillStr + sourceStr;

        } else if(leftOrRight == 'right') {
            sourceStr += fillStr;
        }
    }
    return sourceStr;
}

exports.phoneNoToAbbr = function(phoneNo) {
    if(!phoneNo) {
        return phoneNo;
    }
    var content = phoneNo.toString();
    var prefix = '';
    var suffix = '';
    if(content.length <= 3) {
        return content;
    } else {
        prefix = content.substr(0, 3);
        content = content.substr(3);
    }
    if(content.length > 4) {
        suffix = content.substr(4);
        content = content.substr(0, 4);
    }
    return prefix + content.replace(/./g, '*') + suffix;
}

exports.phoneNoEncrypt = function(str, key) {
    if (str == "") {
        return "";
    }
    if(!key) {
        key = '1234567890000000';
    }
    var v = exports._str2long(str, true);
    var k = exports._str2long(key, false);
    if (k.length < 4) {
        k.length = 4;
    }
    var n = v.length - 1;

    var z = v[n], y = v[0], delta = 0x9E3779B9;
    var mx, e, p, q = Math.floor(6 + 52 / (n + 1)), sum = 0;
    while (0 < q--) {
        sum = sum + delta & 0xffffffff;
        e = sum >>> 2 & 3;
        for (p = 0; p < n; p++) {
            y = v[p + 1];
            mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
            z = v[p] = v[p] + mx & 0xffffffff;
        }
        y = v[0];
        mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
        z = v[n] = v[n] + mx & 0xffffffff;
    }
    return exports._long2str(v, false);
}

exports.phoneNoDecrypt = function(str, key) {
    if (str == "") {
        return "";
    }
    if(!key) {
        key = '1234567890';
    }
    var v = exports._str2long(str, false);
    var k = exports._str2long(key, false);
    if (k.length < 4) {
        k.length = 4;
    }
    var n = v.length - 1;

    var z = v[n - 1], y = v[0], delta = 0x9E3779B9;
    var mx, e, p, q = Math.floor(6 + 52 / (n + 1)), sum = q * delta & 0xffffffff;
    while (sum != 0) {
        e = sum >>> 2 & 3;
        for (p = n; p > 0; p--) {
            z = v[p - 1];
            mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
            y = v[p] = v[p] - mx & 0xffffffff;
        }
        z = v[n];
        mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
        y = v[0] = v[0] - mx & 0xffffffff;
        sum = sum - delta & 0xffffffff;
    }
    return exports._long2str(v, true);
}

exports.getCurrentDate = function () {
    return new Date();
}

exports._long2str = function(v, w) {
    var vl = v.length;
    var n = (vl - 1) << 2;
    if (w) {
        var m = v[vl - 1];
        if ((m < n - 3) || (m > n)) {
            return null;
        }
        n = m;
    }
    for (var i = 0; i < vl; i++) {
        v[i] = String.fromCharCode(v[i] & 0xff,
            v[i] >>> 8 & 0xff,
            v[i] >>> 16 & 0xff,
            v[i] >>> 24 & 0xff);
    }
    if (w) {
        return v.join('').substring(0, n);
    }
    else {
        return v.join('');
    }
};

exports._str2long = function(s, w) {
    var len = s.length;
    var v = [];
    for (var i = 0; i < len; i += 4) {
        v[i >> 2] = s.charCodeAt(i)
            | s.charCodeAt(i + 1) << 8
            | s.charCodeAt(i + 2) << 16
            | s.charCodeAt(i + 3) << 24;
    }
    if (w) {
        v[v.length] = len;
    }
    return v;
};

exports.generateCode = function() {
    var code = "";
    var codeLength = 5;
    var selectChar = new Array(0,1,2,3,4,5,6,7,8,9);
    for(var i=0; i<codeLength; i++) {
        var charIndex = Math.floor(Math.random()*10);
        code += selectChar[charIndex];
    }
    return code
};

exports.generateSession = function() {
    var code = "";
    var codeLength = 40;
    var selectChar = new Array(0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z', '_', '-')
    for(var i=0; i<codeLength; i++) {
        var charIndex = Math.floor(Math.random()*38);
        code += selectChar[charIndex];
    }
    return code
};
