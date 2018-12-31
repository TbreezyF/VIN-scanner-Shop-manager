const shortid = require('shortid');
const AWS = require('aws-sdk');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const utility = require('../models/utility.js');
const util = require('util');
const resolve = require('await-to-js');
const log = require('./logger');
const randomatic = require('randomatic');
const moment = require('moment');

AWS.config.update({
    region: "ca-central-1"
});

const db = new AWS.DynamoDB.DocumentClient({
    convertEmptyValues: true
});

const s3 = new AWS.S3();
let notesArray = []; //Holder to parse vehicle notes

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const feature_map = [
    '14" Alloy Wheels', '15" Alloy Wheels', '16" Alloy Wheels', '17" Alloy Wheels', '18" Alloy Wheels', '19" Alloy Wheels', '20" Alloy Wheels', '22" Alloy Wheels',
    'Alarm', 'Audio - MP3 Decoder', 'Body Kit', 'Bonnet Protector', 'Bull Bar', 'Cargo Barrier', 'Carpet Mats', 'CD Player', 'Central Locking', 'Central Locking - Keyless',
    'Colour Display Screen - Front', 'Colour Display Screen - Rear', 'Control - Park Distance Rear', 'Cruise Control', 'Driving Lamps', 'DVD Player', 'Engine Immobiliser', 'Fog Lamps - Front', 
    'GPS (Satellite Navigation)', 'Headlight Covers', 'Leather Seats', 'Leather Trim', 'LPG (Dual Fuel)', 'Roof Deflector', 'Spoiler - Rear', 'Sunroof', 'Sunroof - Electric', 'Tinted Windows', 
    'Tow Bar', 'Weather Shields', 'Wheelchair Access', 'Ski bag', 'Electric Front Seats', 'Paint - Metallic'
                    ];

