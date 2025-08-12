// Import dependencies
const mongoose = require("mongoose");
const validator = require("validator"); // For validating email formats
const bcrypt = require("bcryptjs"); // For hashing passwords
const crypto = require("crypto"); // For generating secure random tokens

// Define User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"], // Name is required
  },
  email: {
    type: String,
    required: [true, "Please provide your email"], // Email is required
    unique: true, // No duplicate emails allowed
    lowercase: true, // Convert to lowercase before saving
    validate: [validator.isEmail, "Please provide a valid email"], // Email format validation
  },
  photo: String, // Optional user profile photo
  role: {
    type: String,
    enum: ["user", "admin"], // Only these roles are allowed
    default: "user", // Default role is user
  },
  password: {
    type: String,
    required: [true, "Please provide a password"], // Password is required
    minlength: 8, // Minimum length is 8 characters
    select: false, // Exclude password from query results by default
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"], // Must confirm password
    validate: {
      // This only works on CREATE and SAVE (not update)
      validator: function (el) {
        return el === this.password; // Check if confirm matches password
      },
      message: "Passwords are not the same",
    },
  },
  passwordChangedAt: Date, // Tracks when the password was last changed
  passwordResetToken: String, // Hashed token for password reset
  passwordResetExpires: Date, // Expiry date for reset token
  active: {
    type: Boolean,
    default: true, // User is active by default
    select: false, // Do not return this field in queries by default
  },
});

// --- Mongoose Middleware ---

// Encrypt password before saving if modified
userSchema.pre("save", async function (next) {
  // Only run if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Remove passwordConfirm field (not stored in DB)
  this.passwordConfirm = undefined;
  next();
});

// Set passwordChangedAt if password is modified
userSchema.pre("save", function (next) {
  // If password not modified or new document, skip
  if (!this.isModified("password") || this.isNew) return next();

  // Set slightly in the past to avoid token timing issues
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// --- Instance Methods ---

// Compare entered password with stored hashed password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password was changed after a given JWT timestamp
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    return JWTTimeStamp < changedTimestamp; // True if password changed after token was issued
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  // Create a random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash the token and store it in DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.passwordResetToken);

  // Return unhashed token to send to user
  return resetToken;
};

// Optional middleware to filter out inactive users in queries
// userSchema.pre(/^find/, function (next) {
//   this.find({ active: { $ne: false } });
//   next();
// });

// Create User model from schema
const User = mongoose.model("User", userSchema);

// Export the model
module.exports = User;
