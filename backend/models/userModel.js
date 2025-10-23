// backend/models/userModel.js
// User Model - Defines user data structure and validation

const { db } = require("../config/firebase");

class User {
  constructor(data) {
    this.uid = data.uid;
    this.email = data.email;
    this.displayName = data.displayName || data.email.split("@")[0];
    this.role = data.role || "user"; // 'user' or 'admin'
    this.friends = data.friends || {};
    this.sentRequests = data.sentRequests || {};
    this.receivedRequests = data.receivedRequests || {};
    this.groups = data.groups || {};
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = Date.now();
  }

  // Convert to plain object for database
  toJSON() {
    return {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      role: this.role,
      friends: this.friends,
      sentRequests: this.sentRequests,
      receivedRequests: this.receivedRequests,
      groups: this.groups,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Validation
  static validate(data) {
    const errors = [];

    if (!data.email || !data.email.includes("@")) {
      errors.push("Valid email is required");
    }

    if (!data.uid) {
      errors.push("User ID is required");
    }

    return errors;
  }
}

module.exports = User;
