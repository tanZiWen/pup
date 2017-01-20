/*
 * GET home page.
 */

var _ = require('underscore'),
    _s = require('underscore.string');

exports.index = function (req, res) {

    res.render('crm/index', { title: 'CRM'});
};