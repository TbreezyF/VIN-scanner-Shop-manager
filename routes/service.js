const express = require('express');
const router = express.Router();
const path = require('path');
const util = require('util');
const users = require('../models/users.js');
const inventory = require('../models/inventory.js');
const service = require('../models/service.js');
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


router.get('/', utility.verifyToken, async(req, res)=>{
    return res.status(200).render('service-request', {
        user: req.user
    });
});

router.get('/records', utility.verifyToken, async(req,res)=>{
    if(!req.user){
        return res.status(200).send({
            error: 'Cannot verify your identity'
        });
    }

    [err, records] = await resolve.to(service.getAll());

    if(err || !records){
        return res.status(200).render('service-records', {
            message: '500 Internal Server Error. Try again or contact support if problem persists',
            user: req.user
        }); 
    }

    return res.status(200).render('service-records', {
        user: req.user,
        records: records,
        message: null
    });
});

router.post('/request', utility.verifyToken, async (req, res)=>{
    log.info('\nStarting a new service req...');
    let serviceRecord = {};
    if(!req.user){
        return res.status(200).send({
            error: 'Cannot verify your identity'
        });
    }

    if(!req.body.formOne || !req.body.formTwo || !req.body.serviceList || !req.body.timeEstimate){
        return res.status(200).send({
            error: 'Some information is missing in your request. Please provide all required information'
        });     
    }

    for(key in req.body.formOne){
        serviceRecord[key] = req.body.formOne[key];
    }
    for(key in req.body.formTwo){
        serviceRecord[key] = req.body.formTwo[key];
    }

    serviceRecord.serviceList = req.body.serviceList;
    serviceRecord.timeEstimate = req.body.timeEstimate;
    serviceRecord.technicians = [];
    serviceRecord.notes = '';
    serviceRecord.timeStarted = {};
    serviceRecord.timeEnded = {};
    serviceRecord.lastUpdated = null;
    serviceRecord.inBay = false;
    serviceRecord.delayed = false;
    serviceRecord.completed = false;

    [err,serviceId] = await resolve.to(service.genServiceNo());

    if(err || !serviceId){
        return res.status(200).send({
            error: 'An unexpected server error occured. Please try again or contact support.'
        }); 
    }

    serviceRecord.serviceId = serviceId;

    //Add to Db
    [DBerr, serviceAdded] = await resolve.to(service.add(serviceRecord));

    if(DBerr || !serviceAdded){
        return res.status(200).send({
            error: 'The origin server could not handle this request at this time. Try again later or contact support'
        }); 
    }

     res.status(200).send({
        success: true
    });

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'Started a service request (#' + req.query.serviceId + ')'));
});

router.post('/delete', utility.verifyToken, async(req,res)=>{
    if(!req.user){
        return res.status(200).send({
            error: 'Can not verify your Identity'
        }); 
    }

    if(req.user.role.toUpperCase() == 'STAFF'){
        return res.status(200).send({
            error: 'You are not authorized to perform this operation'
        }); 
    }

    if(!req.query.serviceId){
        return res.status(200).send({
            error: 'Server can not identity the service record being specified. Please provide a service Id'
        });
    }
    
    [delErr, delRes] = await resolve.to(service.delete(req.query.serviceId));

    if(delErr || !delRes){
        log.error('DB Delete Error: ' + delErr);
        return res.status(200).send({
            error: 'SERVER ERROR: Try again later or contact support'
        });
    }
    //Send Response
    log.info('\nSuccess. Exit(0)');
    res.status(200).send({
        success: true
    });

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'Deleted a service record (#' + req.query.serviceId + ')'));
    return;
});


router.post('/start', utility.verifyToken, async(req,res)=>{
    if(!req.user){
        return res.status(200).send({
            error: 'Can not verify your Identity'
        }); 
    }

    if(!req.query.serviceId){
        return res.status(200).send({
            error: 'Server can not identity the service record being specified. Please provide a service Id'
        });
    }

    if(req.user.role.toUpperCase() == 'ADMIN'){
        return res.status(200).send({
            error: 'Only Technicians can start a service request'
        }); 
    }
    let notes = req.body.notes;

    [startErr, startRes] = await resolve.to(service.start(req.query.serviceId, req.user, notes == '' ? undefined:notes));

    if(startErr || !startRes){
        log.error('DB Start Error: ' + startErr);
        return res.status(200).send({
            error: 'SERVER ERROR: Try again later or contact support'
        });
    }
    //Send Response
    log.info('\nSuccess. Exit(0)');
    res.status(200).send({
        success: true
    });

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'Started a service request (#' + req.query.serviceId + ')'));
    return;
});

router.post('/stop', utility.verifyToken, async(req,res)=>{
    if(!req.user){
        return res.status(200).send({
            error: 'Can not verify your Identity'
        }); 
    }

    if(!req.query.serviceId){
        return res.status(200).send({
            error: 'Server can not identity the service record being specified. Please provide a service Id'
        });
    }

    if(req.user.role.toUpperCase() == 'ADMIN'){
        return res.status(200).send({
            error: 'Only Technicians can start or update or stop a service request. Admins may delete the request entirely'
        }); 
    }
    
    [updateErr, updateRes] = await resolve.to(service.stop(req.query.serviceId, req.user));

    if(updateErr || !updateRes){
        log.error('DB Stop Error: ' + updateErr);
        return res.status(200).send({
            error: 'SERVER ERROR: Try again later or contact support'
        });
    }
    //Send Response
    log.info('\nSuccess. Exit(0)');
    res.status(200).send({
        success: true
    });

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'Marked a service request (#' + req.query.serviceId + ') as complete'));
    return;
});


module.exports = router;