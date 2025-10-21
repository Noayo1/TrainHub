// CommentItem.jsx
// Responsibility: Display individual comment with delete option

export default function CommentItem({ comment, currentUser, onDeleteComment }) {
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

  return (
    <div className="comment-item">
      <div className="comment-header">
        <div className="comment-author-info">
          <div className="comment-avatar">
            {getInitial(comment.authorName)}
          </div>
          <div className="comment-details">
            <span className="comment-author-name">{comment.authorName}</span>
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
            🗑️
          </button>
        )}
      </div>
      <p className="comment-text">{comment.text}</p>
    </div>
  );
}