const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

// GET /api/maps/geocode?q=address
router.get('/geocode', mapController.geocode);

// GET /api/maps/route?start=lat,lon&end=lat,lon
router.get('/route', mapController.route);

module.exports = router;
