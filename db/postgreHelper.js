/**
 * Created by tanyuan on 10/13/15.
 */

var pg = require('pg');
var appCfg = require('../app.cfg');

/**
 *
 * @param queryStr 查询的sql语句
 * @param values   传入的参数，为数组的形式
 */
var dbQuery = function(queryStr, values, next) {
    pg.connect(appCfg.postgre.url, function(err, client, done) {
        if(err) {
            console.error('error fetching client from pool', err);
            next(err);
        }
        client.query(queryStr, values, function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                console.error('error running query', err);
                next(err);
            }
            next(null, result);
        });
    });
};


var websiteQuery = function(queryStr, values, next) {
    pg.connect(appCfg.website_postgres.url, function(err, client, done) {
        if(err) {
            console.error('error fetching client from pool', err);
            next(err);
        }
        client.query(queryStr, values, function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                console.error('error running query', err);
                next(err);
            }
            next(null, result);
        });
    });
};

console.log('info: postgrep start');

exports.dbQuery = dbQuery;
exports.websiteQuery = websiteQuery;


