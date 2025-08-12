// Importing required Node.js and third-party modules
const express = require("express"); // Express framework for building web applications and APIs
const path = require("path"); // Built-in Node.js module for working with file and directory paths
const userRouter = require("./routes/userRoutes"); // Router for handling user-related endpoints
const linkRouter = require("./routes/linkRoutes"); // Router for handling link-related endpoints
const randomDataRouter = require("./routes/randomDataRoutes"); // Router for handling random data fetch endpoints
const rateLimit = require("express-rate-limit"); // Middleware to limit repeated requests from the same IP
const helmet = require("helmet"); // Middleware for securing HTTP headers
const mongoSanitize = require("express-mongo-sanitize"); // Middleware to prevent MongoDB operator injection
const xss = require("xss-clean"); // Middleware to prevent cross-site scripting (XSS) attacks

// Create an Express application instance
const app = express();

// Add security HTTP headers using Helmet
app.use(helmet());

// Parse incoming JSON request bodies
app.use(express.json());

// --- Data Sanitization Middlewares ---

// Prevent MongoDB query injection by removing $ and .
app.use(mongoSanitize());

// Prevent XSS attacks by sanitizing user input
app.use(xss());

// --- Rate Limiting Middleware ---

// Create a rate limiter that allows a maximum of 1000 requests per hour per IP
const limiter = rateLimit({
  max: 1000, // Limit each IP to 1000 requests
  windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  message: "too many request from this IP, please try again in an hour", // Response message when limit is exceeded
});

// Apply rate limiter only to routes starting with /api
app.use("/api", limiter);

// --- Custom Middleware ---

app.use((req, res, next) => {
  // This is a placeholder middleware
  // Example: You could log request headers here for debugging
  // console.log(req.headers);
  next(); // Move to the next middleware or route
});

// --- Route Handlers ---

// Handle requests to /fetch using randomDataRouter
app.use("/fetch", randomDataRouter);

// Handle requests to /v1/users using userRouter
app.use("/v1/users", userRouter);

// Handle requests to /links using linkRouter
app.use("/links", linkRouter);

// Serve a static HTML form file for the given ID parameter
app.get("/form/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "form.html")); // Send the HTML file to the client
});

// Export the app instance to be used in the server.js or main entry point
module.exports = app;
