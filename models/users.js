const shortid = require('shortid');
const AWS = require('aws-sdk');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const utility = require('../models/utility.js');
const util = require('util');
const resolve = require('await-to-js');
const log = require('./logger');
const moment = require('moment');

AWS.config.update({
    region: "ca-central-1"
});

const db = new AWS.DynamoDB.DocumentClient({
    convertEmptyValues: true
});

const s3 = new AWS.S3();

const userSchema = Joi.object().keys(
    {
        userId: Joi.string().alphanum().required(),
        firstName: Joi.string().regex(/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u).required(),
        lastName: Joi.string().regex(/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u).required(),
        userName: Joi.string().alphanum().min(3).max(30).required(),
        emailAddress: Joi.string().email({ minDomainAtoms: 2 }).required(),
        pass: Joi.string().alphanum().required(),
        authKey: Joi.string().alphanum().required()
    }
);

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

module.exports = {
    add: async function(userInfo){
            //TODO: Check if user already exists and RETURN if they do with error message
            userInfo.userId = shortid.generate();
            const validUserSchema = Joi.validate(userInfo, userSchema);
            let err, passwordHash;

            if(validUserSchema.error === null){
                //Data is valid

                //check to see if user already exists
                [arError, arResult] = await resolve.to(localFetch(userInfo.userName));
                if(arResult){
                    throw new Error('Username already exists.');
                }
                if(userInfo.authKey != process.env.ADMIN_AUTH_KEY && userInfo.authKey != process.env.STAFF_AUTH_KEY){
                    //invalid auth key
                    throw new Error('SERVER ERROR: Server does not recognize the provided Authorization Key');
                }
                if(userInfo.authKey != process.env.ADMIN_AUTH_KEY){
                    userInfo.role = 'staff';
                }else{
                    userInfo.role = 'admin';
                }
                [err, passwordHash] = await resolve.to(bcrypt.hash(userInfo.pass, 12));
                if(passwordHash){
                    let userQuery = {
                        TableName: '074-Users',
                        Item: {
                            userId: userInfo.userId,
                            firstName: userInfo.firstName.toUpperCase(),
                            lastName: userInfo.lastName.toUpperCase(),
                            userName: userInfo.userName.toUpperCase(),
                            emailAddress: userInfo.emailAddress,
                            passwordHash,
                            role: userInfo.role,
                            profilePic: "",
                            recentActivity: [],
                            projects: [],
                            about: "",
                            joined: moment().format('MMMM Do YYYY, h:mm:ss a')
                        }
                    };

                    [userError, userResult] = await resolve.to(db.put(userQuery).promise());
                    if(!userError){
                     //User Added to DB -- Construct user object
                     let user = {
                         userName: userInfo.userName.toUpperCase(),
                         firstName: userInfo.firstName.toUpperCase(),
                         lastName: userInfo.lastName.toUpperCase(),
                         emailAddress: userInfo.emailAddress,
                         userId: userInfo.userId,
                         role: userInfo.role,
                         profilePic: "",
                         recentActivity: [],
                         projects: [],
                         about: "",
                         joined: moment().format('MMMM Do YYYY, h:mm:ss a')
                     }

                     return user;
                    }
                }else{
                    throw new Error('SERVER ERROR: Your account cannot be created at this time. Please try again later.');
                }
            }else{
                throw new Error('SERVER ERROR: Some of the information you provided was invalid.');
            }
    },

    authenticate: async function(userInfo){
        if(userInfo.userName && userInfo.pass){
            let query = {
                TableName: '074-Users',
                Key: {
                    userName: userInfo.userName.toUpperCase()
                }
            };

            [err, user] = await resolve.to(db.get(query).promise());

            if(!user.Item){
                throw new Error('Username does not exist');
            }

            [pass_error, pass_res] = await resolve.to(bcrypt.compare(userInfo.pass, user.Item.passwordHash));

            if(!pass_res){
                throw new Error('You have entered incorrect credentials');
            }
            delete user.Item.passwordHash;
            return user.Item;

        }else{
            throw new Error('Incomplete credentials');
        }
    },
    delete: async function(userName){
        let query = {
            TableName: '074-Users',
            Key: {
                userName: userName.toUpperCase()
            }
        };

        [err, user] = await resolve.to(db.delete(query).promise());

        if(!err){
            return;
        }else{
            throw new Error('User could not be deleted or does not exist');
        }

    },
    fetch: async function(userName){
        let query = {
            TableName: '074-Users',
            Key: {
                userName: userName.toUpperCase()
            }
        };

        [err, user] = await resolve.to(db.get(query).promise());

        if(!user.Item){
            throw new Error('User does not exist');
        }else{
            return user.Item;
        }
    },
    update: async function(data, user){
        let default_pass = '11111122333';
        let passQuery = true;
        let query = {};
        let passwordHash = null;
        if(!data){
            throw new Error('No data provided.');
        }

        if(data.pass !== default_pass){
            [err, passwordHash] = await resolve.to(bcrypt.hash(data.pass, 12));
        }

        let recentActivity = user.recentActivity;
        let month = months[moment().month()];

        let activity = {
            message: 'Updated their profile.',
            day: moment().date(),
            month: month
        };
        recentActivity.push(activity);
        query = {
            TableName: '074-Users',
            Key: {
                userName: data.userName.toUpperCase()
            },
            UpdateExpression: "set firstName = :f, lastName=:l, emailAddress=:e, about=:b, recentActivity=:r",
            ExpressionAttributeValues: {
                ':f': data.firstName.toUpperCase(),
                ':l': data.lastName.toUpperCase(),
                ':e': data.emailAddress,
                ':b': data.about,
                ':r': recentActivity
            },
            ReturnValues: 'UPDATED_NEW'
        };

        if(passwordHash){
            query.UpdateExpression += ', passwordHash=:p';
            query.ExpressionAttributeValues[':p'] = passwordHash;
        }

        if(data.profilePic){
            let ext = getExt(data.profilePic);
            //upload image to s3 or throw error
            let buffer = Buffer.from(data.profilePic.data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            let s3Query = {
                Bucket: '074-users',
                Body: buffer,
                Key: data.userName + '/avatar.' + ext,
                ContentEncoding: 'base64',
                ContentType: data.profilePic.type
            };

            [s3error, s3uploaded] = await resolve.to(s3.putObject(s3Query).promise());

            if(s3error){
                throw new Error(s3error);
            }

            query.UpdateExpression += ', profilePic=:a';
            query.ExpressionAttributeValues[':a'] = 'https://s3.ca-central-1.amazonaws.com/' + s3Query.Bucket + '/' + s3Query.Key;
        }
        
        [error, updatedUser] = await resolve.to(db.update(query).promise());
        
        if(updatedUser.Attributes){
            return true;
        }

        return null;

    } 
}//END Exports

//Begin Local Functions

async function localFetch(userName){
    let query = {
        TableName: '074-Users',
        Key: {
            userName: userName.toUpperCase()
        }
    };

    [err, user] = await resolve.to(db.get(query).promise());

    if(!user.Item){
        throw new Error('User does not exist');
    }else{
        return user.Item;
    }
}

function getExt(pic){
    let type = pic.type;
    return type.substring(type.indexOf('/') + 1, type.length);
}