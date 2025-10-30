const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/", userController.createUser);
router.get("/:userId", userController.getUserById);
router.get("/", userController.getAllUsers);
router.put("/:userId", userController.updateUser);
router.get("/search/advanced", userController.searchUsers);

module.exports = router;