module.exports = {
    add: async function(vehicleInfo){
         let query = {
             TableName: '074-Vehicles',
             Item: vehicleInfo
         };  
         
         [err, res] = await resolve.to(db.put(query).promise());

         if(err && !res){
            throw new Error('Failed to add vehicle to DB');
         }

         return true;
    },
    addSold: async function(vehicleInfo){
        let query = {
            TableName: '074-soldVehicles',
            Item: vehicleInfo
        };  
        
        [err, res] = await resolve.to(db.put(query).promise());

        if(err && !res){
           throw new Error('Failed to add vehicle to DB');
        }

        return true;
    },
    delete: async function(stockNo, mode){
        let DBmodeArray = ['074-Vehicles', '074-soldVehicles'];
        let queryTable = '074-Vehicles';

        if(!stockNo){
            throw new Error('No vehicle stock number provided');
        }

        if(Number(mode)){
            queryTable = DBmodeArray[mode];
        }

        let query = {
            TableName: queryTable,
            Key: {
                stockNo: stockNo
            }
        };

        [err, res] = await resolve.to(db.delete(query).promise());

        if(err && !res){
           throw new Error('Failed to delete vehicle from DB');
        }

        return true;

    },
    getAll: async function(){
        let query = {
            TableName: '074-Vehicles'
        };

        [err, vehicles] = await resolve.to(db.scan(query).promise());

        if(err || !vehicles){
            throw new Error('An unexpected error occured while trying to fetch all vehicles');
        }

        return vehicles.Items;
    },
    getLength: async function(mode){
        let DBmodeArray = ['074-Vehicles', '074-soldVehicles'];
        let queryTable = '074-Vehicles';
        if(mode){
            if(Number(mode) <=1){
                queryTable = DBmodeArray[mode];
            }
        }

        let query = {
            TableName: queryTable
        };

        [err, vehicles] = await resolve.to(db.scan(query).promise());

        if(err || !vehicles){
            throw new Error('An unexpected error occured while trying to fetch all vehicles');
        }

        if(vehicles.Items){
            return vehicles.Items.length;
        }else{
            return 0;
        }
    },
    fetch: async function(stockNo, mode){
        let DBmodeArray = ['074-Vehicles', '074-soldVehicles'];
        let queryTable = '074-Vehicles';

        if(!stockNo || !Number(stockNo)){
            log.error('Invalid stock number format');
            throw new Error('Invalid stock number');
        }

        if(mode){
            if(Number(mode) <=1){
                queryTable = DBmodeArray[mode];
            }
        }

        stockNo = Number(stockNo);
        let query = {
            TableName: queryTable,
            Key: {
                stockNo: stockNo
            }
        };

        [err, vehicle] = await resolve.to(db.get(query).promise());

        if(!vehicle.Item || err){
            log.error('Vehicle Fetch ERROR: ' + err);
            throw new Error('Vehicle does not exist');
        }else{
            return vehicle.Item;
        }
    },
    genStockNo: async function(){
        return await genStockLocal();
    },
    parseFeatures: async function(data){
        let selectedFeatures = [];

        for(key in data){   
            if(key.includes('additional_feature')){
                selectedFeatures.push(key);
            }
        }

        let feature = '';
        let featureList = [];
        for(var i=0; i<selectedFeatures.length; i++){
            feature = selectedFeatures[i];
            feature = feature.substring(feature.lastIndexOf('_') + 1, feature.length);
            featureList.push(feature_map[Number(feature)]);
        }

        return featureList;
    },
    getFeaturesForEdit: async function(data){
        let selectedFeatures = [];

        for(key in data){   
            if(key.includes('additional_feature')){
                selectedFeatures.push(key);
            }
        }
        return selectedFeatures;
    },
    update: async function(vehicle){
        //update
    },
    arrangeData: async function(data, features, selectedFeatures, stockNo, user){
        notesArray = []; //reset notes array
        let obj = {};

        let month = months[moment().month()];
        let day = moment().date();
        let year = new Date().getFullYear();
        obj.stockNo = stockNo;
        obj.vin = data.manual_vin_number;
        obj.year = data['Vehicle Year'];
        obj.seats = data.Seats;
        obj.numberOfGears = data.Gears;
        obj.driveType = data['Drive Type'];
        obj.numberOfCylinders = data.Cylinders;
        obj.fuelType = data['Fuel Type'];
        obj.make = data.Make;
        obj.model = data.Model;
        obj.trim = data.Trim;
        obj.bodyType = data['Body Style'];
        obj.numberOfDoors = data.Doors;
        obj.transmissionType = data.Transmission;
        obj.engineType = data['Engine Type'];
        obj.mileage = data.vehicle_mileage;
        obj.exteriorColor = data.exterior_color;
        obj.interiorColor = data.interior_color;
        obj.registered = data.RegisteredYes === 'on' ? true: false;
        obj.plateNumber = data.vehicle_plate_number || null;
        obj.registrationExpMonth = data.Registration_Month || null;
        obj.registrationExpYear = data.Registration_Expiry_Year || null;
        obj.registrationNumber = data.vehicle_registration_number || null;
        obj.photos = data.vehiclePhotos || [];
        obj.dealership = {
            price: data.sale_price || null,
            notes: data.vehicle_notes,
            editors: data['Allow-Admin-Edit'] === 'on' ? 'Admin':'Staff',
            locationHistory: [{
                addressLine1: data.address_line_1 || null,
                addressLine2: data.address_line_2 || null,
                addressCity: data.address_city || null,
                postalCode: data.address_postal || null,
                state: data.State || null,
                country: data.Country || null
            }],
            serviceHistory: [],
            testDriveHistory: [],
            sold: false,
            onHold: (data.holdVehicle == 'true') || false,
            addedBy: user.firstName + ' ' + user.lastName,
            lastModifiedBy: user.firstName + ' ' + user.lastName,
            lastModifiedOn: {
                day: day || null,
                month: month || null,
                year: year || null,
                exactTime: moment().format('MMMM Do YYYY, h:mm:ss a')
            },
            soldTime: {},
            onLot: data.onLot
        };
        obj.features = features;
        obj.selectedFeatures = selectedFeatures;
        obj.specs = {};


        let notes = obj.dealership.notes;

        getNotes(notes);

        obj.dealership.notes = notesArray;
        
        return obj;
    },
    savePhotos: async function(photos, stockNo){
        if(!photos){
            throw new Error('No Photo(s) Object provided.');
        }

        let ext, buffer, s3Query;
        let photoLocations = [];

        for(var i=0; i<photos.length; i++){
             buffer = Buffer.from(photos[i].data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
             ext = getExt(photos[i].type);
             s3Query = {
                Bucket: '074-vehicles',
                Body: buffer,
                Key: stockNo + '/' + i + '.' + ext,
                ContentEncoding: 'base64',
                ContentType: photos[i].type
            };

            [s3error, s3uploaded] = await resolve.to(s3.putObject(s3Query).promise());

            if(s3error){
                throw new Error(s3error);
            }

            photoLocations.push('https://s3.ca-central-1.amazonaws.com/' + s3Query.Bucket + '/' + s3Query.Key);
        }
        return photoLocations;
    },
    arrangeForDB: async function(trimData, arrangedData, photos, mode){
        let trim = arrangedData.trim || null;
        let trimInfo = {};
        if(mode == 0){
            if(trim && trimData.Trims && arrangedData){
                for(var i=0; i<trimData.Trims.length; i++){
                    if(trimData.Trims[i].model_trim.toUpperCase().includes(trim.toUpperCase())){
                        trimInfo = trimData.Trims[i];
                        break;
                    }
                    if(trim.length > 3){
                        if(trim.substring(0, 3).toUpperCase().includes(trimData.Trims[i].model_trim)){
                            trimInfo = trimData.Trims[i];
                            break;
                        }else if(trim.substring(3, trim.length).toUpperCase().includes(trimData.Trims[i].model_trim)){
                            trimInfo = trimData.Trims[i];
                            break;
                        }
                    }
                }//END FOR LOOP
            }
            else{
                throw new Error('Some required arguments are missing.');
            }//END IF

            if(trimInfo.model_id){
                arrangedData.specs = trimInfo;
            }
        }
        arrangedData.photos = photos;

        return arrangedData;
    } 
}//END Exports

//Begin Local Functions

async function genStockLocal(){
    let stockNo = Number(randomatic('0', 6));

        let query = {
            TableName: '074-Vehicles',
            Key: {
                stockNo: stockNo
            }
        };
        [err, vehicle] = await resolve.to(db.get(query).promise());

        if(vehicle.Item){
            await genStockLocal();
        }else{
            return stockNo;
        }
}
async function localFetch(stockNo){
    let query = {
        TableName: '074-Vehicle',
        Key: {
            stockNo: stockNo
        }
    };

    [err, vehicle] = await resolve.to(db.get(query).promise());

    if(!vehicle.Item || err){
        throw new Error('Vehicle does not exist');
    }else{
        return vehicle.Item;
    }
}

function getExt(type){
    return type.substring(type.indexOf('/') + 1, type.length);
}

function getNotes(notes){
    if(notes.indexOf('\r\n') == -1){
        notesArray.push(notes);
        return;
    }
    let partial = notes.substring(0, notes.indexOf('\r\n'));
    notesArray.push(partial);

    getNotes(notes.substring(notes.indexOf('\r\n')+2, notes.length));
}