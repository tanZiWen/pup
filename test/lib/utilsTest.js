/**
 * Created by wangnan on 14-4-17.
 */

var server = require('../../app').server;
var assert = require('assert');
var utils = require('../../lib/utils');
var rootDir = global.projectRoot;
var path = require('path');


assert.equal(utils.getProjectPath(), rootDir);
assert.equal(utils.getProjectPath('/'), rootDir);
assert.equal(utils.getProjectPath({}), rootDir);
assert.equal(utils.getProjectPath(function() {

}), rootDir);
assert.equal(utils.getProjectPath('foo'), rootDir + '/foo');
assert.equal(utils.getProjectPath('/foo'), rootDir + '/foo');
assert.equal(utils.getProjectPath('/foo.js'), rootDir + '/foo.js');
assert.equal(utils.getProjectPath('../foo.js'), path.normalize(rootDir + '/../foo.js'));
assert.equal(utils.getProjectPath('./foo.js'), rootDir + '/foo.js');

server.close(function() {
    console.log('utilsTest end.')
});