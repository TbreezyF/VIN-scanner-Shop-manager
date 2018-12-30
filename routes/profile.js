const express = require('express');
const router = express.Router();
const path = require('path');
const util = require('util');
const users = require('../models/users.js');
const inventory = require('../models/inventory.js');
const utility = require('../models/utility.js');
const resolve = require('await-to-js');
const log = require('../models/logger');
const request = require('request-promise');
const randomatic = require('randomatic');

const alphanumRegex = /^[a-zA-Z0-9\s.\-_+/\r\n]+$/;
const vinNumberRegex = /^(([a-h,A-H,j-n,J-N,p-z,P-Z,0-9]{9})([a-h,A-H,j-n,J-N,p,P,r-t,R-T,v-z,V-Z,0-9])([a-h,A-H,j-n,J-N,p-z,P-Z,0-9])(\d{6}))$/;
const vinNumberRegex2 = /^([A-Z\d]{3})[A-Z]{2}\d{2}([A-Z\d]{1})([X\d]{1})([A-Z\d]{3})\d{5}$/;
const vinNumberRegex3 = /^[^iIoOqQ'-]{10,17}$/;
/*START ROUTES*/


router.get('/', utility.verifyToken, async (req, res) => {
    if(!req.user){
        return res.status(200).redirect('/');
    }

    return res.status(200).render('profile', {
        user: req.user,
        profile: null
    });
});

router.get('/@/:userName', utility.verifyToken, async (req, res) => {
    if(!req.user){
        return res.status(200).redirect('/');
    }

    if(!req.params.userName){
        return res.status(200).redirect('/');
    }

    let userName = req.params.userName;

    [err, user] = await resolve.to(users.fetch(userName));

    if(err || !user){
        return res.status(200).redirect('/');  
    }

    return res.status(200).render('profile', {
        user: req.user,
        profile: user
    });
});

router.get('/edit', utility.verifyToken, async (req, res) => {
    if(!req.user){
        return res.status(200).redirect('/');
    }

    return res.status(200).render('edit-profile', {
        user: req.user
    });
});

router.post('/update', utility.verifyToken, async (req, res) => {
    
    if(!req.user){
        return res.status(200).redirect('/');
    }
    if(!req.body){
        return res.status(200).send({error: 'SERVER ERROR: Cannot find the information you provided.'});
    }

    let data = req.body;
    data.userName =  req.user.userName;

    //update profile
    [err, user] = await resolve.to(users.update(data, req.user));

    if(!user){
        return res.status(200).send({error: 'SERVER ERROR: Cannot update your profile at this time. Try again later'});
    }

    //update cookie

    [error, updatedUser] = await resolve.to(users.fetch(req.user.userName));

    if(!updatedUser){
        return res.status(200).send({error: 'SERVER ERROR: Cannot update your profile at this time. Try again later'});
    }
    let bearerToken = utility.getToken(updatedUser);
    res.cookie('session', bearerToken, {
        httpOnly: true,
        maxAge: 86400000,
        secure: false
    });

    return res.status(200).send({success: true});
});

module.exports = router;