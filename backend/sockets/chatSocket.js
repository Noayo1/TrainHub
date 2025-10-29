const { db } = require("../config/firebase");
const Message = require("../models/chatModel");
const activeUsers = new Map();

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("user-connected", (userId) => {
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} joined with socket ${socket.id}`);
      io.emit("user-status", {
        userId,
        status: "online",
        activeUsers: Array.from(activeUsers.keys()),
      });
    });

    socket.on("send-message", async (data) => {
      try {
        const { senderId, senderName, receiverId, receiverName, message } =
          data;
        const errors = Message.validate(data);
        if (errors.length > 0) {
          socket.emit("error", { errors });
          return;
        }

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
        await messageRef.set(newMessage.toJSON());

        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive-message", newMessage.toJSON());
        }
        socket.emit("message-sent", newMessage.toJSON());

        console.log(
          `Message from ${senderName} to ${receiverName}: ${message}`
        );
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });
    socket.on("typing", (data) => {
      const { senderId, receiverId } = data;
      const receiverSocketId = activeUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-typing", { userId: senderId });
      }
    });
    socket.on("stop-typing", (data) => {
      const { senderId, receiverId } = data;
      const receiverSocketId = activeUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-stop-typing", { userId: senderId });
      }
    });
    socket.on("mark-as-read", async (data) => {
      try {
        const { messageId, userId } = data;
        await db.ref(`messages/${messageId}`).update({ read: true });
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
    socket.on("get-chat-history", async (data) => {
      try {
        const { userId1, userId2 } = data;
        const snapshot = await db.ref("messages").once("value");
        const allMessages = snapshot.val();

        if (!allMessages) {
          socket.emit("chat-history", []);
          return;
        }
        const chatHistory = Object.values(allMessages).filter(
          (msg) =>
            (msg.senderId === userId1 && msg.receiverId === userId2) ||
            (msg.senderId === userId2 && msg.receiverId === userId1)
        );
        chatHistory.sort((a, b) => a.timestamp - b.timestamp);

        socket.emit("chat-history", chatHistory);
      } catch (error) {
        console.error("Error getting chat history:", error);
        socket.emit("error", { message: "Failed to load chat history" });
      }
    });
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      let disconnectedUserId = null;
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          activeUsers.delete(userId);
          break;
        }
      }
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
