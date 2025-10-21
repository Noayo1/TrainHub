// CommentItem.jsx - Updated with clickable commenter name
import { useNavigate } from "react-router-dom"; 

export default function CommentItem({ comment, currentUser, onDeleteComment }) {
  const navigate = useNavigate();
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const getTimeDifference = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const isOwner = currentUser && currentUser.uid === comment.authorId;
  const handleAuthorClick = () => {
    console.log("Navigating to commenter profile:", comment.authorId);
    navigate(`/profile/${comment.authorId}`);
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <div className="comment-author-info">
          <div 
            className="comment-avatar"
            onClick={handleAuthorClick} 
            style={{ cursor: "pointer" }} 
          >
            {getInitial(comment.authorName)}
          </div>
          <div className="comment-details">
            <span 
              className="comment-author-name"
              onClick={handleAuthorClick}
              style={{ 
                cursor: "pointer",
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.color = "#1da1f2"}
              onMouseLeave={(e) => e.target.style.color = "var(--text-primary)"}
            >
              {comment.authorName}
            </span>
            <span className="comment-time">
              {getTimeDifference(comment.timestamp)}
            </span>
          </div>
        </div>
        {isOwner && (
          <button
            className="delete-comment-btn"
            onClick={() => onDeleteComment(comment.postId, comment.id)}
            title="Delete comment"
          >
            delete
          </button>
        )}
      </div>
      <p className="comment-text">{comment.text}</p>
    </div>
  );
}