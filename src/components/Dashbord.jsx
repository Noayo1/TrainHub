// Dashboard.jsx (Refactored)
// Remove redundant callback since onAuthStateChanged already handles user state

import { onAuthStateChanged, signOut } from "firebase/auth";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import Feed from "./Feed";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    // ✅ This already handles user state automatically
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    alert("User signed out successfully");
  };

  return (
    <div>
      {user ? (
        <div>
          <h3>Welcome, {user.displayName || user.email}!</h3>
          <button onClick={handleSignOut}>Sign Out</button>
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