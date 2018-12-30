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
const moment = require('moment');

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const alphanumRegex = /^[a-zA-Z0-9\s.\-_+/\r\n]+$/;
const vinNumberRegex = /^(([a-h,A-H,j-n,J-N,p-z,P-Z,0-9]{9})([a-h,A-H,j-n,J-N,p,P,r-t,R-T,v-z,V-Z,0-9])([a-h,A-H,j-n,J-N,p-z,P-Z,0-9])(\d{6}))$/;
const vinNumberRegex2 = /^([A-Z\d]{3})[A-Z]{2}\d{2}([A-Z\d]{1})([X\d]{1})([A-Z\d]{3})\d{5}$/;
const vinNumberRegex3 = /^[^iIoOqQ'-]{10,17}$/;
/*START ROUTES*/

router.get('/', utility.verifyToken, async (req, res) => {
    if(!req.user){
        return res.status(200).redirect('/');
    }

    let message = null;
    if(!req.query.stockNo){
        return res.status(200).redirect('/dashboard');
    }

    let stockNo = req.query.stockNo;

    [err, vehicle] = await resolve.to(inventory.fetch(stockNo, 0));

    if(err || !vehicle){
        [err, vehicle] = await resolve.to(inventory.fetch(stockNo, 1));
        if(err || !vehicle){
            log.error('Vehicle Fetch Error(route): ' + err);
            return res.status(200).redirect('/dashboard');
        }
    }

    if(req.query.newVehicle && req.query.newVehicle === 'true'){
        message = 'Vehicle added successfully.'
    }

    return res.status(200).render('vehicle', {
        user: req.user,
        vehicle: vehicle,
        message: message
    });
});

router.post('/testdrive', utility.verifyToken, vehicleExtractor, async (req, res)=>{
    if(!req.body.name){
        log.error('\nRequest body is incomplete');
        return res.status(200).send({
            error: 'SERVER ERROR: The request sent was incomplete'
        });
    }

    let data = req.body;
    let vehicle = req.vehicle;

    vehicle.dealership.onLot = false;
    let locationHistory = vehicle.dealership.locationHistory || [];
    let testDriveHistory = vehicle.dealership.testDriveHistory || [];

    let location = {
        addressCity: data.city,
        addressLine1: data.addressLine1,
        addressLine2: '',
        country: 'Canada',
        postalCode: '',
        state: 'MB'
    };

    let testDrive = {
        location: location,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        initiatedBy: req.user.firstName + ' ' + req.user.lastName,
        preferredContact: data.preferredContact == 'email' ? 'email':'phone'
    };

    testDriveHistory.push(testDrive);
    locationHistory.push(location);

    vehicle.dealership.locationHistory = locationHistory;
    vehicle.dealership.testDriveHistory = testDriveHistory;
    vehicle.dealership.lastModifiedBy = req.user.firstName + ' ' + req.user.lastName;

    let lastModifiedOn = {
        day: moment().date(),
        month: months[moment().month()],
        year: new Date().getFullYear(),
        exactTime: moment().format('MMMM Do YYYY, h:mm:ss a')
    };

    vehicle.dealership.lastModifiedOn = lastModifiedOn;


    log.info('\nAdding update to DB...\n');
    [DBerr, DBres] = await resolve.to(inventory.add(vehicle));

    if(DBerr || !DBres){
        log.error('Test Drive DB Error: ' + err);
        return res.status(200).send({
            error: 'SERVER ERROR: Try again later or contact support'
        });
    }

    log.info('\nSuccess. Exit(0)');
    res.status(200).send({
        success: true
    });

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'Started a test drive with vehicle (#' + req.stockNo + ')'));
    return;
});

router.post('/checkin', utility.verifyToken, vehicleExtractor, async (req, res)=>{
    let currentLocation = {
        addressLine1: '918 McPhillips Street',
        addressLine2: '',
        addressCity: 'Winnipeg',
        postalCode: 'R2X 2J8',
        country: 'Canada',
        state: 'MB'
    };
    let onLot = true;

    let vehicle = req.vehicle;

    let locationHistory = vehicle.dealership.locationHistory || [];

    locationHistory.push(currentLocation);
    vehicle.dealership.locationHistory = locationHistory;

    vehicle.dealership.onLot = onLot;

    let lastModifiedBy = req.user.firstName + ' ' + req.user.lastName;
    let lastModifiedOn = {
        day: moment().date(),
        month: months[moment().month()],
        year: new Date().getFullYear(),
        exactTime: moment().format('MMMM Do YYYY, h:mm:ss a')
    };

    vehicle.dealership.lastModifiedBy = lastModifiedBy;
    vehicle.dealership.lastModifiedOn = lastModifiedOn;

    //Update DB
    log.info('\nAdding update to DB...\n');
    [DBerr, DBres] = await resolve.to(inventory.add(vehicle));

    if(DBerr || !DBres){
        log.error('Test Drive DB Error: ' + err);
        return res.status(200).send({
            error: 'SERVER ERROR: Try again later or contact support'
        });
    }

    //Send Response
    log.info('\nSuccess. Exit(0)');
    res.status(200).send({
        success: true
    });

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'checked in a vehicle (#' + req.stockNo + ')'));
    return;
});

