import { useState } from "react";
import { auth } from "../firebase";
import { Input, Button } from "@mui/material";
import { createUserWithEmailAndPassword } from "firebase/auth";
import "../../styles/SignUp.css";

export default function SignUp({ onSwitchToSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password)) {
      newErrors.password =
        "Password must contain at least one letter and one number.";
    }
    if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("User registered successfully!");
    } catch (err) {
      console.log(err);
      if (err.code === "auth/email-already-in-use") {
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered in the system.",
        }));
      } else {
        alert("Something went wrong, please try again.");
      }
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-container">
        <h1>Create a New Account</h1>

        <form onSubmit={handleSignUp}>
          <div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              disableUnderline
              className={errors.email ? "error" : ""}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              disableUnderline
              className={errors.password ? "error" : ""}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <div>
            <Input
              type="number"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              disableUnderline
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && <p className="error-text">{errors.phone}</p>}
          </div>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            className="create-btn"
          >
            Create Account
          </Button>
        </form>

        <hr />

        <p>
          Already have an account?{" "}
          <Button type="button" onClick={onSwitchToSignIn}>
            Sign In
          </Button>
        </p>
      </div>
    </div>
  );
}
