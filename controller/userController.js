// Import built-in util.promisify for converting callback-based functions to promises
const { promisify } = require("util");

// Import User model for interacting with MongoDB
const User = require("../models/userModel");

// Import JWT for creating and verifying tokens
const jwt = require("jsonwebtoken");

// Import email sending utility
const sendEmail = require("../utils/email");

// Import crypto for generating secure random tokens
const crypto = require("crypto");

// Unused import — likely accidental
const { all } = require("../routes/userRoutes");

// Helper function to create JWT token for a given user ID
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN, // Example: '90d'
  });
};

// -----------------------
// Controller: Get User by ID
// -----------------------
exports.getUserDetails = async (req, res) => {
  const id = req.params.id; // Extract ID from URL params
  const user = await User.findById(id); // Find user in DB
  res.status(200).json({
    status: "success",
    data: user,
  });
};

// -----------------------
// Controller: Get All Users
// -----------------------
exports.getAllUsers = async (req, res) => {
  const users = await User.find(); // Fetch all users from DB

  res.status(200).json({
    status: "success",
    length: users.length,
    data: {
      users,
    },
  });
};

// -----------------------
// Controller: Signup
// -----------------------
exports.signup = async (req, res) => {
  try {
    // Create new user in DB
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });

    // Create JWT token for newly created user
    const token = signToken(newUser._id);

    // Cookie options for sending JWT to browser
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // Convert days to ms
      ),
      httpOnly: true, // Cookie not accessible via JS
    };

    // In production, send cookie over HTTPS only
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    // Send cookie to client
    res.cookie("jwt", token, cookieOptions);

    // Remove password field from output
    newUser.password = undefined;

    // Send response
    res.status(201).json({
      token,
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    // Handle validation or DB errors
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// -----------------------
// Controller: Login
// -----------------------
exports.login = async (req, res, next) => {
  const { email, password } = req.body; // Extract email and password from request

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide email and password",
    });
  }

  // Find user by email and explicitly select password and active status
  const user = await User.findOne({ email: email }).select("+password +active");

  // Check if user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: "fail",
      message: "Incorrect email or password",
    });
  }

  // If account was inactive, reactivate it
  if (user.active === false) {
    user.active = true;
    await user.save({ validateBeforeSave: false }); // Save without running validations
  }

  // Generate JWT token for authenticated user
  const token = signToken(user._id);

  // Send response
  res.status(200).json({
    status: "success",
    data: user,
    token,
  });
};
const { promisify } = require("util"); // Converts callback-based functions to promise-based
const User = require("../models/userModel"); // User model for DB operations
const jwt = require("jsonwebtoken"); // For creating and verifying JWT tokens
const sendEmail = require("../utils/email"); // Utility for sending emails
const crypto = require("crypto"); // For generating secure random tokens

// Helper function to sign a JWT token with the user's ID
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// ==============================
// USER CRUD CONTROLLERS
// ==============================

// Get a single user's details by ID
exports.getUserDetails = async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id);
  res.status(200).json({
    status: "success",
    data: user,
  });
};

// Get all users
exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    length: users.length,
    data: { users },
  });
};

// ==============================
// AUTHENTICATION
// ==============================

// Signup a new user
exports.signup = async (req, res) => {
  try {
    // Create a new user in the DB
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });

    // Generate JWT token
    const token = signToken(newUser._id);

    // Set cookie options for token
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true, // Cannot be accessed by JS on client
    };

    if (process.env.NODE_ENV === "produciton") cookieOptions.secure = true; // Only send over HTTPS

    // Send cookie
    res.cookie("jwt", token, cookieOptions);

    // Hide password from response
    newUser.password = undefined;

    res.status(201).json({
      token,
      status: "success",
      data: { user: newUser },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide email and password",
    });
  }

  // 2. Find user by email and include password and active status
  const user = await User.findOne({ email: email }).select("+password +active");

  // 3. Check if credentials are correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: "fail",
      message: "Incorrect email or password",
    });
  }

  // 4. Reactivate user if marked inactive
  if (user.active === false) {
    user.active = true;
    await user.save({ validateBeforeSave: false });
  }

  // 5. Send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    data: user,
    token,
  });
};

// ==============================
// AUTH MIDDLEWARE
// ==============================

// Protect routes — only logged-in users can access
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Get token from authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. If no token, deny access
    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    // 3. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 4. Check if user exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      });
    }

    // 5. Check if password was changed after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: "fail",
        message: "User recently changed password! Please log in again.",
      });
    }

    // 6. Attach user to request object
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

// Restrict access to specific roles (e.g., admin)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

// ==============================
// PASSWORD MANAGEMENT
// ==============================

// Forgot password: send reset token to email
exports.forgotPassword = async (req, res) => {
  // 1. Find user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "There is no user with this email address",
    });
  }

  // 2. Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Build reset link
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}\nIf you didn't request a password reset, please ignore this email.`;

  // 4. Send email
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    // Rollback token changes if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500).json({
      status: "fail",
      message: "There was an error sending the email. Try again later.",
    });
  }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
  // 1. Hash token and find user with matching token and valid expiry
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+password");

  // 2. If token invalid/expired, return error
  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired.",
    });
  }

  // 3. Set new password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4. Log the user in after resetting password
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
};

// Change password for logged-in user
exports.changePassword = async (req, res) => {
  // 1. Get current user from DB
  const user = await User.findById(req.user.id).select("+password");

  // 2. Verify current password
  const currentPassword = req.body.currentPassword;
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return res.status(401).json({
      status: "fail",
      message: "Your current password is wrong",
    });
  }

  // 3. Set new password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // 4. Send new token
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
};

// ==============================
// ACCOUNT MANAGEMENT
// ==============================

// Update only allowed fields of current user
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = async (req, res) => {
  // Prevent password updates here
  if (req.body.password || req.body.passwordConfirm) {
    return res.status(400).json({
      status: "fail",
      message: "This route is not for password updates",
    });
  }

  // Filter body to only include allowed fields
  const filteredBody = filterObj(req.body, "name", "email");

  // Update user in DB
  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    user,
  });
};

// Soft delete current user's account
exports.deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
};

// Delete a user by ID (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};
