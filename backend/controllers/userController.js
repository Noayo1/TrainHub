// backend/controllers/userController.js
// User Controller - Handles all user-related operations

const { db } = require("../config/firebase");
const User = require("../models/userModel");

// CREATE - Create a new user
exports.createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Validate user data
    const errors = User.validate(userData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Create user instance
    const user = new User(userData);

    // Save to Firebase
    await db.ref(`users/${user.uid}`).set(user.toJSON());

    res.status(201).json({
      message: "User created successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ error: "Failed to create user", message: error.message });
  }
};

// READ - Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.ref(`users/${userId}`).once("value");
    const user = snapshot.val();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error getting user:", error);
    res
      .status(500)
      .json({ error: "Failed to get user", message: error.message });
  }
};

// READ - Get all users (with optional filters)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    const snapshot = await db.ref("users").once("value");
    let users = snapshot.val();

    if (!users) {
      return res.status(200).json({ users: [] });
    }

    // Convert to array
    users = Object.values(users);

    // Filter by role if specified
    if (role) {
      users = users.filter((user) => user.role === role);
    }

    // Search by name or email
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({ users, count: users.length });
  } catch (error) {
    console.error("Error getting users:", error);
    res
      .status(500)
      .json({ error: "Failed to get users", message: error.message });
  }
};

// UPDATE - Update user information
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Check if user exists
    const snapshot = await db.ref(`users/${userId}`).once("value");
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add updatedAt timestamp
    updates.updatedAt = Date.now();

    // Update user in Firebase
    await db.ref(`users/${userId}`).update(updates);

    // Get updated user
    const updatedSnapshot = await db.ref(`users/${userId}`).once("value");
    const updatedUser = updatedSnapshot.val();

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ error: "Failed to update user", message: error.message });
  }
};

// DELETE - Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const snapshot = await db.ref(`users/${userId}`).once("value");
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user from Firebase
    await db.ref(`users/${userId}`).remove();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ error: "Failed to delete user", message: error.message });
  }
};

// SEARCH - Advanced search with multiple parameters
exports.searchUsers = async (req, res) => {
  try {
    const { displayName, email, role, friendsCount } = req.query;

    const snapshot = await db.ref("users").once("value");
    let users = snapshot.val();

    if (!users) {
      return res.status(200).json({ users: [], count: 0 });
    }

    // Convert to array
    users = Object.values(users);

    // Apply filters
    if (displayName) {
      users = users.filter((user) =>
        user.displayName.toLowerCase().includes(displayName.toLowerCase())
      );
    }

    if (email) {
      users = users.filter((user) =>
        user.email.toLowerCase().includes(email.toLowerCase())
      );
    }

    if (role) {
      users = users.filter((user) => user.role === role);
    }

    if (friendsCount) {
      users = users.filter((user) => {
        const count = user.friends ? Object.keys(user.friends).length : 0;
        return count >= parseInt(friendsCount);
      });
    }

    res.status(200).json({
      users,
      count: users.length,
      filters: { displayName, email, role, friendsCount },
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res
      .status(500)
      .json({ error: "Failed to search users", message: error.message });
  }
};
