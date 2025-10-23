// backend/controllers/postController.js
// Post Controller - Handles all post-related operations

const { db } = require("../config/firebase");
const Post = require("../models/postModel");

// CREATE - Create a new post
exports.createPost = async (req, res) => {
  try {
    const postData = req.body;

    // Validate post data
    const errors = Post.validate(postData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Generate unique post ID
    const postRef = db.ref("posts").push();
    postData.id = postRef.key;

    // Create post instance
    const post = new Post(postData);

    // Save to Firebase
    await postRef.set(post.toJSON());

    res.status(201).json({
      message: "Post created successfully",
      post: post.toJSON(),
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res
      .status(500)
      .json({ error: "Failed to create post", message: error.message });
  }
};

// READ - Get post by ID
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const snapshot = await db.ref(`posts/${postId}`).once("value");
    const post = snapshot.val();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error("Error getting post:", error);
    res
      .status(500)
      .json({ error: "Failed to get post", message: error.message });
  }
};

// READ - Get all posts (with optional filters)
exports.getAllPosts = async (req, res) => {
  try {
    const { authorId, groupId, limit } = req.query;

    const snapshot = await db.ref("posts").once("value");
    let posts = snapshot.val();

    if (!posts) {
      return res.status(200).json({ posts: [] });
    }

    // Convert to array
    posts = Object.values(posts);

    // Filter by author
    if (authorId) {
      posts = posts.filter((post) => post.authorId === authorId);
    }

    // Filter by group
    if (groupId) {
      posts = posts.filter((post) => post.groupId === groupId);
    }

    // Sort by date (newest first)
    posts.sort((a, b) => b.createdAt - a.createdAt);

    // Limit results
    if (limit) {
      posts = posts.slice(0, parseInt(limit));
    }

    res.status(200).json({ posts, count: posts.length });
  } catch (error) {
    console.error("Error getting posts:", error);
    res
      .status(500)
      .json({ error: "Failed to get posts", message: error.message });
  }
};

// UPDATE - Update a post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const updates = req.body;
    const { userId } = req.query; // User making the update

    // Check if post exists
    const snapshot = await db.ref(`posts/${postId}`).once("value");
    const post = snapshot.val();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user is the author (only author can edit their posts)
    if (post.authorId !== userId) {
      return res
        .status(403)
        .json({ error: "You can only edit your own posts" });
    }

    // Add updatedAt timestamp
    updates.updatedAt = Date.now();

    // Update post in Firebase
    await db.ref(`posts/${postId}`).update(updates);

    // Get updated post
    const updatedSnapshot = await db.ref(`posts/${postId}`).once("value");
    const updatedPost = updatedSnapshot.val();

    res.status(200).json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res
      .status(500)
      .json({ error: "Failed to update post", message: error.message });
  }
};

// DELETE - Delete a post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query; // User making the deletion

    // Check if post exists
    const snapshot = await db.ref(`posts/${postId}`).once("value");
    const post = snapshot.val();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user is the author (only author can delete their posts)
    if (post.authorId !== userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own posts" });
    }

    // Delete post from Firebase
    await db.ref(`posts/${postId}`).remove();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res
      .status(500)
      .json({ error: "Failed to delete post", message: error.message });
  }
};

// SEARCH - Advanced search with multiple parameters (date range, author, content, mediaType)
exports.searchPosts = async (req, res) => {
  try {
    const { authorId, content, mediaType, startDate, endDate, groupId } =
      req.query;

    const snapshot = await db.ref("posts").once("value");
    let posts = snapshot.val();

    if (!posts) {
      return res.status(200).json({ posts: [], count: 0 });
    }

    // Convert to array
    posts = Object.values(posts);

    // Apply filters
    if (authorId) {
      posts = posts.filter((post) => post.authorId === authorId);
    }

    if (content) {
      posts = posts.filter((post) =>
        post.content.toLowerCase().includes(content.toLowerCase())
      );
    }

    if (mediaType) {
      posts = posts.filter((post) => post.mediaType === mediaType);
    }

    if (groupId) {
      posts = posts.filter((post) => post.groupId === groupId);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate).getTime();
      posts = posts.filter((post) => post.createdAt >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      posts = posts.filter((post) => post.createdAt <= end);
    }

    // Sort by date (newest first)
    posts.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      posts,
      count: posts.length,
      filters: { authorId, content, mediaType, startDate, endDate, groupId },
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    res
      .status(500)
      .json({ error: "Failed to search posts", message: error.message });
  }
};
