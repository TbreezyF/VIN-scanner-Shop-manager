const express = require('express');
const router = express.Router();
const path = require('path');

/*START API*/

router.get('/fetch/inventory', async(req, res)=>{
    res.status(200).sendFile(path.join(__dirname, "../views/frames/search-inventory.html"));
});

router.get('/fetch/add-listing', async(req, res)=>{
    res.status(200).sendFile(path.join(__dirname, "../views/frames/new-listing.html"));
});

router.get('/fetch/service-request', async(req, res)=>{
    res.status(200).sendFile(path.join(__dirname, "../views/frames/service-request.html"));
});

router.get('/fetch/service-bay', async(req, res)=>{
    res.status(200).sendFile(path.join(__dirname, "../views/frames/service-bay.html"));
});

/*END API*/

module.exports = router;