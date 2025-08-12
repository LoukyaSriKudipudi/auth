// Import Express
const express = require("express");

// Import the link controller that contains handler functions for link-related routes
const linkController = require("../controller/linksController");

// Create a new router instance
const router = express.Router();

// --- Routes ---

// POST /:id/response
// Handles submission of a response for a specific link based on its ID
// Example: POST /links/64b2c6.../response
router.post("/:id/response", linkController.submitResponse);

// POST /create
// Creates a new link (protected route - requires authentication)
// Example: POST /links/create
router.post("/create", linkController.protect, linkController.createLink);

// GET /getLinks
// Retrieves all links for the authenticated user
// Example: GET /links/getLinks
router.get("/getLinks", linkController.protect, linkController.getAllLinks);

// Export the router so it can be mounted in app.js
module.exports = router;
