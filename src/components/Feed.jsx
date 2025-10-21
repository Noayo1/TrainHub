// Feed.jsx (Refactored with Callbacks)
// Responsibility: Container that manages data and passes callbacks down

import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { getDatabase, ref, onValue, push, update, remove } from "firebase/database";
import Sidebar from "./Sidebar";
import CreatePost from "./CreatePost";
import PostList from "./PostList";
import ProfileSidebar from "./ProfileSidebar";
import "../styles/Feed.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    setCurrentUser(user);

    const db = getDatabase();
    const postsRef = ref(db, "posts");

    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        postsArray.sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Centralized Firebase operations with callbacks
  const handleCreatePost = async (content) => {
    if (!content.trim()) return;

    const db = getDatabase();
    const postsRef = ref(db, "posts");

    const newPost = {
      content: content,
      authorId: currentUser.uid,
      authorEmail: currentUser.email,
      authorName: currentUser.displayName || currentUser.email.split("@")[0],
      timestamp: Date.now(),
      likes: 0,
      likedBy: {},
      comments: 0,
    };

    try {
      await push(postsRef, newPost);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    }
  };

  const handleLikePost = async (postId, currentLikes, likedBy) => {
    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);
    
    const hasLiked = likedBy && likedBy[currentUser.uid];

    try {
      if (hasLiked) {
        const updatedLikedBy = { ...likedBy };
        delete updatedLikedBy[currentUser.uid];
        await update(postRef, {
          likes: currentLikes - 1,
          likedBy: updatedLikedBy,
        });
      } else {
        await update(postRef, {
          likes: currentLikes + 1,
          likedBy: { ...likedBy, [currentUser.uid]: true },
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleUpdatePost = async (postId, newContent) => {
    if (!newContent.trim()) return;

    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);

    try {
      await update(postRef, { content: newContent });
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);

    try {
      await remove(postRef);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  return (
    <div className="feed-container">
      <Sidebar />

      <main className="feed-main">
        {/* ✅ Pass callback instead of letting component access Firebase */}
        <CreatePost 
          currentUser={currentUser} 
          onCreatePost={handleCreatePost}
        />
        
        {/* ✅ Pass all callbacks down */}
        <PostList 
          posts={posts} 
          currentUser={currentUser}
          onLikePost={handleLikePost}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
        />
      </main>

      <ProfileSidebar currentUser={currentUser} />
    </div>
  );
}