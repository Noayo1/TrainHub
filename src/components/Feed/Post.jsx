// Post.jsx - COMPLETE with Firebase Storage Support
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CommentSection from "../Comments/CommentSection";

export default function Post({
  post,
  currentUser,
  onLikePost,
  onUpdatePost,
  onDeletePost,
  onAddComment,
  onDeleteComment,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const navigate = useNavigate();

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
    ? Object.keys(post.comments).map((key) => ({
        id: key,
        postId: post.id,
        ...post.comments[key],
      }))
    : [];

  const handleAuthorClick = () => {
    console.log("Navigating to profile:", post.authorId);
    navigate(`/profile/${post.authorId}`);
  };

  // ✅ Check for media
  const hasImages =
    post.imageUrls &&
    Array.isArray(post.imageUrls) &&
    post.imageUrls.length > 0;
  const hasVideo = post.videoUrl && post.videoUrl.trim() !== "";
  const hasDrawing = post.drawingImage;

  console.log("📷 Post media check:", {
    postId: post.id,
    hasImages,
    hasVideo,
    hasDrawing,
    imageUrls: post.imageUrls,
    videoUrl: post.videoUrl,
  });

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author-info">
          <div
            className="author-avatar"
            onClick={handleAuthorClick}
            style={{ cursor: "pointer" }}
          >
            {getInitial(post.authorName)}
          </div>
          <div className="author-details">
            <h3
              className="author-name"
              onClick={handleAuthorClick}
              style={{
                cursor: "pointer",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#1da1f2")}
              onMouseLeave={(e) =>
                (e.target.style.color = "var(--text-primary)")
              }
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
          <>
            {/* Text Content */}
            {post.content && post.content.trim() && <p>{post.content}</p>}

            {/* Canvas Drawing */}
            {hasDrawing && (
              <div
                className="post-drawing"
                style={{ marginTop: post.content ? "var(--spacing-md)" : "0" }}
              >
                <img
                  src={post.drawingImage}
                  alt="User drawing"
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--border-color)",
                    boxShadow: "var(--shadow-md)",
                  }}
                />
              </div>
            )}

            {/* ✅ FIREBASE STORAGE IMAGES */}
            {hasImages && (
              <div
                className={`post-images-grid ${
                  post.imageUrls.length === 1
                    ? "single"
                    : post.imageUrls.length === 2
                    ? "two"
                    : ""
                }`}
                style={{
                  marginTop:
                    post.content || hasDrawing ? "var(--spacing-md)" : "0",
                }}
              >
                {post.imageUrls.slice(0, 4).map((imageUrl, index) => (
                  <div
                    key={index}
                    className="post-image-item"
                    onClick={() => setSelectedImageIndex(index)}
                    style={{ cursor: "pointer" }}
                  >
                    <img
                      src={imageUrl}
                      alt={`Post image ${index + 1}`}
                      className="post-grid-image"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {post.imageUrls.length > 4 && index === 3 && (
                      <div
                        className="more-images-overlay"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "rgba(0, 0, 0, 0.7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "32px",
                          fontWeight: "bold",
                        }}
                      >
                        +{post.imageUrls.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ✅ FIREBASE STORAGE VIDEO */}
            {hasVideo && (
              <div
                className="post-media"
                style={{
                  marginTop:
                    post.content || hasDrawing || hasImages
                      ? "var(--spacing-md)"
                      : "0",
                }}
              >
                <video
                  src={post.videoUrl}
                  controls
                  className="post-video"
                  preload="metadata"
                  style={{
                    width: "100%",
                    maxHeight: "500px",
                    display: "block",
                    background: "black",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  Your browser does not support the video tag.
                </video>
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

      {/* Image Lightbox/Modal */}
      {selectedImageIndex !== null && hasImages && (
        <div
          className="image-modal"
          onClick={() => setSelectedImageIndex(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.95)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            <button
              onClick={() => setSelectedImageIndex(null)}
              style={{
                position: "absolute",
                top: "-50px",
                right: "0",
                width: "40px",
                height: "40px",
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                fontSize: "24px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              ✕
            </button>
            <img
              src={post.imageUrls[selectedImageIndex]}
              alt={`Full size ${selectedImageIndex + 1}`}
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-40px",
                left: "50%",
                transform: "translateX(-50%)",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                background: "rgba(0, 0, 0, 0.5)",
                padding: "8px 16px",
                borderRadius: "20px",
              }}
            >
              {selectedImageIndex + 1} / {post.imageUrls.length}
            </div>
            {selectedImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(selectedImageIndex - 1);
                }}
                style={{
                  position: "absolute",
                  left: "-70px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "50px",
                  height: "50px",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  fontSize: "32px",
                  cursor: "pointer",
                }}
              >
                ‹
              </button>
            )}
            {selectedImageIndex < post.imageUrls.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(selectedImageIndex + 1);
                }}
                style={{
                  position: "absolute",
                  right: "-70px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "50px",
                  height: "50px",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  fontSize: "32px",
                  cursor: "pointer",
                }}
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
