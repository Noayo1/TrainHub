// backend/server.js
// Main Express Server Entry Point

const express = require("express");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const groupRoutes = require("./routes/groupRoutes");

// Connect Routes to API endpoints
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groups", groupRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "TrainHub API Server Running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
