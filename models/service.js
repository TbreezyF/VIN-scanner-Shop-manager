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

module.exports = {
    add: async function(serviceInfo){
         let query = {
             TableName: '074-serviceRecords',
             Item: serviceInfo
         };  
         
         [err, res] = await resolve.to(db.put(query).promise());

         if(err && !res){
            throw new Error('Failed to add service record to DB');
         }

         return true;
    },
    delete: async function(serviceId){
        let queryTable = '074-serviceRecords';

        if(!serviceId){
            throw new Error('No service record number provided');
        }

        let query = {
            TableName: queryTable,
            Key: {
                serviceId: Number(serviceId)
            }
        };

        [err, res] = await resolve.to(db.delete(query).promise());

        if(err && !res){
           throw new Error('Failed to delete service record from DB');
        }

        return true;

    },
    start: async function(serviceId, user, notes){
        let queryTable = '074-serviceRecords';

        if(!serviceId){
            throw new Error('No service record number provided');
        }
        
        [err, record] = await resolve.to(localFetch(serviceId));

        if(err || !record){
            throw new Error('Service record does not exist');
        }

        record.technicians.push(user.firstName + ' ' + user.lastName);
        record.timeStarted = {
            exactTime: moment().format('MMMM Do YYYY, h:mm:ss a')
        }
        record.inBay = true;
        if(notes){
            record.notes = notes;
        }

        let query = {
            TableName: queryTable,
            Item: record
        };

        [updateErr, res] = await resolve.to(db.put(query).promise());

        if(updateErr && !res){
           throw new Error('Failed to start service record on the server');
        }

        return true; 
    },
    update: async function(serviceId, user, notes){
        let queryTable = '074-serviceRecords';

        if(!serviceId){
            throw new Error('No service record number provided');
        }
        
        [err, record] = await resolve.to(localFetch(serviceId));

        if(err || !record){
            throw new Error('Service record does not exist');
        }

        record.technicians.push(user.firstName + ' ' + user.lastName);
        record.lastUpdated = moment().format('MMMM Do YYYY, h:mm:ss a') +  ' by ' + user.firstName + ' ' + user.lastName;
        if(notes){
            record.notes = notes;
        }

        let query = {
            TableName: queryTable,
            Item: record
        };

        [updateErr, res] = await resolve.to(db.put(query).promise());

        if(updateErr && !res){
           throw new Error('Failed to start service record on the server');
        }

        return true; 
    },
    stop: async function(serviceId, user){
        let queryTable = '074-serviceRecords';

        if(!serviceId){
            throw new Error('No service record number provided');
        }
        
        [err, record] = await resolve.to(localFetch(serviceId));

        if(err || !record){
            throw new Error('Service record does not exist');
        }

        record.timeEnded = {
            exactTime: moment().format('MMMM Do YYYY, h:mm:ss a')
        }

        let then = record.timeStarted.exactTime;
        let now = record.timeEnded.exactTime;

        var time = record.timeEstimate;
        var hour = time[0];
        var minutes = time[1];
        var toEstimate = true;
        if(hour == '' || !hour){
            hour=0;
        }else if(Number(hour)){
            hour = Number(hour);
        }else{
            hour =0;
        }
        if(minutes == '' || !minutes){
            minutes=0;
        }else if(Number(minutes)){
            minutes = Number(minutes);
        }else{
            minutes=0;
        }

        if(hour==0 && minutes==0){
            toEstimate = false;
        }

        if(toEstimate){
            var hourMs = hour * 60 * 60 * 1000;
            var minutesMs = minutes * 60 * 1000;
            var totalTime = hourMs + minutesMs;

            var ms = moment(now,'MMMM Do YYYY, h:mm:ss a').diff(moment(then,'MMMM Do YYYY, h:mm:ss a'));

            if(ms > totalTime){
                record.delayed = true;
            }
        }

        record.inBay = false;
        record.completed = true;

        let query = {
            TableName: queryTable,
            Item: record
        };

        [updateErr, res] = await resolve.to(db.put(query).promise());

        if(updateErr && !res){
           throw new Error('Failed to mark service request as complete on the server');
        }

        return true; 

    },
    getAll: async function(){
        let query = {
            TableName: '074-serviceRecords'
        };

        [err, serviceRecords] = await resolve.to(db.scan(query).promise());

        if(err || !serviceRecords){
            throw new Error('An unexpected error occured while trying to fetch all service records');
        }

        return serviceRecords.Items;
    },
    getLength: async function(){
        let queryTable = '074-serviceRecords';

        let query = {
            TableName: queryTable
        };

        [err, serviceRecords] = await resolve.to(db.scan(query).promise());

        if(err || !serviceRecords){
            throw new Error('An unexpected error occured while trying to fetch all service records');
        }

        if(serviceRecords.Items){
            return serviceRecords.Items.length;
        }else{
            return 0;
        }
    },
    fetch: async function(serviceId){
        let queryTable = '074-serviceRecords';

        if(!serviceId || !Number(serviceId)){
            log.error('Invalid servie Id format');
            throw new Error('Invalid service Id number');
        }

        serviceId = Number(serviceId);
        let query = {
            TableName: queryTable,
            Key: {
                serviceId: serviceId
            }
        };

        [err, serviceRecord] = await resolve.to(db.get(query).promise());

        if(!serviceRecord.Item || err){
            log.error('Service record Fetch ERROR: ' + err);
            throw new Error('Seervice record does not exist');
        }else{
            return serviceRecord.Item;
        }
    },
    genServiceNo: async function(){
        return await genServiceLocal();
    }
}//END Exports

//Begin Local Functions

async function genServiceLocal(){
    let serviceId = Number(randomatic('0', 6));

        let query = {
            TableName: '074-serviceRecords',
            Key: {
                serviceId: serviceId
            }
        };
        [err, serviceRecord] = await resolve.to(db.get(query).promise());

        if(serviceRecord.Item){
            await genServiceLocal();
        }else{
            return serviceId;
        }
}
async function localFetch(serviceId){
    let query = {
        TableName: '074-serviceRecords',
        Key: {
            serviceId: Number(serviceId)
        }
    };

    [err, serviceRecord] = await resolve.to(db.get(query).promise());

    if(!serviceRecord.Item || err){
        throw new Error('Service record does not exist');
    }else{
        return serviceRecord.Item;
    }
}
