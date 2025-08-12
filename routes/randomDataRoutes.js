const express = require("express");
const randomData = require("../controller/randomData");
const userController = require("../controller/userController");

const router = express.Router();

router.get("/randomdata", userController.protect, randomData.getData);

module.exports = router;
