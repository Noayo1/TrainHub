// backend/models/chatModel.js
// Chat Model - Defines chat message data structure

const { db } = require("../config/firebase");

class Message {
  constructor(data) {
    this.id = data.id || null;
    this.senderId = data.senderId;
    this.senderName = data.senderName;
    this.receiverId = data.receiverId;
    this.receiverName = data.receiverName;
    this.message = data.message;
    this.timestamp = data.timestamp || Date.now();
    this.read = data.read || false;
  }

  // Convert to plain object for database
  toJSON() {
    return {
      id: this.id,
      senderId: this.senderId,
      senderName: this.senderName,
      receiverId: this.receiverId,
      receiverName: this.receiverName,
      message: this.message,
      timestamp: this.timestamp,
      read: this.read,
    };
  }

  // Validation
  static validate(data) {
    const errors = [];

    if (!data.senderId) {
      errors.push("Sender ID is required");
    }

    if (!data.receiverId) {
      errors.push("Receiver ID is required");
    }

    if (!data.message || data.message.trim().length === 0) {
      errors.push("Message is required");
    }

    if (data.message && data.message.length > 1000) {
      errors.push("Message is too long (max 1000 characters)");
    }

    return errors;
  }
}

module.exports = Message;
