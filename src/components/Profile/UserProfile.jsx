// UserProfile.jsx - CORRECTED
// Responsibility: PURE DISPLAY COMPONENT (like ExpenseItem)
// Receives ALL data via props, calls parent via callbacks

import { useNavigate } from "react-router-dom";
import PostList from "../Feed/PostList";
import "../../styles/UserProfile.css";

export default function UserProfile({ 
  // Data props (from parent)
  profileUser,
  userPosts,
  currentUser,
  friends,
  sentRequests,
  loading,
  
  // Callback props (to parent)
  onLikePost,
  onUpdatePost,
  onDeletePost,
  onAddComment,
  onDeleteComment,
  onSendFriendRequest,
  onRemoveFriend,
  onBack
}) {
  const navigate = useNavigate();

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const getFriendStatus = () => {
    if (!profileUser || !currentUser) return "none";
    if (profileUser.id === currentUser.uid) return "self";
    if (friends && friends[profileUser.id]) return "friends";
    if (sentRequests && sentRequests[profileUser.id]) return "pending";
    return "none";
  };

  const getJoinDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long" 
    });
  };

  const handleFriendAction = () => {
    const status = getFriendStatus();
    
    if (status === "friends") {
      onRemoveFriend(profileUser.id);
    } else if (status === "none") {
      onSendFriendRequest(profileUser.id);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <h2>Loading profile...</h2>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-not-found">
        <h2>⚠️ User Not Found</h2>
        <p>This user doesn't exist or has been removed.</p>
        <button onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.uid === profileUser.id;
  const friendStatus = getFriendStatus();

  return (
    <div className="user-profile-container">
      {/* Back Button */}
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>

      {/* Profile Header */}
      <div className="profile-header-card">
        <div className="profile-cover-photo" />
        
        <div className="profile-main-info">
          <div className="profile-avatar-xl">
            {getInitial(profileUser.displayName || profileUser.email)}
          </div>
          
          <div className="profile-details">
            <h1 className="profile-display-name">
              {profileUser.displayName || profileUser.email?.split("@")[0]}
            </h1>
            
            <p className="profile-email">{profileUser.email}</p>

            {isOwnProfile && (
              <span className="badge-own-profile">Your Profile</span>
            )}
            {friendStatus === "friends" && (
              <span className="badge-friend">Friend ✓</span>
            )}
            {friendStatus === "pending" && (
              <span className="badge-pending">Request Sent</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            {!isOwnProfile && (
              <>
                {friendStatus === "friends" && (
                  <button 
                    className="btn-remove-friend"
                    onClick={handleFriendAction}
                  >
                    Remove Friend
                  </button>
                )}
                {friendStatus === "none" && (
                  <button 
                    className="btn-add-friend"
                    onClick={handleFriendAction}
                  >
                    + Add Friend
                  </button>
                )}
                {friendStatus === "pending" && (
                  <button className="btn-pending" disabled>
                    Request Sent
                  </button>
                )}
              </>
            )}
            {isOwnProfile && (
              <button 
                className="btn-edit-profile"
                onClick={() => alert("Edit profile coming soon!")}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Stats */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-number">{userPosts.length}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {profileUser.friends ? Object.keys(profileUser.friends).length : 0}
            </span>
            <span className="stat-label">Friends</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{getJoinDate(profileUser.createdAt)}</span>
            <span className="stat-label">Joined</span>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="profile-content">
        <div className="profile-posts-section">
          <h2 style={{ marginBottom: "20px" }}>
            {isOwnProfile ? "Your Posts" : `${profileUser.displayName || "User"}'s Posts`}
          </h2>
          
          {userPosts.length === 0 ? (
            <div className="no-posts-message">
              <p>
                {isOwnProfile 
                  ? "You haven't posted anything yet." 
                  : "This user hasn't posted anything yet."
                }
              </p>
            </div>
          ) : (
            <PostList 
              posts={userPosts} 
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
    </div>
  );
}