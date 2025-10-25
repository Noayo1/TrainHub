// UserProfile.jsx - WITH COVER PHOTO (Original Design Restored)
// Responsibility: PURE DISPLAY COMPONENT
// Receives ALL data via props, calls parent via callbacks

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PostList from "../Feed/PostList";
import EditProfileModal from "./EditProfileModal";
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
  onToggleChat,
  onUpdateProfile,
  onBack,
}) {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);

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
      month: "long",
    });
  };

  const formatLifeStatus = (status) => {
    const statusMap = {
      single: "Single",
      "in-relationship": "In a Relationship",
      divorced: "Divorced",
      widowed: "Widowed",
    };
    return statusMap[status] || status;
  };

  const formatActivityLevel = (level) => {
    const levelMap = {
      beginner: "Beginner",
      amateur: "Amateur",
      professional: "Professional",
    };
    return levelMap[level] || level;
  };

  const handleFriendAction = () => {
    const status = getFriendStatus();

    if (status === "friends") {
      onRemoveFriend(profileUser.id);
    } else if (status === "none") {
      onSendFriendRequest(profileUser.id);
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = (updates) => {
    onUpdateProfile(updates);
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
        <button onClick={() => navigate("/")}>Back to Home</button>
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

      {/* ✅ Profile Header WITH COVER PHOTO (Restored) */}
      <div className="profile-header-card">
        {/* ✅ Cover Photo - RESTORED */}
        <div className="profile-cover-photo" />

        <div className="profile-main-info">
          {/* ✅ Profile Picture or Default Avatar */}
          {profileUser.profilePictureUrl ? (
            <img
              src={profileUser.profilePictureUrl}
              alt="Profile"
              className="profile-avatar-xl-image"
            />
          ) : (
            <div className="profile-avatar-xl">
              {getInitial(profileUser.displayName || profileUser.email)}
            </div>
          )}

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
                  <>
                    <button
                      className="remove-friend-btn"
                      onClick={handleFriendAction}
                    >
                      Remove Friend
                    </button>

                    <button
                      className="message-friend-btn"
                      onClick={() => onToggleChat(profileUser.id)}
                    >
                      💬 Send Message
                    </button>
                  </>
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
              <button className="btn-edit-profile" onClick={handleEditProfile}>
                Edit Profile
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
              {profileUser.friends
                ? Object.keys(profileUser.friends).length
                : 0}
            </span>
            <span className="stat-label">Friends</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {getJoinDate(profileUser.createdAt)}
            </span>
            <span className="stat-label">Joined</span>
          </div>
        </div>

        {/* Additional Profile Info - Sports & Personal Details */}
        {(profileUser.favoriteSport ||
          profileUser.activityLevel ||
          profileUser.lifeStatus ||
          profileUser.workoutType ||
          profileUser.favoriteTeam ||
          profileUser.fitnessGoal) && (
          <div className="profile-additional-info">
            <h3>About</h3>
            <div className="info-grid">
              {profileUser.lifeStatus && (
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">
                    {formatLifeStatus(profileUser.lifeStatus)}
                  </span>
                </div>
              )}
              {profileUser.dateOfBirth && (
                <div className="info-item">
                  <span className="info-label">🎂 Birthday:</span>
                  <span className="info-value">
                    {new Date(profileUser.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              )}
              {profileUser.favoriteSport && (
                <div className="info-item">
                  <span className="info-label">Favorite Sport:</span>
                  <span className="info-value">
                    {profileUser.favoriteSport}
                  </span>
                </div>
              )}
              {profileUser.activityLevel && (
                <div className="info-item">
                  <span className="info-label">Activity Level:</span>
                  <span className="info-value">
                    {formatActivityLevel(profileUser.activityLevel)}
                  </span>
                </div>
              )}
              {profileUser.workoutType && (
                <div className="info-item">
                  <span className="info-label">Workout Type:</span>
                  <span className="info-value">{profileUser.workoutType}</span>
                </div>
              )}
              {profileUser.favoriteTeam && (
                <div className="info-item">
                  <span className="info-label">Favorite Team:</span>
                  <span className="info-value">{profileUser.favoriteTeam}</span>
                </div>
              )}
            </div>
            {profileUser.fitnessGoal && (
              <div className="fitness-goal-section">
                <span className="info-label"> Fitness Goal:</span>
                <p className="fitness-goal-text">{profileUser.fitnessGoal}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Posts Section */}
      <div className="profile-content">
        <div className="profile-posts-section">
          <h2 style={{ marginBottom: "20px" }}>
            {isOwnProfile
              ? "Your Posts"
              : `${profileUser.displayName || "User"}'s Posts`}
          </h2>

          {userPosts.length === 0 ? (
            <div className="no-posts-message">
              <p>
                {isOwnProfile
                  ? "You haven't posted anything yet."
                  : "This user hasn't posted anything yet."}
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

      {/* Edit Profile Modal */}
      {showEditModal && isOwnProfile && (
        <EditProfileModal
          currentUser={currentUser}
          profileData={profileUser}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
