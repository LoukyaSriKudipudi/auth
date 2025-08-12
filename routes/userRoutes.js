// Import Express
const express = require("express");

// Import userController to handle all user-related operations
const userController = require("../controller/userController");

// Create a new router instance
const router = express.Router();

// --- Authentication Routes ---

// POST /signup
// Registers a new user
router.post("/signup", userController.signup);

// POST /login
// Logs in an existing user and returns authentication token
router.post("/login", userController.login);

// POST /forgotpassword
// Sends password reset token to user's email
router.post("/forgotpassword", userController.forgotPassword);

// POST /resetpassword/:token
// Resets the password using a valid reset token
router.post("/resetpassword/:token", userController.resetPassword);

// POST /changepassword
// Changes the logged-in user's password
// Protect middleware ensures the user is authenticated first
router.post(
  "/changepassword/",
  userController.protect,
  userController.changePassword
);

// --- User Account Management ---

// PATCH /updateMe
// Updates the logged-in user's data (e.g., name, email)
router.patch("/updateMe", userController.protect, userController.updateMe);

// DELETE /deleteMe
// Deactivates or deletes the logged-in user's account
router.delete("/deleteMe", userController.protect, userController.deleteMe);

// --- Admin and General User Routes ---

// /:id route group
router
  .route("/:id")
  // GET /:id — Get details of a specific user by ID
  .get(userController.getUserDetails)
  // DELETE /:id — Delete a user (admin only)
  .delete(
    userController.protect, // Ensure the requester is logged in
    userController.restrictTo("admin"), // Only allow admins
    userController.deleteUser
  );

// GET /
// Get all users (open or possibly restricted in controller logic)
router.route("/").get(userController.getAllUsers);

// Export the router for use in app.js
module.exports = router;
