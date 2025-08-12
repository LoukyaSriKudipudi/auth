const Link = require("../models/linkModel");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "fail", message: "Not logged in" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  next();
};

exports.createLink = async (req, res) => {
  try {
    const link = await Link.create({ ownerId: req.user._id });
    res.json({
      status: "success",
      linkUrl: `${process.env.APP_URL}/form/${link._id}`,
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.submitResponse = async (req, res) => {
  try {
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
    const links = await Link.find({ ownerId: req.user._id }) // filter here
      .populate("ownerId");

    res.json({ status: "success", links });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
