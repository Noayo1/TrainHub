// ProfileSidebar.jsx - Updated with clickable profile name
import { useNavigate } from "react-router-dom"; // ⭐ ADD THIS

export default function ProfileSidebar({ currentUser }) {
  const navigate = useNavigate(); // ⭐ ADD THIS

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  // ⭐ ADD THIS FUNCTION
  const handleProfileClick = () => {
    if (currentUser?.uid) {
      console.log("Navigating to own profile:", currentUser.uid);
      navigate(`/profile/${currentUser.uid}`);
    }
  };

  return (
    <aside className="feed-sidebar-right">
      <div className="profile-card">
        <div 
          className="profile-avatar-large"
          onClick={handleProfileClick} // ⭐ ADD THIS
          style={{ cursor: "pointer" }} // ⭐ ADD THIS
        >
          {currentUser && getInitial(currentUser.displayName || currentUser.email)}
        </div>
        
        <h3 
          className="profile-username"
          onClick={handleProfileClick} // ⭐ ADD THIS
          style={{ 
            cursor: "pointer",
            transition: "color 0.2s ease"
          }}
          onMouseEnter={(e) => e.target.style.color = "#1da1f2"}
          onMouseLeave={(e) => e.target.style.color = "var(--text-primary)"}
        >
          @{currentUser?.displayName || currentUser?.email?.split("@")[0]}
        </h3>
        
      
      </div>
    </aside>
  );
}