/**
 * Created by tanyuan on 11/17/15.
 */
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');


var transporter = nodemailer.createTransport(smtpTransport({
    host: 'smtp.qq.com',
    secure: true,
    port: 465,
    auth: {
        user: '3140888094@qq.com',
        pass: 'esqhdcpgawqudcec'
    }
}));


exports.sendMail = function(con, cb) {
    var mailOptions = {};
    mailOptions.from = '査骞亮<3140888094@qq.com>';
    mailOptions.to = con.email;
    if(con.type == 'add') {
        mailOptions.subject = '设置密码';
        mailOptions.text = '设置密码';
        mailOptions.html = '<p style="font-size:16px"><b>Dear '+con.realName+':</b></p>' +
                           '<p style="font-size:14px"><b>您的CRM系统登录用户名为:'+con.username+'</b></p>' +
                           '<p style="font-size:14px"><b>请复制:  http://192.168.8.205:8089/setPwd?est='+con.session+'  在浏览器中，设置您的登录密码. 该链接将在1天后失效</b></p>';
    }else {
        mailOptions.subject = '重置密码';
        mailOptions.text = '重置密码';
        mailOptions.html = '<p style="font-size:16px"><b>Dear '+con.realName+':</b></p>' +
                            '<p style="font-size:14px"><b>验证码为: <span style="color: #ff0000; font-size: 20px">'+con.verifyCode+'</span>，验证码将在60秒后将自动失效.</b></p>';
    }
    mailOptions.html += '<br/><br/><br/><br/><br/><br/><br/><br/><br/>'+
                        '<p>查骞亮  Montag</p>'+
                        '<p>IT主管  IT Department </p>'+
                        '<p>帆茂投资管理有限公司  PROSNAV CAPITAL CO.,LTD. </p>'+
                        '<p>公司地址：上海市闸北区海宁路939号 长泰企业天地广场 裙楼 5层 </p>'+
                        '<p>办公电话：86-21-51721811-258（分机） </p>'+
                        '<p>移动电话：86-18602152916, 86-15801883251 </p>';

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(err, response) {
        if(err) {
            console.log(err)
            cb(err)
        }else {
            cb(null, response)
        }
        transporter.close();
    });
};





