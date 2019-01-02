require('./env');
require('ejs');
const express = require('express');
const app = express();
const index = require('./routes/index');
const api = require('./routes/api');
const inventory = require('./routes/inventory');
const profile = require('./routes/profile');
const vehicle = require('./routes/vehicle');
const staff = require('./routes/staff');
const service = require('./routes/service');
const pricechecker = require('./routes/pricechecker');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const fs = require('fs');
const https = require('https');
const log = require('./models/logger');
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;


const certOptions = {
    cert: fs.readFileSync(__dirname + '/crt/074-domain-crt.pem'),
    key: fs.readFileSync(__dirname + '/crt/074-domain-key.pem')
}


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
if(process.env.NODE_ENV == 'production'){
    app.use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301));
}
app.use(helmet());
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.use(cookieParser());
app.use('/', index);
app.use('/inventory', inventory);
app.use('/vehicle', vehicle);
app.use('/pricechecker', pricechecker);
app.use('/profile', profile);
app.use('/staff', staff);
app.use('/service', service);

app.listen(process.env.PORT, () => {
    console.log('[' + new Date() + '] AUTOTRUST Server is listening on [::]:' + process.env.PORT);
});

https.createServer(certOptions, app).listen(443);