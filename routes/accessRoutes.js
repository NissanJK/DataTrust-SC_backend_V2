const express = require("express");
const router = express.Router();
const {
  requestAccess,
  getLogs
} = require("../controllers/accessController");

router.post("/request", requestAccess);
router.get("/logs", getLogs);

module.exports = router;
