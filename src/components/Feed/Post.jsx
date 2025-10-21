// Post.jsx - Updated with clickable author name
// Add this import at the top:
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ⭐ ADD THIS
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
  const navigate = useNavigate(); // ⭐ ADD THIS

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

  // ⭐ ADD THIS FUNCTION
  const handleAuthorClick = () => {
    console.log("Navigating to profile:", post.authorId);
    navigate(`/profile/${post.authorId}`);
  };

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author-info">
          <div 
            className="author-avatar"
            onClick={handleAuthorClick} // ⭐ ADD THIS
            style={{ cursor: "pointer" }} // ⭐ ADD THIS
          >
            {getInitial(post.authorName)}
          </div>
          <div className="author-details">
            <h3 
              className="author-name"
              onClick={handleAuthorClick} // ⭐ ADD THIS
              style={{ 
                cursor: "pointer",
                transition: "color 0.2s ease" 
              }}
              onMouseEnter={(e) => e.target.style.color = "#1da1f2"}
              onMouseLeave={(e) => e.target.style.color = "var(--text-primary)"}
            >
              {post.authorName}
            </h3>
            <span className="post-time">
              {getTimeDifference(post.timestamp)}
            </span>
          </div>
        </div>
        {isOwner && (
          <div className="post-actions-menu">
            <button className="edit-btn" onClick={handleEdit}>
               Edit
            </button>
            <button className="delete-btn" onClick={handleDelete}>
               Delete
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
    <>
      <p>{post.content}</p>
      
      {/* ⭐ ADD THIS - Display Drawing if exists */}
      {post.drawingImage && (
        <div className="post-drawing">
          <img 
            src={post.drawingImage} 
            alt="User drawing" 
            style={{
              width: "100%",
              maxWidth: "600px",
              borderRadius: "var(--radius-md)",
              marginTop: "var(--spacing-md)",
              border: "2px solid var(--border-color)",
              boxShadow: "var(--shadow-md)"
            }}
          />
        </div>
      )}
    </>
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