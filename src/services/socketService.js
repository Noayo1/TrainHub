// src/services/socketService.js
// Socket.io connection manager for TrainHub
// Manages WebSocket connection to your backend

import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.io server
   */
  connect(userId, userName) {
    if (this.socket?.connected) {
      console.log("✅ Already connected to chat server");
      return this.socket;
    }

    console.log("🔌 Connecting to chat server...");

    // Connect to your backend - CHANGE PORT IF NEEDED!
    this.socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Setup connection handlers
    this.socket.on("connect", () => {
      console.log("✅ Connected to chat server");
      this.socket.emit("user-connected", userId);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from chat server");
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
    });

    return this.socket;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting from chat server...");
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Send a message
   */
  sendMessage(messageData) {
    if (!this.socket || !this.socket.connected) {
      console.error("❌ Cannot send message: Socket not connected");
      return;
    }
    console.log("📤 Sending message:", messageData);
    this.socket.emit("send-message", messageData);
  }

  /**
   * Listen for incoming messages
   */
  onReceiveMessage(callback) {
    if (!this.socket) return;
    this.socket.on("receive-message", (data) => {
      console.log("📥 Message received:", data);
      callback(data);
    });
    this.listeners.set("receive-message", callback);
  }

  /**
   * Listen for message sent confirmation
   */
  onMessageSent(callback) {
    if (!this.socket) return;
    this.socket.on("message-sent", (data) => {
      console.log("✅ Message sent confirmation:", data);
      callback(data);
    });
    this.listeners.set("message-sent", callback);
  }

  /**
   * Get chat history
   */
  getChatHistory(userId1, userId2, callback) {
    if (!this.socket || !this.socket.connected) {
      console.error("❌ Cannot get history: Socket not connected");
      callback([]);
      return;
    }
    console.log(`📜 Requesting chat history`);
    this.socket.emit("get-chat-history", { userId1, userId2 });
    this.socket.once("chat-history", callback);
  }

  /**
   * Remove event listener
   */
  removeListener(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance

const socketService = new SocketService();
export default socketService;
