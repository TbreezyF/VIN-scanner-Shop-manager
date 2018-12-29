
const jwt = require('jsonwebtoken');
const log = require('./logger');
const util = require('util');
const moment = require('moment');
const alphanumRegex = /^[a-zA-Z0-9\s.\-_+/\r\n]+$/;
module.exports = {
    getToken: function(user){
        return jwt.sign(user, process.env.APP_ACCESS_KEY, { expiresIn: '24h' });
    },
    verifyToken: function(req, res, next){
        if (req.cookies) {
            if (req.cookies.session) {
                const bearerToken = req.cookies.session;
                try{
                    let user = jwt.verify(bearerToken, process.env.APP_ACCESS_KEY);
                    req.user = user;
                    return next();
                }
                catch(error){
                    return res.status(400).redirect('/');  
                }
            } else {
                return res.status(400).redirect('/');
            }
        }
        else{
            return res.status(400).redirect('/'); 
        }
    },
    verifyLogin: function(req, res, next){
        if (req.cookies) {
            if (req.cookies.session) {
                const bearerToken = req.cookies.session;
                try{
                    let user = jwt.verify(bearerToken, process.env.APP_ACCESS_KEY);
                    req.user = user;
                    return next();
                }
                catch(error){
                    return next(); 
                }
            }else{
                return next();
            }
        }
        else{
            return next(); 
        }
    },
    extractVehicleInfoForAutoFill: async function(data, vinNumber){
        let vehicleData = extractVehicleInfo(data);
        let obj = {};

        //AUTOFILL DATA
        let autoFillData = {
            vinNumber: vinNumber,
            make: vehicleData['Make'] || null,
            year: vehicleData['Model Year'] || null,
            model: vehicleData['Model'] || null,
            seats: null,
            bodyType: vehicleData['Body Class'] || null,
            numberOfGears: null,
            numberOfDoors: vehicleData['Doors'] || null,
            driveType: vehicleData['Drive Type'] || null,
            transmissionType: vehicleData['Transmission Style'] || null,
            numberOfCylinders: vehicleData['Engine Number of Cylinders'] || null,
            engineType: vehicleData['Engine Configuration'] || null,
            trim: vehicleData['Trim'] || vehicleData['Series'] || null,
            fuelType: vehicleData['Fuel Type - Primary'] || null,
            engineCapacity: null
        };

        obj = sanitizeVehicleInfo(autoFillData);
        return obj;
    },
    extractVehicleInfoForDB: async function(data){
        let vehicleData = extractVehicleInfo(data);
        return;
    }, 
    decodeVIN: async function(vinNumber){
        
    }, 
    verifyVehicleSubmit: async function(data){
        var isValid = true;
        for(key in data){
            if(key != 'vehiclePhotos' && data[key] != ''){
                if(!alphanumRegex.test(data[key])){
                    log.info('Invalid Key: ' + key);
                    isValid = false;
                    break;
                }
            }
        }
        return isValid;
    }
}

function extractVehicleInfo(data){
    let obj = {};
        if(!Array.isArray(data)){
            throw new Error('Data provided is not an array. Array expected');
        }

        for(let i=0; i<data.length; i++){
            if(data[i].Value !== '' && data[i].Value !== null){
                obj[data[i].Variable] = data[i].Value;
            }
        }
        return obj;
}

