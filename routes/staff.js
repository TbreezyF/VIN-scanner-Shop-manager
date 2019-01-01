const express = require('express');
const router = express.Router();
const path = require('path');
const util = require('util');
const users = require('../models/users.js');
const inventory = require('../models/inventory.js');
const service = require('../models/service.js');
const utility = require('../models/utility.js');
const resolve = require('await-to-js');
const log = require('../models/logger');
const request = require('request-promise');
const randomatic = require('randomatic');
const moment = require('moment');

/*START ROUTES*/

router.get('/', utility.verifyToken, utility.checkLock, async (req, res) => {
    if(!req.user){
        return res.status(200).redirect('/');
    }

    [err, allUsers] = await resolve.to(users.getAll());

    if(err || !allUsers){
        return res.status(200).render('staff', {
            message: '500 Internal Server Error. Try again or contact support if problem persists',
            user: req.user
        }); 
    }

    return res.status(200).render('staff', {
        user: req.user,
        users: allUsers,
        message: null
    });
});

router.post('/search', utility.verifyToken, utility.checkLock, async (req, res)=>{
    if(!req.user){
        return res.status(200).send({
            message: 'Cannot verify your identity'
        });
    }

    if(!req.body.searchTerm || req.body.searchTerm == ''){
        return res.status(200).send({
            error: 'No search term provided'
        });
    }

    let userName = req.body.searchTerm;

    [err, user] = await resolve.to(users.fetch(userName));

    if(err || !user){
        return res.status(200).send({
            error: 'Staff not found'
        }); 
    }

    return res.status(200).send({
        success: true
    }); 
});

module.exports = router;