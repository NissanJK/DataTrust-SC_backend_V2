const express = require("express");
const router = express.Router();
const { resetSystem, verifyChain } = require("../controllers/systemController");

// Reset entire system
router.post("/reset", resetSystem);

// Verify blockchain log chain integrity (new - smart contract addition)
router.get("/verify-chain", verifyChain);

module.exports = router;