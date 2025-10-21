// Dashboard.jsx - SIMPLIFIED VERSION
// Responsibility: Authentication and routing ONLY (like your lecturer's pattern)
// Each view has its own container that manages data

import { onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import Feed from "./Feed/Feed";
import ProfileContainer from "./Profile/ProfileContainer";
import GroupContainer from "./groups/GroupContainer";
import SignIn from "./Auth/SignIn";
import SignUp from "./Auth/SignUp";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { userId, groupId } = useParams();
  const navigate = useNavigate();
  
  // Determine view mode based on URL
  const viewMode = groupId ? "group" : userId ? "profile" : "feed";

  // Initialize user on auth change
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await initializeUserData(currentUser);
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const initializeUserData = async (currentUser) => {
    const db = getDatabase();
    const userRef = ref(db, `users/${currentUser.uid}`);
    
    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email.split("@")[0],
          createdAt: Date.now(),
          friends: {},
          sentRequests: {},
          receivedRequests: {}
        });
      }
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert("Signed out successfully");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "var(--bg-dark)",
        color: "var(--text-primary)"
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      {user ? (
        <div>
          {/* Top Navigation Bar */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            background: "var(--gradient-secondary)",
            borderBottom: "1px solid var(--border-color)"
          }}>
            <h2 
              style={{ 
                margin: 0,
                fontFamily: "PoppinsBlack, sans-serif",
                fontSize: "24px",
                color: "var(--text-primary)",
                cursor: "pointer"
              }}
              onClick={() => navigate("/")}
            >
              TrainHub
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ color: "var(--text-secondary)" }}>
                Welcome, {user.displayName || user.email}!
              </span>
              <button 
                onClick={handleSignOut}
                style={{
                  padding: "8px 16px",
                  background: "var(--accent-red)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Content - Conditional Rendering */}
          {/* Each view has its own container that manages data */}
          {viewMode === "feed" && <Feed />}
          {viewMode === "profile" && <ProfileContainer currentUser={user} />}
          {viewMode === "group" && <GroupContainer currentUser={user} />}
        </div>
      ) : (
        <div>
          {showSignUp ? (
            <SignUp onSwitchToSignIn={() => setShowSignUp(false)} />
          ) : (
            <SignIn onSwitchToSignUp={() => setShowSignUp(true)} />
          )}
        </div>
      )}
    </div>
  );
}