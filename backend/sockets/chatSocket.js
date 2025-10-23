// backend/sockets/chatSocket.js
// Socket.io Chat Handler - Real-time messaging

const { db } = require("../config/firebase");
const Message = require("../models/chatModel");

// Store active users and their socket IDs
const activeUsers = new Map();

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins with their userId
    socket.on("user-connected", (userId) => {
      activeUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} joined with socket ${socket.id}`);

      // Broadcast to all users that someone connected
      io.emit("user-status", {
        userId,
        status: "online",
        activeUsers: Array.from(activeUsers.keys()),
      });
    });

    // Send a message
    socket.on("send-message", async (data) => {
      try {
        const { senderId, senderName, receiverId, receiverName, message } =
          data;

        // Validate message
        const errors = Message.validate(data);
        if (errors.length > 0) {
          socket.emit("error", { errors });
          return;
        }

        // Create message instance
        const messageRef = db.ref("messages").push();
        const messageData = {
          id: messageRef.key,
          senderId,
          senderName,
          receiverId,
          receiverName,
          message,
          timestamp: Date.now(),
          read: false,
        };

        const newMessage = new Message(messageData);

        // Save to Firebase
        await messageRef.set(newMessage.toJSON());

        // Send to receiver if they're online
        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive-message", newMessage.toJSON());
        }

        // Confirm to sender
        socket.emit("message-sent", newMessage.toJSON());

        console.log(
          `📨 Message from ${senderName} to ${receiverName}: ${message}`
        );
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // User is typing indicator
    socket.on("typing", (data) => {
      const { senderId, receiverId } = data;
      const receiverSocketId = activeUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-typing", { userId: senderId });
      }
    });

    // User stopped typing
    socket.on("stop-typing", (data) => {
      const { senderId, receiverId } = data;
      const receiverSocketId = activeUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-stop-typing", { userId: senderId });
      }
    });

    // Mark message as read
    socket.on("mark-as-read", async (data) => {
      try {
        const { messageId, userId } = data;

        // Update message in database
        await db.ref(`messages/${messageId}`).update({ read: true });

        // Notify sender
        const message = (
          await db.ref(`messages/${messageId}`).once("value")
        ).val();
        if (message) {
          const senderSocketId = activeUsers.get(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit("message-read", {
              messageId,
              readBy: userId,
            });
          }
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // Get chat history between two users
    socket.on("get-chat-history", async (data) => {
      try {
        const { userId1, userId2 } = data;

        // Get all messages between these users
        const snapshot = await db.ref("messages").once("value");
        const allMessages = snapshot.val();

        if (!allMessages) {
          socket.emit("chat-history", []);
          return;
        }

        // Filter messages between these two users
        const chatHistory = Object.values(allMessages).filter(
          (msg) =>
            (msg.senderId === userId1 && msg.receiverId === userId2) ||
            (msg.senderId === userId2 && msg.receiverId === userId1)
        );

        // Sort by timestamp
        chatHistory.sort((a, b) => a.timestamp - b.timestamp);

        socket.emit("chat-history", chatHistory);
      } catch (error) {
        console.error("Error getting chat history:", error);
        socket.emit("error", { message: "Failed to load chat history" });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      // Remove from active users
      let disconnectedUserId = null;
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          activeUsers.delete(userId);
          break;
        }
      }

      // Broadcast to all users that someone disconnected
      if (disconnectedUserId) {
        io.emit("user-status", {
          userId: disconnectedUserId,
          status: "offline",
          activeUsers: Array.from(activeUsers.keys()),
        });
      }
    });
  });
};

module.exports = initializeSocket;
