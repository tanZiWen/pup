/**
 *
 * User: wuzixiu
 * Date: 2/11/14
 * Time: 4:39 PM
 */
var productAttachmentDao = require('../../db/crm/productAttachmentDao'),
    dictionary = require('../../lib/dictionary'),
    _ = require('underscore'),
    Pagination = require('../../lib/Pagination'),
    idg = require('../../db/idg'),
    G = require('../../lib/global'),
    fs = require('fs'),
    mime = require('mime'),
    urlencode = require('urlencode');
    eventReceiver = require('../../event/Receiver');

exports.dataList = function (req, res) {
    var user = req.session.user;
    if(req.query.page.condition == undefined) {
        req.query.page.condition = {privilege : {$elemMatch: {userPosition: user.position, read: true}}};
    } else {
        req.query.page.condition.privilege = {$elemMatch: {userPosition: user.position, read: true}};
    }
    var pagination = new Pagination(req);
    productAttachmentDao.model.findByPage(pagination, function(err, docs) {
        if(err) res.json(500, {err : err.stack});
        else {
            res.json({data : docs, pagination : pagination, user: user});
        }
    });
}

exports.latestList = function (req, res) {
    var user = req.session.user;
    var where = {privilege : {$elemMatch: {userPosition: user.position, read: true}}};
    productAttachmentDao.getLatestRecords(req.query.id, where, function(err, result) {
        if(err) res.json(500, {err : err.stack});
        else {
            res.json({data : result, user: user});
        }
    });
}

exports.create = function (req, res) {
    var params = req.body;
    if(!req.files.attach) {
        res.json({msg : {type : dictionary.resMsgType.error, body : '请选择文件'}});
    } else {
        var privilege = [];
        var rmPosition = {userPosition: dictionary.userPosition.rm};
        rmPosition.read = _.has(params, 'rmRead');
        rmPosition.download = _.has(params, 'rmDownlaod');

        var conPosition = {userPosition: dictionary.userPosition.consultant};
        conPosition.read = _.has(params, 'conRead');
        conPosition.download = _.has(params, 'conDownlaod');

        privilege.push(rmPosition);
        privilege.push(conPosition);

        params.privilege = privilege;

        var user = req.session.user;

        params.cuserid = user._id;
        params.cusername = user.username;
        params.crealName = user.realName;
        productAttachmentDao.create(req, params, function(err, result) {
            if(!err) {
                console.log(err);
                res.json({msg : {type : dictionary.resMsgType.succ, body : '添加成功'}});
            } else {
                console.log(err);
                res.json({msg : {type : dictionary.resMsgType.error, body : '添加失败'}});
            }
        });
    }
};

exports.download = function(req, res) {
    productAttachmentDao.findById(req.query.id, function(err, result) {

        if(!err) {
            //the filename does not support utf-8 encoding
            //res.download(G.ATTACHMENT_PATH + result._doc.code, result._doc.name);
        }

        var path = G.PROD_ATTACHMENT_PATH + result._doc.code + "." + result._doc.extension;
        res.writeHead(200,{
            'Content-Type':mime.lookup(path),
            'Content-Type': 'application/octet-stream;charset=utf8',
            'Coneten-Length': fs.statSync(path).size,
            'Content-Disposition': "attachment;filename*=UTF-8''" + urlencode(result._doc.name + "." + result._doc.extension)
        });

        var opt = {
            flags:'r'
        };
        var stream = fs.createReadStream(path, opt);
        stream.pipe(res);
        stream.on('end', function(){
            res.end();
        });

    });
}
