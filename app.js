require('./env');
require('ejs');
const express = require('express');
const app = express();
const index = require('./routes/index');
const api = require('./routes/api');
const inventory = require('./routes/inventory');
const profile = require('./routes/profile');
const vehicle = require('./routes/vehicle');
const checker = require('./routes/checker');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const fs = require('fs');
const https = require('https');
const log = require('./models/logger');

/*
const certOptions = {
    cert: fs.readFileSync(__dirname + '/smtp_server/sproft_cert.pem'),
    key: fs.readFileSync(__dirname + '/smtp_server/sproft_private.pem')
}
*/

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(helmet());
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.use(cookieParser());
app.use('/', index);
app.use('/inventory', inventory);
app.use('/vehicle', vehicle);
app.use('/checker', checker);
app.use('/profile', profile);
app.use('/api', api);

app.listen(process.env.PORT || 8081, () => {
    log.info('[' + new Date() + '] AUTOTRUST Server is listening on [::]:' + process.env.PORT);
});

//https.createServer(certOptions, app).listen(443);