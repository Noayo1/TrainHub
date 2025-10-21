import { useState } from "react";
import { auth } from "./firebase";
import { Input, Button } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import "../styles/SignIn.css";

export default function SignIn({ onUserLoggedIn, onSwitchToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onUserLoggedIn(userCredential.user);
    } catch (err) {
      console.log(err);
      if (err.code === "auth/user-not-found") {
        setError("No user found with this email address.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="signin-wrapper">
      <div className="signin-container">
        <h1>SPORTBOOK</h1>

        <form onSubmit={handleSignIn}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            disableUnderline
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            disableUnderline
          />

          {/* הצגת שגיאה */}
          {error && <p className="error-text">{error}</p>}

          <Button type="submit" variant="contained" fullWidth>
            Sign In
          </Button>
        </form>

        <p>
          Don't have an account?{" "}
          <Button type="button" onClick={onSwitchToSignUp}>
            Sign Up
          </Button>
        </p>
      </div>
    </div>
  );
}
