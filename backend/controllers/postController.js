const { db } = require("../config/firebase");
const Post = require("../models/postModel");

exports.createPost = async (req, res) => {
  try {
    const postData = req.body;

    const errors = Post.validate(postData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const postRef = db.ref("posts").push();
    postData.id = postRef.key;
    postData.timestamp = Date.now();
    postData.likes = 0;
    postData.likedBy = {};
    postData.comments = {};

    const post = new Post(postData);
    await postRef.set(post.toJSON());

    res.status(201).json({
      message: "Post created successfully",
      post: post.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create post",
      message: error.message,
    });
  }
};

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
    res.status(500).json({
      error: "Failed to get post",
      message: error.message,
    });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { authorId, groupId, limit } = req.query;
    const snapshot = await db.ref("posts").once("value");
    let posts = snapshot.val();

    if (!posts) {
      return res.status(200).json({ posts: [], count: 0 });
    }

    posts = Object.values(posts);

    if (authorId) {
      posts = posts.filter((post) => post.authorId === authorId);
    }

    if (groupId) {
      posts = posts.filter((post) => post.groupId === groupId);
    }

    posts.sort((a, b) => b.createdAt - a.createdAt);

    if (limit) {
      posts = posts.slice(0, parseInt(limit));
    }

    res.status(200).json({
      posts,
      count: posts.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get posts",
      message: error.message,
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const updates = req.body;
    const { userId } = req.query;

    const snapshot = await db.ref(`posts/${postId}`).once("value");
    const post = snapshot.val();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({
        error: "You can only edit your own posts",
      });
    }

    updates.updatedAt = Date.now();
    await db.ref(`posts/${postId}`).update(updates);

    const updatedSnapshot = await db.ref(`posts/${postId}`).once("value");
    const updatedPost = updatedSnapshot.val();

    res.status(200).json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update post",
      message: error.message,
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;

    const snapshot = await db.ref(`posts/${postId}`).once("value");
    const post = snapshot.val();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({
        error: "You can only delete your own posts",
      });
    }

    await db.ref(`posts/${postId}`).remove();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete post",
      message: error.message,
    });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { authorId, content, mediaType, startDate, endDate, groupId } =
      req.query;

    const snapshot = await db.ref("posts").once("value");
    let posts = snapshot.val();

    if (!posts) {
      return res.status(200).json({ posts: [], count: 0 });
    }

    posts = Object.values(posts);

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

    if (startDate) {
      const start = new Date(startDate).getTime();
      posts = posts.filter((post) => post.createdAt >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      posts = posts.filter((post) => post.createdAt <= end);
    }

    if (groupId) {
      posts = posts.filter((post) => post.groupId === groupId);
    }

    posts.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      posts,
      count: posts.length,
      filters: { authorId, content, mediaType, startDate, endDate, groupId },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to search posts",
      message: error.message,
    });
  }
};

module.exports = exports;
