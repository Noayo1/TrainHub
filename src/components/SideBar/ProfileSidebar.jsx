// ProfileSidebar.jsx - UPDATED with Profile Picture Support
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, onValue } from "firebase/database";

export default function ProfileSidebar({ currentUser }) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null); // ✅ NEW: User profile data

  // ✅ NEW: Load user profile data (including profile picture)
  useEffect(() => {
    if (currentUser?.uid) {
      const db = getDatabase();
      const userRef = ref(db, `users/${currentUser.uid}`);

      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.val());
          console.log(
            "📸 Profile picture loaded:",
            snapshot.val().profilePictureUrl
          );
        }
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const handleProfileClick = () => {
    if (currentUser?.uid) {
      console.log("Navigating to own profile:", currentUser.uid);
      navigate(`/profile/${currentUser.uid}`);
    }
  };

  return (
    <aside className="feed-sidebar-right">
      <div className="profile-card">
        {/* ✅ UPDATED: Show profile picture or default avatar */}
        <div
          className="profile-avatar-large"
          onClick={handleProfileClick}
          style={{ cursor: "pointer", overflow: "hidden" }}
        >
          {userProfile?.profilePictureUrl ? (
            <img
              src={userProfile.profilePictureUrl}
              alt="Profile"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            currentUser &&
            getInitial(currentUser.displayName || currentUser.email)
          )}
        </div>

        <h3
          className="profile-username"
          onClick={handleProfileClick}
          style={{
            cursor: "pointer",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#1da1f2")}
          onMouseLeave={(e) => (e.target.style.color = "var(--text-primary)")}
        >
          @{currentUser?.displayName || currentUser?.email?.split("@")[0]}
        </h3>
      </div>
    </aside>
  );
}
