const express = require("express");
const userController = require("../controller/userController");

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/forgotpassword", userController.forgotPassword);
router.post("/resetpassword/:token", userController.resetPassword);
router.post(
  "/changepassword/",
  userController.protect,
  userController.changePassword
);

router.patch("/updateMe", userController.protect, userController.updateMe);
router.delete("/deleteMe", userController.protect, userController.deleteMe);

router
  .route("/:id")
  .get(userController.getUserDetails)
  .delete(
    userController.protect,
    userController.restrictTo("admin"),
    userController.deleteUser
  );
router.route("/").get(userController.getAllUsers);

module.exports = router;
