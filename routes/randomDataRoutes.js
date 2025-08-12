// Import Express
const express = require("express");

// Import controller that handles fetching random data
const randomData = require("../controller/randomData");

// Import userController to use its authentication middleware
const userController = require("../controller/userController");

// Create a new Express router instance
const router = express.Router();

// --- Routes ---

// GET /randomdata
// Protected route: user must be authenticated via userController.protect
// Calls randomData.getData to fetch and return random data
router.get("/randomdata", userController.protect, randomData.getData);

// Export the router so it can be used in app.js
module.exports = router;
