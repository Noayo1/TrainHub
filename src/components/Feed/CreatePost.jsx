// CreatePost.jsx (Refactored)
// Responsibility: Handle UI for creating posts, delegate data operations via callback

import { useState } from "react";

export default function CreatePost({ currentUser, onCreatePost }) {
  const [newPostContent, setNewPostContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Call parent's callback instead of directly accessing Firebase
    await onCreatePost(newPostContent);
    
    // Clear form after successful submission
    setNewPostContent("");
  };

  return (
    <div className="new-post-card">
      <h2 className="new-post-title">New Post</h2>
      <form onSubmit={handleSubmit} className="new-post-form">
        <textarea
          className="new-post-textarea"
          placeholder="What's on your mind? Share your workout, achievement, or sports tips..."
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          rows="4"
        />
        <button type="submit" className="post-button">
          Post
        </button>
      </form>
    </div>
  );
}