const jwt = require('jsonwebtoken');
const log = require('./logger');
const util = require('util');
const moment = require('moment');
const resolve = require('await-to-js');
const request = require('request-promise');
const utility = require('../models/utility.js');


const alphanumRegex = /^[a-zA-Z0-9\s.\-_+/\r\n]+$/;
const vinNumberRegex = /^(([a-h,A-H,j-n,J-N,p-z,P-Z,0-9]{9})([a-h,A-H,j-n,J-N,p,P,r-t,R-T,v-z,V-Z,0-9])([a-h,A-H,j-n,J-N,p-z,P-Z,0-9])(\d{6}))$/;
const vinNumberRegex2 = /^([A-Z\d]{3})[A-Z]{2}\d{2}([A-Z\d]{1})([X\d]{1})([A-Z\d]{3})\d{5}$/;
const vinNumberRegex3 = /^[^iIoOqQ'-]{10,17}$/;


module.exports = {
    vin: async function(req, res, next){
        if(!req.user || !req.body.vinNumber){
            return res.status(400).end();
        }
        if(!vinNumberRegex.test(req.body.vinNumber) && !vinNumberRegex2.test(req.body.vinNumber) && !vinNumberRegex3.test(req.body.vinNumber)){
            return res.status(400).end();
        }
    
        //Identify VIN. If not then send error
        const VIN_DECODER_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/' + req.body.vinNumber + '?format=json';
        let error = '';
    
        let options = {
            uri: VIN_DECODER_URL,
            headers: {
                'User-Agent': 'AutoTrust/SproftMedia Server 1',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            json: true // Automatically parses the JSON string in the response
        };
        
        [err, response] = await resolve.to(request(options));
        if(err){
            //Decode Failed - Alert User
            error = 'Autofill service unavailable. Try again later.';
            return res.status(200).send({
                error: error
            });
        }
    
        if(!response.Message.includes('success')){
            //Decode Failed - Alert User
            error = 'Unable to decode VIN. Try a different VIN number';
            return res.status(200).send({
                error: error
            });
        }
        
        //VIN DECODED - Extract Relevant Data and return
        [vehicleDataError, vehicleData] = await resolve.to(utility.extractVehicleInfoForAutoFill(response.Results, req.body.vinNumber));
    
        if(vehicleDataError){
            //Decode Failed - Alert User
            error = 'Unable to decode VIN. Try again later.';
            return res.status(200).send({
                error: error
            });
        }
    
        //Vehicle Data Parsed.

        req.vehicleData = vehicleData;

        return next();
    
        /*return res.status(200).send({
            data: vehicleData
        });*/
    }
}

