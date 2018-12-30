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
const decoder = require('../models/decoder.js');

const alphanumRegex = /^[a-zA-Z0-9\s.\-_+/\r\n]+$/;
const vinNumberRegex = /^(([a-h,A-H,j-n,J-N,p-z,P-Z,0-9]{9})([a-h,A-H,j-n,J-N,p,P,r-t,R-T,v-z,V-Z,0-9])([a-h,A-H,j-n,J-N,p-z,P-Z,0-9])(\d{6}))$/;
const vinNumberRegex2 = /^([A-Z\d]{3})[A-Z]{2}\d{2}([A-Z\d]{1})([X\d]{1})([A-Z\d]{3})\d{5}$/;
const vinNumberRegex3 = /^[^iIoOqQ'-]{10,17}$/;


/*START ROUTES*/
router.get('/', utility.verifyToken, async(req, res)=>{
    if(!req.user){
        return res.status(200).redirect('/');
    }

    [err, vehicles] = await resolve.to(inventory.getAll());

    if(err || !vehicles){
        return res.status(200).render('inventory', {
            message: '500 Internal Server Error. Try again or contact support if problem persists',
            user: req.user
        }); 
    }

    return res.status(200).render('inventory', {
        user: req.user,
        vehicles: vehicles,
        message: null
    });
});

router.get('/new', utility.verifyToken, async(req, res)=>{
    return res.status(200).render('new-inventory', {
        user: req.user
    });
});

router.post('/vin/decoder', utility.verifyToken, decoder.vin,  async (req, res) => {
  return res.status(200).send({
        data: req.vehicleData
    });
});

router.post('/new/add', utility.verifyToken, handleInventory, async (req, res)=>{
    res.status(200).json({
        stockNo: req.stockNo
    });  

    [err, updated] = await resolve.to(users.recentActivity(req.user, 'Added a new vehicle (#' + req.stockNo + ')'));

    return;
});

router.post('/edit', utility.verifyToken, handleInventory, async (req, res)=>{
    return res.status(200).json({
        stockNo: req.stockNo
    });  
});
/*END ROUTES*/

async function handleInventory(req, res, next){
    if(!req.body){
        return res.end();
    }
    let data = req.body;
    [err, isValid] = await resolve.to(utility.verifyVehicleSubmit(data));

    log.info('\nEntering route "/new/add?/edit"...\n');
    log.info('\n\nREQUEST PATH: ' + req.path + '\n');
    if(!isValid){
        log.error('Data provided to the Server by ' + req.userName + ' is not valid.\n');
        return res.status(200).send({
            error: 'Server cannot accept invalid input. Please contact support.'
        });
    }
    log.info(req.user.userName + ' is attempting to upload or edit a vehicle...\n');
    if(req.path == '/edit' && (!req.query.stockNo || !Number(req.query.stockNo))){
        return res.status(200).send({
            error: 'Server cannot determine the vehicle being edited. No stock number provided.'
        });
    }

    let stockNo;
    if(req.path == '/edit'){
        log.info('Incoming request is for /edit...\n');
        stockNo = Number(req.query.stockNo);
        req.stockNo = stockNo;
    }else{
        log.info('Generating stock number...\n');
        [stockNoError, stockNo] = await resolve.to(inventory.genStockNo());

        if(stockNoError || !stockNo){
            log.error('Unable to generate a valid stock number.\n');
            return res.status(200).send({
                error: 'Server cannot accept new entries at this time. Please contact support.'
            });
        }

        req.stockNo = stockNo;
    }
    
    log.info('Parsing Vehicle Features...\n');
    //parse features
    [featError, features] = await resolve.to(inventory.parseFeatures(data));

    if(featError || !features){
        log.error('Error parsing features.\n');
        return res.status(200).send({
            error: 'Server cannot accept new entries at this time. Please contact support.'
        });
    }

    let vehicleFeatures = features || [];


    //parse features
    [getFeatError, getFeatures] = await resolve.to(inventory.getFeaturesForEdit(data));

    if(getFeatError || !getFeatures){
        log.error('Error getting features.\n');
        return res.status(200).send({
            error: 'Server cannot accept new entries at this time. Please contact support.'
        });
    }

    let gotFeatures = getFeatures || [];

    if(data['vehicle-location-input-yes'] == 'on'){
        data.onLot = true;
    }else{
        data.onLot = false;
    }
    log.info('Arranging vehicle data...\n');
    //Arrange data in new Object
   [dataError, arrangedData] = await resolve.to(inventory.arrangeData(data, vehicleFeatures, gotFeatures, stockNo, req.user));
    
    if(dataError || !arrangedData){
        log.error('Data arrangement failed.\n');
        return res.status(200).send({
            error: 'Server cannot accept new entries at this time. Please contact support.'
        });
    }

    //Put Vehicle Photos in S3
    log.info('Uploading photos to S3 if any...\n');
    let photos = [];
    if(req.path == '/edit' && arrangedData.photos.length == 0){
        //get photos from DB
        [editError, editVehicle] = await resolve.to(inventory.fetch(stockNo, 0));

        if(editError || !editVehicle){
            return res.status(200).send({
                error: 'Server cannot perform edits on this vehicle at this time. Please contact support.'
            }); 
        }

        photos = editVehicle.photos;
    }else{
        if(arrangedData.photos.length > 0){
            [picUploadError, photos] = await resolve.to(inventory.savePhotos(arrangedData.photos, stockNo));
            if(picUploadError || !photos){
                log.error('A problem occured when uploading to S3.\n');
                return res.status(200).send({
                    error: 'Server cannot accept new entries at this time. Please contact support.'
                });
            }
            log.info('Uploaded...\n');
           }
    }

    let trimData = {};
    if(req.path != '/edit'){
        log.info('Connecting to Car Query API...\n');
        //Get More Data on Vehicle if possible
        let carQueryURL = 'https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&';
    
        //Get trims to obtain model ID
        const {model, year, trim, numberOfDoors} = arrangedData;
    
        let options = {
            uri: carQueryURL + 'year=' + year + '&model=' + model + '&doors=' + numberOfDoors,
            headers: {
                'User-Agent': 'AutoTrust/SproftMedia Server 1',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            json: true // Automatically parses the JSON string in the response
        };
    
        [resError, response] = await resolve.to(request(options));
    
        if(resError|| !response){
            log.error('A problem occured with Car Query API.\n');
            return res.status(200).send({
                error: 'Server cannot accept new entries at this time. Please contact support.'
            });
        }
    
        trimData = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
    
        try{
            log.info('Response received. Parsing response...\n');
            trimData = JSON.parse(trimData);
        }catch(e){
            log.error('Error while parsing Car Query API response. \n');
            return res.status(200).send({
                error: 'Server cannot accept new entries at this time. Please contact support.'
            });
        }
    
        //Log response
        log.info('Data parsed...\n');
    }

    log.info('Arranging vehicle data for DB...\n');
    //Arrange Data for DB
    if(req.path = '/edit'){
        [dbDataError, dbData] = await resolve.to(inventory.arrangeForDB(trimData || {}, arrangedData || {}, photos || [], 1));
    }else{
        [dbDataError, dbData] = await resolve.to(inventory.arrangeForDB(trimData || {}, arrangedData || {}, photos || [], 0));
    }

    if(dbDataError || !dbData){
        log.error('A problem occured while arranging data for DB addition.\n');
        console.log('\n\nDB ERROR: ' + dbDataError + '\n\n');
        return res.status(200).send({
            error: 'Server cannot accept this request. Please contact support.'
        });
    }

    //Save data in DB
    log.info('Saving vehicle to DB...\n');
    [saveError, vehicle] = await resolve.to(inventory.add(dbData));

    if(saveError|| !vehicle){
        log.error('DB Error. Could not save vehicle in DB. Everything else works.\n');
        return res.status(200).send({
            error: 'Server cannot accept new entries at this time. Please contact support.'
        });
    }

    log.info('DONE: Success!\n');

    return next();
}

module.exports = router;