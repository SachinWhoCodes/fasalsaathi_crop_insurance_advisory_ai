const express = require("express");
const router = express.Router();
const setRawDataPost = require("../controllers/rawReport/set-raw-data_post");
const resetRawReport = require("../controllers/rawReport/reset-raw-reports");
const getRawReports = require("../controllers/rawReport/get-raw-reports");
const setFinalData = require("../controllers/finalReport/set-final-data");
const replaceFinalReport = require("../controllers/finalReport/replace-final-report");
const getUserDetails = require("../controllers/get-user-details");
const User = require("../models/User");

router.post("/set-raw-data",  setRawDataPost);
router.post("/reset-raw-report", resetRawReport);
router.get("/user-details",  getUserDetails);
router.get("/raw-reports", getRawReports);
router.post("/set-final-reports",  setFinalData);
router.post("/replace-final-reports", replaceFinalReport);

module.exports = router;