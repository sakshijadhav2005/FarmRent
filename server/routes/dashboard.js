// routes/dashboard.js
const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

router.get("/stats", protect, getDashboardStats);

module.exports = router;
