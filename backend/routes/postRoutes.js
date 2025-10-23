// backend/routes/postRoutes.js
// Post Routes - Define all post-related API endpoints

const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");

// CREATE - Create a new post
// POST /api/posts
router.post("/", postController.createPost);

// READ - Get post by ID
// GET /api/posts/:postId
router.get("/:postId", postController.getPostById);

// READ - Get all posts (with optional filters)
// GET /api/posts?authorId=123&groupId=456&limit=10
router.get("/", postController.getAllPosts);

// UPDATE - Update a post
// PUT /api/posts/:postId?userId=123
router.put("/:postId", postController.updatePost);

// DELETE - Delete a post
// DELETE /api/posts/:postId?userId=123
router.delete("/:postId", postController.deletePost);

// SEARCH - Advanced search with multiple parameters
// GET /api/posts/search?authorId=123&content=workout&mediaType=video&startDate=2024-01-01&endDate=2024-12-31&groupId=456
router.get("/search/advanced", postController.searchPosts);

module.exports = router;
