class Post {
  constructor(data) {
    this.id = data.id || null;
    this.authorId = data.authorId;
    this.authorName = data.authorName;
    this.content = data.content;
    this.mediaUrl = data.mediaUrl || null;
    this.mediaType = data.mediaType || null;
    this.groupId = data.groupId || null;
    this.comments = data.comments || {};
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = Date.now();
  }
  toJSON() {
    return {
      id: this.id,
      authorId: this.authorId,
      authorName: this.authorName,
      content: this.content,
      mediaUrl: this.mediaUrl,
      mediaType: this.mediaType,
      groupId: this.groupId,
      likes: this.likes,
      comments: this.comments,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static validate(data) {
    const errors = [];

    if (!data.authorId) {
      errors.push("Author ID is required");
    }
    if (!data.content || data.content.trim().length === 0) {
      errors.push("Post content is required");
    }
    if (data.content && data.content.length > 5000) {
      errors.push("Post content is too long (max 5000 characters)");
    }
    return errors;
  }
}

module.exports = Post;
