// backend/middleware/authMiddleware.js
// Authentication Middleware - Verify Firebase tokens

const { admin } = require("../config/firebase");

// Verify Firebase ID token
exports.verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Check if user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    const { db } = require("../config/firebase");
    const userId = req.user.uid;

    // Get user from database
    const snapshot = await db.ref(`users/${userId}`).once("value");
    const user = snapshot.val();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ error: "Failed to verify admin status" });
  }
};
