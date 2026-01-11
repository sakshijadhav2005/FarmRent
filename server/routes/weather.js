const express = require('express');
const router = express.Router();
const {
    getWeatherForecast,
    getCurrentWeather,
    getBookingRecommendation
} = require('../controllers/weatherController');

/**
 * Weather Routes
 * Provides weather data for smart booking decisions
 */

// @route   GET /api/weather/forecast/:location
// @desc    Get 7-day weather forecast for a location
// @access  Public
router.get('/forecast/:location', getWeatherForecast);

// @route   GET /api/weather/current/:location
// @desc    Get current weather for a location
// @access  Public
router.get('/current/:location', getCurrentWeather);

// @route   POST /api/weather/recommend
// @desc    Get booking recommendation based on weather
// @access  Public
router.post('/recommend', getBookingRecommendation);

module.exports = router;
