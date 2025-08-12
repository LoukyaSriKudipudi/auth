const { promisify } = require("util");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const { all } = require("../routes/userRoutes");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.getUserDetails = async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id);
  res.status(200).json({
    status: "success",
    data: user,
  });
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    length: users.length,
    data: {
      users,
    },
  });
};

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });

    const token = signToken(newUser._id);

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    if (process.env.NODE_ENV === "produciton") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);
    newUser.password = undefined;

    res.status(201).json({
      token,
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: "fail",
      message: "Please provide email and password",
    });
  }

  const user = await User.findOne({ email: email }).select("+password +active");

  if (!user || !(await user.correctPassword(password, user.password))) {
    res.status(401).json({
      status: "fail",
      message: "Incorrect email or passsword",
    });
  }

  if (user.active === false) {
    user.active = true;
    await user.save({ validateBeforeSave: false });
  }

  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    data: user,
    token,
  });
};

exports.protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    // 2. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      });
    }

    // 4. Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: "fail",
        message: "User recently changed password! Please log in again.",
      });
    }

    // 5. Attach user to request
    req.user = currentUser;

    next();
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

exports.forgotPassword = async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "There is no user with this email address",
    });
  }

  // 2) Generate the reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Build the reset URL
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}\nIf you didn't request a password reset, please ignore this email.`;

  // 4) Send it to the user's email
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
    // If email fails, clear token from DB
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500).json({
      status: "fail",
      message: "There was an error sending the email. Try again later.",
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired.",
    });
  }

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
};

exports.changePassword = async (req, res) => {
  const user = await User.findById(req.user.id).select("+password");

  const currentPassword = req.body.currentPassword;
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return res.status(401).json({
      status: "fail",
      message: "your current password is wrong",
    });
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
};

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

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    res.status(400).json({
      status: "fail",
      message: "this route is not for password updates",
    });
  }

  const filteredBody = filterObj(req.body, "name", "email");
  console.log(filteredBody);
  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    user,
  });
};

exports.deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
};
