// backend/models/groupModel.js
// Group Model - Defines group data structure and validation

const { db } = require("../config/firebase");

class Group {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.description = data.description || "";
    this.adminId = data.adminId; // Creator/admin of the group
    this.members = data.members || {}; // { userId: true }
    this.pendingMembers = data.pendingMembers || {}; // { userId: true }
    this.isPrivate = data.isPrivate || false;
    this.posts = data.posts || {};
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = Date.now();
  }

  // Convert to plain object for database
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      adminId: this.adminId,
      members: this.members,
      pendingMembers: this.pendingMembers,
      isPrivate: this.isPrivate,
      posts: this.posts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Validation
  static validate(data) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Group name is required");
    }

    if (data.name && data.name.length > 100) {
      errors.push("Group name is too long (max 100 characters)");
    }

    if (!data.adminId) {
      errors.push("Admin ID is required");
    }

    if (data.description && data.description.length > 500) {
      errors.push("Description is too long (max 500 characters)");
    }

    return errors;
  }
}

module.exports = Group;
