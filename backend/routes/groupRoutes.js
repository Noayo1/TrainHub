// backend/routes/groupRoutes.js
// Group Routes - Define all group-related API endpoints

const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

// CREATE - Create a new group
// POST /api/groups
router.post("/", groupController.createGroup);

// READ - Get group by ID
// GET /api/groups/:groupId?userId=123
router.get("/:groupId", groupController.getGroupById);

// READ - Get all groups (with optional filters)
// GET /api/groups?userId=123&isPrivate=false&search=fitness
router.get("/", groupController.getAllGroups);

// UPDATE - Update group information (admin only)
// PUT /api/groups/:groupId?userId=123
router.put("/:groupId", groupController.updateGroup);

// DELETE - Delete a group (admin only)
// DELETE /api/groups/:groupId?userId=123
router.delete("/:groupId", groupController.deleteGroup);

// APPROVE MEMBER - Admin approves pending member
// POST /api/groups/:groupId/approve/:memberId?userId=adminId
router.post("/:groupId/approve/:memberId", groupController.approveMember);

// SEARCH - Advanced search with multiple parameters
// GET /api/groups/search?name=fitness&adminId=123&memberCount=5&isPrivate=false&hasDescription=true
router.get("/search/advanced", groupController.searchGroups);

module.exports = router;
