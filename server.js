// Import the Express app instance from app.js
const app = require("./app");

// Import Mongoose for MongoDB connection
const mongoose = require("mongoose");

// Load environment variables from the .env file into process.env
require("dotenv").config();

// --- MongoDB Connection Setup ---

// Get the database password from environment variables
const password = process.env.DATABASE_PASSWORD;

// Replace the <PASSWORD> placeholder in the connection string with the actual password
const DB = process.env.DATABASE.replace("<PASSWORD>", password);

// Connect to MongoDB
mongoose
  .connect(DB) // Returns a promise
  .then(() => console.log("✅ DB connection successful")) // Log success message if connected
  .catch((err) => console.error("❌ DB connection failed:", err)); // Log error if connection fails

// --- Start the Server ---

// Get the server port from environment variables, default to 3000 if not provided
const port = process.env.PORT || 3000;

// Start listening for incoming requests
app.listen(port, () => {
  console.log(`server running at ${port}`); // Log the server running status
});
