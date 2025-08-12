const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  responses: [
    {
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const Link = mongoose.model("Link", linkSchema);

module.exports = Link;
