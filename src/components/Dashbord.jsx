// Dashboard.jsx (Updated with User Initialization)
// Responsibility: Handle authentication and initialize user data

import { onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";
import SignIn from "./Auth/SignIn";
import SignUp from "./Auth/SignUp";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import Feed from "./Feed/Feed";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Initialize user data in database if not exists
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
        // Create user data if it doesn't exist
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
      alert("User signed out successfully");
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
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            background: "var(--gradient-secondary)",
            borderBottom: "1px solid var(--border-color)"
          }}>
            <h2 style={{ margin: 0, color: "var(--text-primary)" }}>
              SPORTBOOK
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
          <Feed />
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