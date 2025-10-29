const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

router.get("/history/:userId1/:userId2", chatController.getChatHistory);
router.get("/conversations/:userId", chatController.getUserConversations);
router.put("/read/:userId/:partnerId", chatController.markMessagesAsRead);
router.delete("/message/:messageId", chatController.deleteMessage);

module.exports = router;