router.post('/sell', utility.verifyToken, vehicleExtractor, async (req, res)=>{
    let vehicle = req.vehicle;
    let lastModifiedBy = req.user.firstName + ' ' + req.user.lastName;
    let lastModifiedOn = {
        day: moment().date(),
        month: months[moment().month()],
        year: new Date().getFullYear(),
        exactTime: moment().format('MMMM Do YYYY, h:mm:ss a')
    };

    vehicle.dealership.lastModifiedBy = lastModifiedBy;
    vehicle.dealership.lastModifiedOn = lastModifiedOn;
    vehicle.dealership.sold = true;
    vehicle.dealership.soldTime = lastModifiedOn;

    //Update DB
    log.info('\nAdding update to DB...\n');
    [DBerr, DBres] = await resolve.to(inventory.addSold(vehicle));

    if(DBerr || !DBres){
        log.error('DB Error: ' + err);
        return res.status(200).send({
            error: 'SERVER ERROR: Try again later or contact support'
        });
    }

    [delErr, delRes] = await resolve.to(inventory.delete(vehicle.stockNo, 0));

    if(delErr || !delRes){
        log.error('DB Delete Error: ' + err);
        return res.status(200).send({
            error: 'SERVER ERROR: Try again later or contact support'
        });
    }
    //Send Response
    log.info('\nSuccess. Exit(0)');
    res.status(200).send({
        success: true
    });

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'Marked a vehicle (#' + req.stockNo + ') as sold.'));
    return;
});

router.post('/delete', utility.verifyToken, vehicleExtractor, async (req, res)=>{
    let vehicle = req.vehicle;
    let mode = 0;
    if(vehicle.dealership.sold === true){
        mode = 1;
    }

    [delErr, delRes] = await resolve.to(inventory.delete(vehicle.stockNo, mode));

    if(delErr || !delRes){
        log.error('DB Delete Error: ' + err);
        return res.status(200).send({
            error: 'SERVER ERROR: Try again later or contact support'
        });
    }
    //Send Response
    log.info('\nSuccess. Exit(0)');
    res.status(200).send({
        success: true
    });

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'Deleted a vehicle (#' + req.stockNo + ')'));
    return;
});

router.get('/edit', utility.verifyToken, vehicleExtractor, async (req,res)=>{
    let vehicle = req.vehicle;

    res.status(200).render('edit-inventory', {
        user: req.user,
        vehicle: vehicle,
        locLength: vehicle.dealership.locationHistory.length
    });

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'edited a vehicle (#' + req.stockNo + ')'));
    return;
});



//Utility Middleware for test drive and checkins
async function vehicleExtractor(req,res, next){
    log.info('\nEntering route POST "/vehicle/testdrive?/checkin?sell"...\n');
    if(!req.user){
        log.error('\nCannot verify user');
        return res.status(200).send({
            error: 'SERVER ERROR: Cannot verify user that initiated this request'
        });
    }

    if(!req.query.stockNo){
        log.error('No stock number provided');
        return res.status(200).send({
            error: 'SERVER ERROR: Unable to identify the vehicle selected. Reload the window and try again'
        });
    }

    let stockNo = req.query.stockNo;

    log.info('\nstock number found...\n');
    [err, vehicle] = await resolve.to(inventory.fetch(stockNo, 0));

    if(err || !vehicle){
        [err, vehicle] = await resolve.to(inventory.fetch(stockNo, 1));
        if(err || !vehicle){
            log.error('Vehicle Fetch Error(/vehicle/testdrive): ' + err);
            return res.status(200).send({
                error: 'SERVER ERROR: Try again later or contact support'
            });
        }
    }

    log.info('\nvehicle fetched... sending to route logic...\n');

    req.vehicle = vehicle;
    req.stockNo = req.query.stockNo;
    return next();
}

module.exports = router;