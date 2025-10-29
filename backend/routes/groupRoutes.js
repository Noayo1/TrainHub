const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

router.post("/", groupController.createGroup);
router.get("/:groupId", groupController.getGroupById);
router.get("/", groupController.getAllGroups);
router.put("/:groupId", groupController.updateGroup);
router.delete("/:groupId", groupController.deleteGroup);
router.post("/:groupId/approve/:memberId", groupController.approveMember);
router.get("/search/advanced", groupController.searchGroups);

module.exports = router;
