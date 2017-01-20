/**
 * Created by tanyuan on 3/31/15.
 */

var customerDao = require('../db/crm/customerDao');

var async = require('async');

var _ = require('underscore');

var userDao = require('../db/upm/userDao');

var dictionary = require('../lib/dictionary');

var customerImplBatchDao = require('../db/crm/customerImplBatchDao');

var accountList = ['8404'];

var belongAccount = 'nichole';


exports.init = function(req, res) {
    var steps = {};
    var customerImpBatchId = [];

    steps.allUsers = function(next) {
        userDao.find({status: dictionary.userStatus.ok}, next);
    };

    steps.users = function(next) {
        userDao.find({username: {$in: accountList}, status: dictionary.userStatus.ok}, next);
    };

    steps.belongUser = function(next) {
        userDao.findOne({username: belongAccount, status: dictionary.userStatus.ok}, next);
    };

    steps.customers = ['users', 'belongUser', 'allUsers', function(next, data){
        var allUsers = data.allUsers;
        var users = data.users;
        var belongUser = data.belongUser;
        if(!_.isEmpty(belongUser)) {
            async.each(users, function(user, cb) {
                var step = {};

                step.customerUpPotential = function(next) {
                    customerDao.find({$or: [{belongUser: user._id}, {manager: user._id}], status : {$in : ['potential', 'bc20', 'bc40', 'bc60','bc80','deal','vip','diamondVip', 'crownedVip']}}, next);
                };

                step.customerDownPotential = function(next) {
                    customerDao.find({$or: [{belongUser: user._id}, {manager: user._id}], status : {$nin : ['potential', 'bc20', 'bc40', 'bc60','bc80','deal','vip','diamondVip', 'crownedVip']}}, next);
                };

                step.handUpPotential = ['customerUpPotential', function(next, data) {
                    var customerUpPotential = data.customerUpPotential;

                    var proccess = {};
                    var condition = {};
                    _.each(customerUpPotential, function(value) {
                        proccess['customer'+value._id] = function(next) {
                            if(value.belongUser == user._id) {
                                condition.belongUser = belongUser._id;
                            }
                            if(value.manager == user._id) {
                                condition.manager = belongUser._id;
                            }
                            customerDao.modifyById(value._id, condition, next);
                        }
                    });
                    async.parallel(proccess, next);
                }];

                step.handDownPotential = ['customerDownPotential', function(next, data) {
                    var customerDownPotential = data.customerDownPotential;
                    var proccess = {};
                    var condition = {};

                    _.each(customerDownPotential, function(value) {
                        proccess['customer'+value._id] = function(next) {
                            if(value.belongUser == user._id) {
                                if(_.isEmpty(_.findWhere(allUsers, value.manager)) || value.manager == value.belongUser) {
                                    condition.free = true;
                                    customerImpBatchId.push(value.ImpBatchId);
                                }else {
                                    condition.belongUser = '';
                                }
                            }

                            if(value.manager == user._id) {
                                if(_.isEmpty(_.findWhere(allUsers, value.belongUser)) || value.manager == value.belongUser) {
                                    condition.free = true;
                                    customerImpBatchId.push(value.ImpBatchId);
                                }else {
                                    condition.manager = '';
                                }
                            }
                            customerDao.modifyById(value._id, condition, next);
                        }
                    });
                    async.parallel(proccess, next);
                }];
                async.auto(step, cb);
            }, function(err) {
                if(err) {
                    next(err);
                }else {
                    next(null, 'success');
                }
            });
        }else {
            next(null, 'belongUserIsEmpty')
        }

    }];

    steps.refreshBatchCount = ['customers', function(next, data) {
        if(!_.isEmpty(customerImpBatchId)) {
            customerImplBatchDao.refreshBatchCount(customerImpBatchId, next);
        }else {
            next(null, false);
        }
    }];

    async.auto(steps, function(err, docs) {
        if(err) {
            res.json(500, {err: err.stack});
        }else {
            if(docs.customers == 'belongUserIsEmpty') {
                res.json({error: 'belongUserIsEmpty'});
            }else {
                res.json({success: 'success'});
            }
        }
    })
};


