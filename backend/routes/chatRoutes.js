// backend/routes/chatRoutes.js
// Chat Routes - Define all chat-related API endpoints

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// Get chat history between two users
// GET /api/chat/history/:userId1/:userId2
router.get("/history/:userId1/:userId2", chatController.getChatHistory);

// Get all conversations for a user
// GET /api/chat/conversations/:userId
router.get("/conversations/:userId", chatController.getUserConversations);

// Mark messages as read
// PUT /api/chat/read/:userId/:partnerId
router.put("/read/:userId/:partnerId", chatController.markMessagesAsRead);

// Delete a message
// DELETE /api/chat/message/:messageId?userId=xxx
router.delete("/message/:messageId", chatController.deleteMessage);

module.exports = router;
