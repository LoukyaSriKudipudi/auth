const express = require("express");
const linkController = require("../controller/linksController");

const router = express.Router();

router.post("/:id/response", linkController.submitResponse);
router.post("/create", linkController.protect, linkController.createLink);
router.get("/getLinks", linkController.protect, linkController.getAllLinks);

module.exports = router;
