const Link = require("../models/linkModel");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ status: "fail", message: "Not logged in" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res
        .status(401)
        .json({ status: "fail", message: "User no longer exists" });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ status: "fail", message: "Invalid or expired token" });
  }
};

exports.createLink = async (req, res) => {
  try {
    const link = await Link.create({ ownerId: req.user._id });
    const linkUrl = `${req.protocol}://${req.get("host")}/form/${link._id}`;

    res.json({ status: "success", linkUrl });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.submitResponse = async (req, res) => {
  try {
    if (!req.body.text || req.body.text.trim() === "") {
      throw new Error("Response text cannot be empty");
    }

    const link = await Link.findById(req.params.id);
    if (!link) throw new Error("Invalid link");

    link.responses.push({ text: req.body.text });
    await link.save();

    res.json({ status: "success", message: "Response saved" });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getAllLinks = async (req, res) => {
  try {
    const links = await Link.find({ ownerId: req.user._id }).populate(
      "ownerId",
      "name email"
    );

    res.json({ status: "success", links });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
