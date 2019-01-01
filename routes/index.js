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

router.get('/', utility.verifyLogin, async (req, res) => {
    if(req.user){
        return res.status(200).redirect('/dashboard');
    }
    return res.status(200).render('login', {user: req.user});
});

router.get('/login', utility.verifyToken, async (req, res) => {
    return res.status(200).redirect('/');
});

router.get('/join', utility.verifyToken, async (req, res) => {
    return res.status(200).redirect('/#signup');
});

router.post('/join', async (req, res) => {
    if(req.body){
        delete req.body.re_pass;
        let err, user;

        [err, user] = await resolve.to(users.add(req.body));

        if(err){
            return res.status(200).send({
                error: err.message
            });
        }else{
            let bearerToken = utility.getToken(user);
            res.cookie('session', bearerToken, {
                httpOnly: true,
                maxAge: 86400000,
                secure: false
            });

            return res.status(200).send({
                success: true
            });
        }
    }else{
        return res.status(400).send({
            error: 'The server did not receive any data. Please try again!'
        });
    }
});

router.post('/login', async (req, res) => {
    //Authenticate User
    if(!req.body.login_userName && !req.body.login_pass){
        return res.status(400).send({
            error: 'Some information is missing in your login request'
        });
    }
    [err, user] = await resolve.to(users.authenticate({
        userName: req.body.login_userName,
        pass: req.body.login_pass
    }));

    if(err){
        return res.status(200).send({
            error: err.message
        });
    }else{
        let bearerToken = utility.getToken(user);
        res.cookie('session', bearerToken, {
            httpOnly: true,
            maxAge: 86400000,
            secure: false
        });

        return res.status(200).send({
            success: true
        });
    }
});

router.get('/dashboard', utility.verifyToken, async (req, res) => {
    if(!req.user){
        return res.status(200).redirect('/');
    }

    let serviceRecords = await service.getAll();
    let vehiclesInBay = 0;

    for(var i=0; i<serviceRecords.length; i++){
        if(serviceRecords[i].inBay){
            vehiclesInBay +=1;
        }
    }
    return res.status(200).render('dashboard', {
        user: req.user,
        totalUsers: await users.getLength() || 0,
        totalVehicles: await inventory.getLength(0) || 0,
        totalSoldVehicles: await inventory.getLength(1) || 0,
        totalServiceRecords: await service.getLength() || 0,
        totalVehiclesInBay: vehiclesInBay,
        records: serviceRecords
    });
});

router.get('/logout', utility.verifyToken, async (req, res) => {
    if(!req.user){
        return res.status(200).redirect('/');
    }

    res.clearCookie('session');
    return res.status(200).redirect('/');
});
/*END ROUTES*/

router.get('/view', utility.verifyToken, async (req, res)=>{
    return res.status(200).render('../archive/raw-views/widgets', {
        user: req.user
    });
});

module.exports = router;