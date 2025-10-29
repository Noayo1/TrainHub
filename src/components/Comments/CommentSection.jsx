import { useState } from "react";
import CommentItem from "./CommentItem";

export default function CommentSection({
  postId,
  comments,
  currentUser,
  onAddComment,
  onDeleteComment,
}) {
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await onAddComment(postId, newComment);
    setNewComment("");
  };

  return (
    <div className="comment-section">
      <button
        className="toggle-comments-btn"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        💬 {comments?.length || 0} Comments {isExpanded ? "▲" : "▼"}
      </button>

      {isExpanded && (
        <div className="comments-container">
          <form onSubmit={handleSubmit} className="new-comment-form">
            <input
              type="text"
              className="comment-input"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="comment-submit-btn">
              Send
            </button>
          </form>

          <div className="comments-list">
            {comments && comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onDeleteComment={onDeleteComment}
                />
              ))
            ) : (
              <p className="no-comments">No comments yet. Be the first!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
