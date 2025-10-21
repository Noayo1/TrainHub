// ProfileSidebar.jsx
// Responsibility: Display user profile card and "All Users" button

export default function ProfileSidebar({ currentUser }) {
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <aside className="feed-sidebar-right">
      <div className="profile-card">
        <div className="profile-avatar-large">
          {currentUser && getInitial(currentUser.displayName || currentUser.email)}
        </div>
        <h3 className="profile-username">
          @{currentUser?.displayName || currentUser?.email?.split("@")[0]}
        </h3>
        <button className="edit-profile-btn">Edit Profile</button>
      </div>

      <div className="users-section">
        <button className="all-users-btn">ALL USERS</button>
      </div>
    </aside>
  );
}