// GroupDetail.jsx - Display specific group with its posts
// Responsibility: PURE DISPLAY COMPONENT (receives data via props)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PostList from "../Feed/PostList";
import "../../styles/GroupDetail.css";

export default function GroupDetail({
  group,
  groupPosts,
  currentUser,
  members,
  loading,

  // Callbacks
  onCreateGroupPost,
  onLikePost,
  onUpdatePost,
  onDeletePost,
  onAddComment,
  onDeleteComment,
  onLeaveGroup,
  onDeleteGroup,
  onBack,
}) {
  const navigate = useNavigate();
  const [newPostContent, setNewPostContent] = useState("");

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      alert("Post content cannot be empty");
      return;
    }

    await onCreateGroupPost(group.id, newPostContent);
    setNewPostContent("");
  };

  const isAdmin = currentUser && group && group.adminId === currentUser.uid;
  const isMember =
    currentUser && group && group.members && group.members[currentUser.uid];

  if (loading) {
    return (
      <div className="group-detail-loading">
        <h2>Loading group...</h2>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-not-found">
        <h2>Group Not Found</h2>
        <p>This group doesn't exist or has been removed.</p>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );
  }

  const memberCount = group.members ? Object.keys(group.members).length : 0;

  return (
    <div className="group-detail-container">
      {/* Back Button */}
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>

      {/* Group Header */}
      <div className="group-header-card">
        <div className="group-cover">
          <div className="group-icon-large">
            {group.isPrivate ? "🔒" : "🌐"}
          </div>
        </div>

        <div className="group-main-info">
          <div className="group-details">
            <h1 className="group-title">{group.name}</h1>
            <p className="group-description">
              {group.description || "No description"}
            </p>

            <div className="group-badges">
              {group.isPrivate && (
                <span className="badge-private">🔒 Private Group</span>
              )}
              {!group.isPrivate && (
                <span className="badge-public">🌐 Public Group</span>
              )}
              {isAdmin && <span className="badge-admin">👑 Admin</span>}
              {isMember && !isAdmin && (
                <span className="badge-member">✓ Member</span>
              )}
            </div>
          </div>

          {/* Group Actions */}
          <div className="group-actions">
            {isAdmin && (
              <button
                className="btn-delete-group"
                onClick={() => onDeleteGroup(group.id)}
              >
                🗑️ Delete Group
              </button>
            )}
            {isMember && !isAdmin && (
              <button
                className="btn-leave-group"
                onClick={() => onLeaveGroup(group.id)}
              >
                Leave Group
              </button>
            )}
          </div>
        </div>

        {/* Group Stats */}
        <div className="group-stats">
          <div className="stat-item">
            <span className="stat-number">{memberCount}</span>
            <span className="stat-label">Members</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{groupPosts.length}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {new Date(group.createdAt).toLocaleDateString()}
            </span>
            <span className="stat-label">Created</span>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="group-members-section">
        <h3>Members ({memberCount})</h3>
        <div className="members-list">
          {members.map((member) => (
            <div
              key={member.id}
              className="member-item"
              onClick={() => navigate(`/profile/${member.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="member-avatar">
                {getInitial(member.displayName || member.email)}
              </div>
              <div className="member-info">
                <span className="member-name">
                  {member.displayName || member.email?.split("@")[0]}
                </span>
                {member.id === group.adminId && (
                  <span className="member-role">👑 Admin</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Post Section (Only for members) */}
      {isMember && (
        <div className="group-post-form-card">
          <h2>Share in {group.name}</h2>
          <form onSubmit={handleSubmitPost} className="group-post-form">
            <textarea
              className="group-post-textarea"
              placeholder="What's on your mind? Share with the group..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows="4"
            />
            <button type="submit" className="group-post-button">
              Post to Group
            </button>
          </form>
        </div>
      )}

      {/* Group Posts Section */}
      <div className="group-posts-section">
        <h2>Group Posts</h2>

        {!isMember ? (
          <div className="not-member-message">
            <p>🔒 You must be a member to view and post in this group.</p>
          </div>
        ) : groupPosts.length === 0 ? (
          <div className="no-posts-message">
            <p>No posts in this group yet. Be the first to share!</p>
          </div>
        ) : (
          <PostList
            posts={groupPosts}
            currentUser={currentUser}
            onLikePost={onLikePost}
            onUpdatePost={onUpdatePost}
            onDeletePost={onDeletePost}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
          />
        )}
      </div>
    </div>
  );
}
