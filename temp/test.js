/**
 * Created by tanyuan on 6/29/15.
 */

var fs = require('fs');
var gm = require('gm');
var nodemailer = require('nodemailer');
var redis = require('redis');
var appCfg = require('../app.cfg.js');
var redisClient = redis.createClient(appCfg.redis.port, appCfg.redis.host, {});


exports.deleteReidsCache = function(req, res) {
    redisClient.keys("ps:user:*", function(err, keys) {
        _.each(keys, function(value) {
            redisClient.get(value, function(err, user) {
                if(JSON.parse(user)._id == 1000018 || JSON.parse(user)._id == 1000001) {
                    console.log(user+'\n');
                    console.log(value+'\n');
                    redisClient.del(value)
                }
            })
        });
    })
};

//exports.init = function(req, res) {
//    console.log('test image.');
//    var filepath = '/var/www/crm/moments/picture/js.jpg';
//    gm(filepath).resize(30, 30)
//        .noProfile()
//        .write('/var/www/crm/moments/thumbnail/js.jpg', function (err) {
//            if (!err) console.log('done');
//        });
//
//};
//console.log('==================================================');
//var transporter = nodemailer.createTransport({
//    host: 'smtp.qq.com',
//    secure: true,
//    port: 465,
//    auth: {
//        user: '1067598718@qq.com',
//        pass: '1067598718qaz'
//    }
//});
//
//var mailOptions = {
//    from: '孙师傅-就是个逗比<1067598718@qq.com>', // sender address
//    to: 'sunxiyong@prosnav.com', // list of receivers
//    subject: 'Hello', // Subject line
//    text: 'Hello world', // plaintext body
//    html: '<b>Hello world, 孙师傅!</b>' // html body
//};
//
//// send mail with defined transport object
//transporter.sendMail(mailOptions, function(error, info){
//    if(error){
//        return console.log(error);
//    }
//    console.log('Message sent: ' + info.response);
//
//});
//
//
