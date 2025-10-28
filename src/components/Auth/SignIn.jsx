import { useState } from "react";
import { auth } from "../firebase";
import { Input, Button } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import "../../styles/SignIn.css";

export default function SignIn({ onUserLoggedIn, onSwitchToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setError("");
      setEmail("");
      setPassword("");
      onUserLoggedIn(userCredential.user);
    } catch (err) {
      console.error("Login error:", err);

      // Handle specific Firebase auth errors
      if (err.code === "auth/user-not-found") {
        setError("No user found with this email address.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-wrapper">
      <div className="signin-container">
        <h1>TrainHub</h1>

        <form onSubmit={handleSignIn}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(""); // Clear error when user starts typing
            }}
            fullWidth
            disableUnderline
            disabled={loading}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            fullWidth
            disableUnderline
            disabled={loading}
            required
          />

          {error && <p className="error-text">{error}</p>}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !email || !password}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <hr />

        <p>
          Don't have an account?{" "}
          <Button type="button" onClick={onSwitchToSignUp} disabled={loading}>
            Sign Up
          </Button>
        </p>
      </div>
    </div>
  );
}