function sanitizeVehicleInfo(autoFillData){
        //DRIVE TYPE
        if(autoFillData.driveType !== null){
            let driveType = autoFillData.driveType;

            if(driveType.includes('4x4') || driveType.includes('4WD') || driveType.includes('4-Wheel')){
                autoFillData.driveType = '4x4';
            }
            else if(driveType.includes('RWD') || driveType.includes('Rear') || driveType.includes('Rear Wheel') || driveType.includes('Rear-Wheel')){
                autoFillData.driveType = 'REAR';
            }
            else if(driveType.includes('FWD') || driveType.includes('Front') || driveType.includes('Front Wheel') || driveType.includes('Front-Wheel')){
                autoFillData.driveType = 'FRONT';
            }
            else if(driveType.includes('AWD') || driveType.includes('All') || driveType.includes('All Wheel') || driveType.includes('All-Wheel')){
                autoFillData.driveType = 'AWD';
            }
            else{
                autoFillData.driveType = 'OTHER';
            }
        }

        //BODY TYPE
        if(autoFillData.bodyType !== null){
            let bodyType = autoFillData.bodyType;

            if(bodyType.includes('Convertible')){
                autoFillData.bodyType = 'CONVERTIBLE';
            }
            else if(bodyType.includes('Coupe')){
                autoFillData.bodyType = 'COUPE';
            }
            else if(bodyType.includes('Sedan') || bodyType.includes('Saloon')){
                autoFillData.bodyType = 'SEDAN';
            }
            else if(bodyType.includes('Wagon')){
                autoFillData.bodyType = 'WAGON';
            }
            else if(bodyType.includes('Van')){
                autoFillData.bodyType = 'VAN';
            }
            else if(bodyType.includes('Hatch')){
                autoFillData.bodyType = 'HATCHBACK';
            }
            else if(bodyType.includes('Ute') || bodyType.includes('Pick up') || bodyType.includes('Pick-Up') || bodyType.includes('Truck') || bodyType.includes('Pickup')){
                autoFillData.bodyType = 'UTE';
            }
            else if(bodyType.includes('Cab') || bodyType.includes('Chassis') || bodyType.includes('Cab Chassis')){
                autoFillData.bodyType = 'CAB CHASSIS';
            }
            else if(bodyType.includes('Tray') || bodyType.includes('Trailer')){
                autoFillData.bodyType = 'TRAY';
            }
            else if(bodyType.includes('SUV') || bodyType.includes('S.U.V') || bodyType.includes('Sport Utility') || bodyType.includes('Sport Utility Vehicle')){
                autoFillData.bodyType = 'SUV';
            }
            else if(bodyType.includes('Heavt') || bodyType.includes('Commercial') || bodyType.includes('Heavy Commercial')){
                autoFillData.bodyType = 'HEAVY COMMERCIALS';
            }
            else{
                autoFillData.bodyType = 'OTHER';
            }
        }


        //DOORS, CYLINDERS, MODEL YEAR
        if(autoFillData.numberOfCylinders !== null){
            if(!Number(autoFillData.numberOfCylinders)){
                autoFillData.numberOfCylinders = null;
            }
        }
        if(autoFillData.numberOfDoors !== null){
            if(!Number(autoFillData.numberOfDoors)){
                autoFillData.numberOfCylinders = null;
            }
        }
        if(autoFillData.year !== null){
            if(!Number(autoFillData.year)){
                autoFillData.year = null;
            }    
        }
        //TRANSMISSION TYPE
        if(autoFillData.transmissionType !== null){
            if(autoFillData.transmissionType.includes('Automatic')){
                autoFillData.transmissionType = 'AUTOMATIC';
            }
            else if(autoFillData.transmissionType.includes('Manual')){
                autoFillData.transmissionType = 'MANUAL';
            }else{
                autoFillData.transmissionType = null;
            }
        }


        //ENGINE TYPE
        if(autoFillData.engineType !==null){
            if(autoFillData.engineType.includes('V-') || autoFillData.engineType.includes('V-Shape')){
                autoFillData.engineType = 'PISTON V';
            }
            if(autoFillData.engineType.includes('W-') || autoFillData.engineType.includes('W-Shape')){
                autoFillData.engineType = 'PISTON W';
            }
            else if(autoFillData.engineType.includes('IN-') || autoFillData.engineType.includes('inline') || autoFillData.engineType.includes('In-Line')){
                autoFillData.engineType = 'PISTON IN-LINE'
            }
            else if(autoFillData.engineType.includes('Electric')){
                autoFillData.engineType = 'ELECTRIC MOTOR';
            }
            else if(autoFillData.engineType.includes('Rotary')){
                autoFillData.engineType = 'ROTARY';
            }
            else if(autoFillData.engineType.includes('Hybrid')){
                autoFillData.engineType = 'HYBRID';
            }
            else if(autoFillData.engineType.includes('horizontal')){
                autoFillData.engineType = 'PISTON HORIZONTAL OPPOSED';
            }
            else{
                autoFillData.engineType = 'UNKNOWN';
            }
        }

        //FUEL TYPE
        if(autoFillData.fuelType !== null){
            if(autoFillData.fuelType.includes('Gas')){
                autoFillData.fuelType = 'GAS';
            }
            else if(autoFillData.fuelType.includes('Diesel')){
                autoFillData.fuelType = 'DIESEL';
            }
            else if(autoFillData.fuelType.includes('Dual fuel')){
                autoFillData.fuelType = 'DUAL FUEL';
            }
            else if(autoFillData.fuelType.includes('Electric')){
                autoFillData.fuelType = 'ELECTRIC';
            }
            else if(autoFillData.fuelType.includes('lead')){
                autoFillData.fuelType = 'LEADED PETROL';
            }
            else if(autoFillData.fuelType.includes('unlead')){
                autoFillData.fuelType = 'UNLEADED PETROL';
            }
            else if(autoFillData.fuelType.includes('Premium')){
                autoFillData.fuelType = 'PREMIUM UNLEADED PETROL';
            }
            else if(autoFillData.fuelType.includes('AWD')){
                autoFillData.fuelType = 'AWD';
            }
            else if(autoFillData.fuelType.includes('Hybrid')){
                autoFillData.fuelType = 'HYBRID';
            }
            else{
                autoFillData.fuelType = 'UNKNOWN';
            }
        }

        return autoFillData;
}