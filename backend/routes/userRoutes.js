// backend/routes/userRoutes.js
// User Routes - Define all user-related API endpoints

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// CREATE - Create a new user
// POST /api/users
router.post("/", userController.createUser);

// READ - Get user by ID
// GET /api/users/:userId
router.get("/:userId", userController.getUserById);

// READ - Get all users (with optional filters)
// GET /api/users?role=admin&search=john
router.get("/", userController.getAllUsers);

// UPDATE - Update user information
// PUT /api/users/:userId
router.put("/:userId", userController.updateUser);

// DELETE - Delete a user
// DELETE /api/users/:userId
router.delete("/:userId", userController.deleteUser);

// SEARCH - Advanced search with multiple parameters
// GET /api/users/search?displayName=john&email=gmail&role=user&friendsCount=5
router.get("/search/advanced", userController.searchUsers);

module.exports = router;
