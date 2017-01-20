/**
 * Created by wangnan on 4/9/14.
 */

var _ = require('underscore');
var async = require('async');
var moment = require('moment');
moment.lang('zh-cn');
console.log(moment().calendar());

var begin = Date.now();
console.log('use : ' + (Date.now() - begin));

//var obj = { key : '1', key1 : '2' };
//
//for(var o in obj) {
//    console.log(obj[o]);
//}

//var dictionary = {
//    orgType : { branch : 'branch', department : 'department' }
//}
//
//function list() {
//    return _.filter(_.values(this), function(value) {
//        if(_.isString(value)) {
//            return true;
//        }
//    });
//}
//
//for(var key in dictionary) {
//    dictionary[key].list = list;
//}
//
//console.log(dictionary.orgType.list());

//async.auto({
//    get_data: function(callback){
//        console.log('in get_data');
//        // async code to get some data
////        try {
////            if(true) {
////                throw new Error('get_data error!!!');
////            }
////
////        } catch(err) {
////            console.log(err.stack);
////        }
//        callback(null, 'data', 'converted to array');
//    },
//    make_folder: function(callback){
//        console.log('in make_folder');
//        // async code to create a directory to store a file in
//        // this is run at the same time as getting the data
//        callback(new Error('make folder error.'), 'folder');
//    },
//    write_file: ['get_data', 'make_folder', function(callback, results){
//        console.log('in write_file', JSON.stringify(results));
//        // once there is some data and the directory exists,
//        // write the data to a file in the directory
//        callback(null, 'filename');
//    }],
//    email_link: ['write_file', function(callback, results){
//        console.log('in email_link', JSON.stringify(results));
//        // once the file is written let's email a link to it...
//        // results.write_file contains the filename returned by write_file.
//        callback(null, {'file':results.write_file, 'email':'user@example.com'});
//    }]
//}, function(err, results) {
//    console.log('err = ', err);
//    console.log('results = ', results);
//});

