// Dashboard.jsx - FIXED (removed unused imports)
// Responsibility: Authentication and routing

import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { userAPI } from "../services/api";
import socketService from "../services/socketService";
import Feed from "./Feed/Feed";
import ProfileContainer from "./Profile/ProfileContainer";
import GroupContainer from "./groups/GroupContainer";
import SignIn from "./Auth/SignIn";
import SignUp from "./Auth/SignUp";
import FloatingChat from "./Chat/FloatingChat";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const { userId, groupId } = useParams();
  const navigate = useNavigate();
  const viewMode = groupId ? "group" : userId ? "profile" : "feed";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await initializeUserData(currentUser);
        setUser(currentUser);

        socketService.connect(
          currentUser.uid,
          currentUser.displayName || currentUser.email.split("@")[0]
        );
      } else {
        setUser(null);
        socketService.disconnect();
      }
      setLoading(false);
    });

    return () => {
      unsub();
      socketService.disconnect();
    };
  }, []);

  const initializeUserData = async (currentUser) => {
    try {
      const response = await userAPI.getUser(currentUser.uid);

      if (!response.user) {
        await userAPI.createUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName:
            currentUser.displayName || currentUser.email.split("@")[0],
        });
      }
    } catch (error) {
      if (error.message.includes("User not found")) {
        try {
          await userAPI.createUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName:
              currentUser.displayName || currentUser.email.split("@")[0],
          });
        } catch (createError) {
          console.error("Error creating user:", createError);
        }
      } else {
        console.error("Error initializing user data:", error);
      }
    }
  };

  const handleUserLoggedIn = async (loggedInUser) => {
    // onAuthStateChanged listener will handle the rest
  };

  const handleSignOut = async () => {
    try {
      socketService.disconnect();
      await signOut(auth);
      alert("Signed out successfully");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "var(--bg-dark)",
          color: "var(--text-primary)",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      {user ? (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              background: "var(--gradient-secondary)",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "PoppinsBlack, sans-serif",
                fontSize: "24px",
                color: "var(--text-primary)",
                cursor: "pointer",
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
                  transition: "all 0.2s ease",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {viewMode === "feed" && <Feed />}
          {viewMode === "profile" && <ProfileContainer currentUser={user} />}
          {viewMode === "group" && <GroupContainer currentUser={user} />}
          <FloatingChat currentUser={user} />
        </div>
      ) : (
        <div>
          {showSignUp ? (
            <SignUp onSwitchToSignIn={() => setShowSignUp(false)} />
          ) : (
            <SignIn
              onUserLoggedIn={handleUserLoggedIn}
              onSwitchToSignUp={() => setShowSignUp(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
