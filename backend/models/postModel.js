const { db } = require("../config/firebase");

class Post {
  constructor(data) {
    this.id = data.id || null;
    this.authorId = data.authorId;

    this.authorName =
      data.authorName || data.authorEmail?.split("@")[0] || "Unknown";
    this.authorEmail = data.authorEmail || null;

    this.content = data.content;

    this.imageUrls = data.imageUrls || null;
    this.videoUrl = data.videoUrl || null;
    this.canvasImage = data.canvasImage || null;

    this.mediaType = data.mediaType || "text";
    this.groupId = data.groupId || null;

    this.likes = data.likes || 0;
    this.likedBy = data.likedBy || {};

    this.comments = data.comments || {};

    this.createdAt = data.createdAt || data.timestamp || Date.now();
    this.timestamp = data.timestamp || data.createdAt || Date.now();

    this.updatedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      authorId: this.authorId,
      authorName: this.authorName,
      authorEmail: this.authorEmail,
      content: this.content,
      imageUrls: this.imageUrls,
      videoUrl: this.videoUrl,
      canvasImage: this.canvasImage,
      mediaType: this.mediaType,
      groupId: this.groupId,
      likes: this.likes,
      likedBy: this.likedBy,
      comments: this.comments,
      createdAt: this.createdAt,
      timestamp: this.timestamp,
      updatedAt: this.updatedAt,
    };
  }

  static validate(data) {
    const errors = [];

    if (!data.authorId) {
      errors.push("Author ID is required");
    }

    if (!data.content || data.content.trim().length === 0) {
      const hasMedia = data.imageUrls || data.videoUrl || data.canvasImage;
      if (!hasMedia) {
        errors.push("Post content or media is required");
      }
    }

    if (data.content && data.content.length > 5000) {
      errors.push("Post content is too long (max 5000 characters)");
    }

    return errors;
  }
}

module.exports = Post;
