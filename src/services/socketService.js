import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(userId) {
    if (this.socket?.connected) {
      console.log("Already connected to chat server");
      return this.socket;
    }

    console.log("Connecting to chat server...");
    this.socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("Connected to chat server");
      this.socket.emit("user-connected", userId);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log("Disconnecting from chat server...");
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  sendMessage(messageData) {
    if (!this.socket || !this.socket.connected) {
      console.error("Cannot send message: Socket not connected");
      return;
    }
    console.log("Sending message:", messageData);
    this.socket.emit("send-message", messageData);
  }

  onReceiveMessage(callback) {
    if (!this.socket) return;
    this.socket.on("receive-message", (data) => {
      console.log("Message received:", data);
      callback(data);
    });
    this.listeners.set("receive-message", callback);
  }

  onMessageSent(callback) {
    if (!this.socket) return;
    this.socket.on("message-sent", (data) => {
      console.log("Message sent confirmation:", data);
      callback(data);
    });
    this.listeners.set("message-sent", callback);
  }

  getChatHistory(userId1, userId2, callback) {
    if (!this.socket || !this.socket.connected) {
      console.error("Cannot get history: Socket not connected");
      callback([]);
      return;
    }
    console.log(`Requesting chat history`);
    this.socket.emit("get-chat-history", { userId1, userId2 });
    this.socket.once("chat-history", callback);
  }

  removeListener(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}
const socketService = new SocketService();
export default socketService;
