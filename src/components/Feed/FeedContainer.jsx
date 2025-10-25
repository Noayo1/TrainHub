// FeedContainer.jsx - Complete File with Firebase Storage
import { useState, useEffect } from "react";
import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  remove,
} from "firebase/database";
import Feed from "./Feed";

export default function FeedContainer({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch all posts
  useEffect(() => {
    const db = getDatabase();
    const postsRef = ref(db, "posts");

    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort by timestamp (newest first)
        postsArray.sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch all users
  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setUsers(usersArray);
      } else {
        setUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ CREATE POST - Firebase Storage version with 4 parameters
  const handleCreatePost = async (
    newPostContent,
    drawingImage,
    imageUrls,
    videoUrl
  ) => {
    const db = getDatabase();
    const postsRef = ref(db, "posts");

    try {
      const newPost = {
        content: newPostContent || "", // ✅ Can be empty (optional text)
        drawingImage: drawingImage || null, // ✅ Canvas drawing (Base64)
        imageUrls: imageUrls || null, // ✅ Array of Firebase Storage URLs
        videoUrl: videoUrl || null, // ✅ Single Firebase Storage URL
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email.split("@")[0],
        timestamp: Date.now(),
        likes: 0,
        likedBy: {},
        comments: {},
      };

      console.log("💾 Saving post:", newPost);
      await push(postsRef, newPost);
      console.log("✅ Post created successfully!");
    } catch (error) {
      console.error("❌ Error creating post:", error);
      throw error;
    }
  };

  // UPDATE POST
  const handleUpdatePost = async (postId, newContent) => {
    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);

    try {
      const postSnapshot = await onValue(postRef, (snapshot) => {
        const post = snapshot.val();
        if (post) {
          set(postRef, {
            ...post,
            content: newContent,
            timestamp: Date.now(),
          });
        }
      });
      console.log("✅ Post updated successfully");
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  };

  // DELETE POST
  const handleDeletePost = async (postId) => {
    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);

    try {
      await remove(postRef);
      console.log("✅ Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  };

  // LIKE POST
  const handleLikePost = async (postId, currentLikes, likedBy) => {
    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);

    try {
      const hasLiked = likedBy && likedBy[currentUser.uid];
      const newLikedBy = { ...likedBy };

      if (hasLiked) {
        // Unlike
        delete newLikedBy[currentUser.uid];
        await set(postRef, {
          ...posts.find((p) => p.id === postId),
          likes: Math.max(0, currentLikes - 1),
          likedBy: newLikedBy,
        });
      } else {
        // Like
        newLikedBy[currentUser.uid] = true;
        await set(postRef, {
          ...posts.find((p) => p.id === postId),
          likes: currentLikes + 1,
          likedBy: newLikedBy,
        });
      }
      console.log("✅ Like toggled successfully");
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // ADD COMMENT
  const handleAddComment = async (postId, commentContent) => {
    const db = getDatabase();
    const post = posts.find((p) => p.id === postId);

    if (!post) return;

    try {
      const newComment = {
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email.split("@")[0],
        content: commentContent,
        timestamp: Date.now(),
      };

      const updatedComments = {
        ...(post.comments || {}),
        [Date.now()]: newComment,
      };

      const postRef = ref(db, `posts/${postId}`);
      await set(postRef, {
        ...post,
        comments: updatedComments,
      });
      console.log("✅ Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  // DELETE COMMENT
  const handleDeleteComment = async (postId, commentId) => {
    const db = getDatabase();
    const post = posts.find((p) => p.id === postId);

    if (!post) return;

    try {
      const updatedComments = { ...post.comments };
      delete updatedComments[commentId];

      const postRef = ref(db, `posts/${postId}`);
      await set(postRef, {
        ...post,
        comments: updatedComments,
      });
      console.log("✅ Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <Feed
      currentUser={currentUser}
      posts={posts}
      users={users}
      onCreatePost={handleCreatePost}
      onUpdatePost={handleUpdatePost}
      onDeletePost={handleDeletePost}
      onLikePost={handleLikePost}
      onAddComment={handleAddComment}
      onDeleteComment={handleDeleteComment}
    />
  );
}
