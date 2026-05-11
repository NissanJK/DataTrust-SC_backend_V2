const express = require("express");
const router = express.Router();
const {
  getDisasterAlerts,
  getSectorAlerts,
  getSectorStats,
  getThresholds
} = require("../controllers/disasterController");

// Get all disaster alerts
router.get("/alerts", getDisasterAlerts);

// Get alerts for specific sector
router.get("/alerts/:sector", getSectorAlerts);

// Get sector statistics
router.get("/sectors/stats", getSectorStats);

// Get disaster thresholds
router.get("/thresholds", getThresholds);

module.exports = router;
