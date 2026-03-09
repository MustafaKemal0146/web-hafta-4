const express = require("express");
const { getSummaryStats } = require("../controllers/repoController");

const router = express.Router();

router.get("/summary", getSummaryStats);

module.exports = router;
