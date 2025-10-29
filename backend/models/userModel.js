const { db } = require("../config/firebase");

class User {
  constructor(data) {
    this.uid = data.uid;
    this.email = data.email;
    this.displayName = data.displayName || data.email.split("@")[0];
    this.role = data.role || "user";
    this.friends = data.friends || {};
    this.sentRequests = data.sentRequests || {};
    this.receivedRequests = data.receivedRequests || {};
    this.groups = data.groups || {};
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = Date.now();
  }
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
