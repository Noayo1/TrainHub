class Group {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.description = data.description || "";
    this.adminId = data.adminId;
    this.adminName = data.adminName;
    this.members = data.members || {};
    this.pendingMembers = data.pendingMembers || {};
    this.posts = data.posts || {};
    this.isPrivate = data.isPrivate || false;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      adminId: this.adminId,
      adminName: this.adminName,
      members: this.members,
      pendingMembers: this.pendingMembers,
      posts: this.posts,
      isPrivate: this.isPrivate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static validate(data) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Group name is required");
    }
    if (data.name && data.name.length > 100) {
      errors.push("Group name is too long (max 100 characters)");
    }
    if (data.description && data.description.length > 500) {
      errors.push("Description is too long (max 500 characters)");
    }
    if (!data.adminId) {
      errors.push("Admin ID is required");
    }
    return errors;
  }
}

module.exports = Group;
