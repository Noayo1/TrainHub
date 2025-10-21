// Post.jsx (Updated with Comments Integration)
// Responsibility: Display post UI with comments section

import { useState } from "react";
import CommentSection from "../Comments/CommentSection";

export default function Post({ 
  post, 
  currentUser, 
  onLikePost, 
  onUpdatePost, 
  onDeletePost,
  onAddComment,
  onDeleteComment 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const handleLike = () => {
    onLikePost(post.id, post.likes, post.likedBy);
  };

  const handleDelete = () => {
    onDeletePost(post.id);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    await onUpdatePost(post.id, editContent);
    setIsEditing(false);
    setEditContent("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const getTimeDifference = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const isOwner = currentUser && currentUser.uid === post.authorId;

  // Convert comments object to array
  const commentsArray = post.comments 
    ? Object.keys(post.comments).map(key => ({
        id: key,
        postId: post.id,
        ...post.comments[key]
      }))
    : [];

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author-info">
          <div className="author-avatar">
            {getInitial(post.authorName)}
          </div>
          <div className="author-details">
            <h3 className="author-name">{post.authorName}</h3>
            <span className="post-time">
              {getTimeDifference(post.timestamp)}
            </span>
          </div>
        </div>
        {isOwner && (
          <div className="post-actions-menu">
            <button className="edit-btn" onClick={handleEdit}>
              ✏️ Edit
            </button>
            <button className="delete-btn" onClick={handleDelete}>
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        {isEditing ? (
          <div className="edit-section">
            <textarea
              className="edit-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows="3"
            />
            <div className="edit-actions">
              <button className="save-edit-btn" onClick={handleSaveEdit}>
                Save
              </button>
              <button className="cancel-edit-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p>{post.content}</p>
        )}
      </div>

      {/* Post Footer */}
      <div className="post-footer">
        <button
          className={`like-btn ${
            post.likedBy && post.likedBy[currentUser?.uid] ? "liked" : ""
          }`}
          onClick={handleLike}
        >
          ❤️ {post.likes}
        </button>
      </div>

      {/* Comments Section */}
      <CommentSection
        postId={post.id}
        comments={commentsArray}
        currentUser={currentUser}
        onAddComment={onAddComment}
        onDeleteComment={onDeleteComment}
      />
    </div>
  );
}