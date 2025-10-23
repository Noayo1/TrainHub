// backend/controllers/chatController.js
// Chat Controller - Handles chat-related REST API operations

const { db } = require("../config/firebase");
const Message = require("../models/chatModel");

// Get chat history between two users
exports.getChatHistory = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const snapshot = await db.ref("messages").once("value");
    const allMessages = snapshot.val();

    if (!allMessages) {
      return res.status(200).json({ messages: [] });
    }

    // Filter messages between these two users
    let messages = Object.values(allMessages).filter(
      (msg) =>
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
    );

    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);

    res.status(200).json({ messages, count: messages.length });
  } catch (error) {
    console.error("Error getting chat history:", error);
    res
      .status(500)
      .json({ error: "Failed to get chat history", message: error.message });
  }
};

// Get all conversations for a user
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.ref("messages").once("value");
    const allMessages = snapshot.val();

    if (!allMessages) {
      return res.status(200).json({ conversations: [] });
    }

    // Get all messages involving this user
    const userMessages = Object.values(allMessages).filter(
      (msg) => msg.senderId === userId || msg.receiverId === userId
    );

    // Group by conversation partner
    const conversationsMap = new Map();

    userMessages.forEach((msg) => {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partnerName =
        msg.senderId === userId ? msg.receiverName : msg.senderName;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: msg.message,
          lastMessageTime: msg.timestamp,
          unreadCount: 0,
          messages: [],
        });
      }

      const conversation = conversationsMap.get(partnerId);
      conversation.messages.push(msg);

      // Count unread messages
      if (msg.receiverId === userId && !msg.read) {
        conversation.unreadCount++;
      }

      // Update last message if this one is newer
      if (msg.timestamp > conversation.lastMessageTime) {
        conversation.lastMessage = msg.message;
        conversation.lastMessageTime = msg.timestamp;
      }
    });

    // Convert to array and sort by last message time
    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => b.lastMessageTime - a.lastMessageTime
    );

    res.status(200).json({ conversations, count: conversations.length });
  } catch (error) {
    console.error("Error getting user conversations:", error);
    res
      .status(500)
      .json({ error: "Failed to get conversations", message: error.message });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { userId, partnerId } = req.params;

    const snapshot = await db.ref("messages").once("value");
    const allMessages = snapshot.val();

    if (!allMessages) {
      return res.status(200).json({ message: "No messages to mark as read" });
    }

    // Find unread messages from partner to user
    const updates = {};
    Object.entries(allMessages).forEach(([messageId, msg]) => {
      if (
        msg.senderId === partnerId &&
        msg.receiverId === userId &&
        !msg.read
      ) {
        updates[`messages/${messageId}/read`] = true;
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ message: "No unread messages" });
    }

    await db.ref().update(updates);

    res.status(200).json({
      message: "Messages marked as read",
      count: Object.keys(updates).length,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      error: "Failed to mark messages as read",
      message: error.message,
    });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.query;

    const snapshot = await db.ref(`messages/${messageId}`).once("value");
    const message = snapshot.val();

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can delete their message
    if (message.senderId !== userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });
    }

    await db.ref(`messages/${messageId}`).remove();

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res
      .status(500)
      .json({ error: "Failed to delete message", message: error.message });
  }
};
