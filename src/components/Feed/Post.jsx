// Post.jsx - UPDATED with Profile Picture Support
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, get } from "firebase/database";
import "../../styles/Post.css";

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
  const [editContent, setEditContent] = useState(post.content || "");
  const [commentText, setCommentText] = useState("");
  const [groupInfo, setGroupInfo] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [commentAuthors, setCommentAuthors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (post.authorId) {
      const db = getDatabase();
      const userRef = ref(db, `users/${post.authorId}`);
      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setAuthorProfile(snapshot.val());
          }
        })
        .catch((error) => {
          console.error("Error loading author profile:", error);
        });
    }
  }, [post.authorId]);

  useEffect(() => {
    if (post.groupId) {
      const db = getDatabase();
      const groupRef = ref(db, `groups/${post.groupId}`);
      get(groupRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setGroupInfo(snapshot.val());
          }
        })
        .catch((error) => {
          console.error("Error loading group info:", error);
        });
    }
  }, [post.groupId]);

  useEffect(() => {
    if (post.comments) {
      const db = getDatabase();
      const commentIds = Object.keys(post.comments);
      const uniqueAuthorIds = [
        ...new Set(commentIds.map((id) => post.comments[id].authorId)),
      ];

      uniqueAuthorIds.forEach((authorId) => {
        if (!commentAuthors[authorId]) {
          const userRef = ref(db, `users/${authorId}`);
          get(userRef)
            .then((snapshot) => {
              if (snapshot.exists()) {
                setCommentAuthors((prev) => ({
                  ...prev,
                  [authorId]: snapshot.val(),
                }));
              }
            })
            .catch((error) => {
              console.error("Error loading comment author profile:", error);
            });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.comments]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(post.content || "");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content || "");
  };

  const handleSaveEdit = async () => {
    if (
      !editContent.trim() &&
      !post.drawingImage &&
      !post.imageUrls &&
      !post.videoUrl
    ) {
      alert("Post cannot be empty");
      return;
    }

    await onUpdatePost(post.id, editContent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDeletePost(post.id);
  };

  const handleLike = () => {
    onLikePost(post.id, post.likes || 0, post.likedBy || {});
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(post.id, commentText);
    setCommentText("");
  };

  const getTimeDifference = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

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

  // Handle group name click
  const handleGroupClick = (e) => {
    e.stopPropagation();
    if (post.groupId) {
      navigate(`/group/${post.groupId}`);
    }
  };

  // Check for media
  const hasImages =
    post.imageUrls &&
    Array.isArray(post.imageUrls) &&
    post.imageUrls.length > 0;
  const hasVideo = post.videoUrl && post.videoUrl.trim() !== "";
  const hasDrawing = post.drawingImage;

  const hasLiked = post.likedBy && post.likedBy[currentUser?.uid];

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author-info">
          <div className="author-avatar" onClick={handleAuthorClick}>
            {authorProfile?.profilePictureUrl ? (
              <img
                src={authorProfile.profilePictureUrl}
                alt={post.authorName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            ) : (
              getInitial(post.authorName)
            )}
          </div>
          <div className="author-details">
            <h3
              className="author-name"
              onClick={handleAuthorClick}
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

            {/* Group info badge */}
            {groupInfo && (
              <div
                className="post-group-badge"
                onClick={handleGroupClick}
                title="Click to view group"
              >
                {groupInfo.isPrivate ? "🔒" : "🌐"} Posted in{" "}
                <span className="group-name-link">{groupInfo.name}</span>
              </div>
            )}
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
          <div className="edit-post-form">
            <textarea
              className="edit-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows="4"
            />
            <div className="edit-actions">
              <button className="save-edit-btn" onClick={handleSaveEdit}>
                ✓ Save
              </button>
              <button className="cancel-edit-btn" onClick={handleCancelEdit}>
                ✕ Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {post.content && <p className="post-text">{post.content}</p>}

            {/* Drawing */}
            {hasDrawing && (
              <div className="post-media-container">
                <img
                  src={post.drawingImage}
                  alt="Canvas drawing"
                  className="post-image"
                />
              </div>
            )}

            {/* Images */}
            {hasImages && (
              <div
                className={`post-media-container ${
                  post.imageUrls.length === 1
                    ? "single-image"
                    : "multiple-images"
                }`}
              >
                {post.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Post content ${index + 1}`}
                    className="post-image"
                  />
                ))}
              </div>
            )}

            {/* Video */}
            {hasVideo && (
              <div className="post-media-container">
                <video className="post-video" controls>
                  <source src={post.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button
          className={`like-btn ${hasLiked ? "liked" : ""}`}
          onClick={handleLike}
        >
          {hasLiked ? "❤️" : "🤍"} {post.likes || 0}
        </button>
        <span className="comment-count">
          💬 {commentsArray.length} comment
          {commentsArray.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        {commentsArray.map((comment) => {
          const commentAuthor = commentAuthors[comment.authorId];

          return (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {commentAuthor?.profilePictureUrl ? (
                  <img
                    src={commentAuthor.profilePictureUrl}
                    alt={comment.authorName}
                  />
                ) : (
                  getInitial(comment.authorName)
                )}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.authorName}</span>
                  <span className="comment-time">
                    {getTimeDifference(comment.timestamp)}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
              {currentUser && currentUser.uid === comment.authorId && (
                <button
                  className="delete-comment-btn"
                  onClick={() => onDeleteComment(post.id, comment.id)}
                >
                  🗑️
                </button>
              )}
            </div>
          );
        })}
        <form onSubmit={handleCommentSubmit} className="add-comment-form">
          <div className="comment-input-wrapper">
            <input
              type="text"
              className="comment-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="comment-submit-btn">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
