const express = require('express');
const router = express.Router();
const path = require('path');
const util = require('util');
const users = require('../models/users.js');
const inventory = require('../models/inventory.js');
const kijii = require('../models/kijiji.js');
const utility = require('../models/utility.js');
const resolve = require('await-to-js');
const log = require('../models/logger');
const request = require('request-promise');
const randomatic = require('randomatic');
const decoder = require('../models/decoder.js');

const alphanumRegex = /^[a-zA-Z0-9\s.\-_+/\r\n]+$/;
const vinNumberRegex = /^(([a-h,A-H,j-n,J-N,p-z,P-Z,0-9]{9})([a-h,A-H,j-n,J-N,p,P,r-t,R-T,v-z,V-Z,0-9])([a-h,A-H,j-n,J-N,p-z,P-Z,0-9])(\d{6}))$/;
const vinNumberRegex2 = /^([A-Z\d]{3})[A-Z]{2}\d{2}([A-Z\d]{1})([X\d]{1})([A-Z\d]{3})\d{5}$/;
const vinNumberRegex3 = /^[^iIoOqQ'-]{10,17}$/;
/*START ROUTES*/


router.get('/', utility.verifyToken, utility.checkLock, async(req, res)=>{
    return res.status(200).render('pricechecker', {
        user: req.user
    });
});

router.post('/getprice', utility.verifyToken, utility.checkLock, async(req, res)=>{
    log.info('\nEntering route/Attempting to check a car price\n')
    if(!req.user){
        return res.status(200).redirect('/');
    }
    if(!req.body.make || !req.body.year || !req.body.model){
        return res.status(200).send({
            error: 'Incomplete data provided. Try again with complete data'
        });
    }

    //Safe to proceed
    /*TODO
    1. pass data to kijiji.js and return response

    */ 
    [err, price] = await resolve.to(kijii.run(req.body));

    if(err || !price){
        return res.status(200).send({
            error: 'Server cannot accept this request at this time. Try again or contact support.'
        });
    }

    if(price <=0){
        return res.status(200).send({
            error: 'Sorry! There are no ads matching your current search on kijiji.ca. Please try a different keyword.'
        }); 
    }

    return res.status(200).send({
        price: price
    });
});

router.post('/vin', utility.verifyToken, utility.checkLock, decoder.vin, async(req, res)=>{
    if(!req.user){
        return res.status(200).redirect('/');
    }
    //send data to kijij and return response
    if(!req.vehicleData){
        return res.status(200).send({
            error: 'An unexpected server error occured. Try again or contact support'
        });
    }
    
    [err, price] = await resolve.to(kijii.run(req.vehicleData));

    if(err || !price){
        return res.status(200).send({
            error: 'Server cannot accept this request at this time. Try again or contact support.'
        });
    }

    if(price <=0){
        return res.status(200).send({
            error: 'Sorry! There are no ads matching your current search on kijiji.ca. Please try a different keyword.'
        }); 
    }

    return res.status(200).send({
        price: price,
        data: req.vehicleData
    });
});

module.exports = router;