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
import "../styles/Dashboard.css";

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
      <div className="dashboard-loading">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      {user ? (
        <div>
          <div className="dashboard-header">
            <h2 className="dashboard-logo" onClick={() => navigate("/")}>
              TrainHub
            </h2>
            <div className="dashboard-user-section">
              <span className="dashboard-welcome">
                Welcome, {user.displayName || user.email}!
              </span>
              <button onClick={handleSignOut} className="dashboard-signout-btn">
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
            <SignIn onSwitchToSignUp={() => setShowSignUp(true)} />
          )}
        </div>
      )}
    </div>
  );
}
