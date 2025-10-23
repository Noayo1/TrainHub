// backend/controllers/groupController.js
// Group Controller - Handles all group-related operations

const { db } = require("../config/firebase");
const Group = require("../models/groupModel");

// CREATE - Create a new group
exports.createGroup = async (req, res) => {
  try {
    const groupData = req.body;

    // Validate group data
    const errors = Group.validate(groupData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Generate unique group ID
    const groupRef = db.ref("groups").push();
    groupData.id = groupRef.key;

    // Add admin as first member
    groupData.members = { [groupData.adminId]: true };

    // Create group instance
    const group = new Group(groupData);

    // Save to Firebase
    await groupRef.set(group.toJSON());

    res.status(201).json({
      message: "Group created successfully",
      group: group.toJSON(),
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res
      .status(500)
      .json({ error: "Failed to create group", message: error.message });
  }
};

// READ - Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query; // User requesting the group

    const snapshot = await db.ref(`groups/${groupId}`).once("value");
    const group = snapshot.val();

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if group is private and user is not a member
    if (group.isPrivate && !group.members[userId]) {
      return res.status(403).json({
        error: "This is a private group. You must be a member to view it.",
      });
    }

    res.status(200).json({ group });
  } catch (error) {
    console.error("Error getting group:", error);
    res
      .status(500)
      .json({ error: "Failed to get group", message: error.message });
  }
};

// READ - Get all groups (with optional filters)
exports.getAllGroups = async (req, res) => {
  try {
    const { userId, isPrivate, search } = req.query;

    const snapshot = await db.ref("groups").once("value");
    let groups = snapshot.val();

    if (!groups) {
      return res.status(200).json({ groups: [] });
    }

    // Convert to array
    groups = Object.values(groups);

    // Filter private groups (show only if user is member)
    if (userId) {
      groups = groups.filter((group) => {
        if (group.isPrivate) {
          return group.members && group.members[userId];
        }
        return true;
      });
    }

    // Filter by privacy setting
    if (isPrivate !== undefined) {
      const privacy = isPrivate === "true";
      groups = groups.filter((group) => group.isPrivate === privacy);
    }

    // Search by name or description
    if (search) {
      const searchLower = search.toLowerCase();
      groups = groups.filter(
        (group) =>
          group.name.toLowerCase().includes(searchLower) ||
          (group.description &&
            group.description.toLowerCase().includes(searchLower))
      );
    }

    res.status(200).json({ groups, count: groups.length });
  } catch (error) {
    console.error("Error getting groups:", error);
    res
      .status(500)
      .json({ error: "Failed to get groups", message: error.message });
  }
};

// UPDATE - Update group information (admin only)
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const updates = req.body;
    const { userId } = req.query; // User making the update

    // Check if group exists
    const snapshot = await db.ref(`groups/${groupId}`).once("value");
    const group = snapshot.val();

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin
    if (group.adminId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the group admin can update group information" });
    }

    // Add updatedAt timestamp
    updates.updatedAt = Date.now();

    // Update group in Firebase
    await db.ref(`groups/${groupId}`).update(updates);

    // Get updated group
    const updatedSnapshot = await db.ref(`groups/${groupId}`).once("value");
    const updatedGroup = updatedSnapshot.val();

    res.status(200).json({
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res
      .status(500)
      .json({ error: "Failed to update group", message: error.message });
  }
};

// DELETE - Delete a group (admin only)
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query; // User making the deletion

    // Check if group exists
    const snapshot = await db.ref(`groups/${groupId}`).once("value");
    const group = snapshot.val();

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin
    if (group.adminId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the group admin can delete the group" });
    }

    // Delete group from Firebase
    await db.ref(`groups/${groupId}`).remove();

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res
      .status(500)
      .json({ error: "Failed to delete group", message: error.message });
  }
};

// APPROVE MEMBER - Admin approves pending member
exports.approveMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { userId } = req.query; // Admin making the approval

    // Check if group exists
    const snapshot = await db.ref(`groups/${groupId}`).once("value");
    const group = snapshot.val();

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin
    if (group.adminId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the group admin can approve members" });
    }

    // Check if member is in pending list
    if (!group.pendingMembers || !group.pendingMembers[memberId]) {
      return res
        .status(400)
        .json({ error: "User is not in pending members list" });
    }

    // Move from pending to members
    await db.ref(`groups/${groupId}/pendingMembers/${memberId}`).remove();
    await db.ref(`groups/${groupId}/members/${memberId}`).set(true);

    res.status(200).json({ message: "Member approved successfully" });
  } catch (error) {
    console.error("Error approving member:", error);
    res
      .status(500)
      .json({ error: "Failed to approve member", message: error.message });
  }
};

// SEARCH - Advanced search with multiple parameters
exports.searchGroups = async (req, res) => {
  try {
    const { name, adminId, memberCount, isPrivate, hasDescription } = req.query;

    const snapshot = await db.ref("groups").once("value");
    let groups = snapshot.val();

    if (!groups) {
      return res.status(200).json({ groups: [], count: 0 });
    }

    // Convert to array
    groups = Object.values(groups);

    // Apply filters
    if (name) {
      groups = groups.filter((group) =>
        group.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    if (adminId) {
      groups = groups.filter((group) => group.adminId === adminId);
    }

    if (isPrivate !== undefined) {
      const privacy = isPrivate === "true";
      groups = groups.filter((group) => group.isPrivate === privacy);
    }

    if (memberCount) {
      groups = groups.filter((group) => {
        const count = group.members ? Object.keys(group.members).length : 0;
        return count >= parseInt(memberCount);
      });
    }

    if (hasDescription === "true") {
      groups = groups.filter(
        (group) => group.description && group.description.trim().length > 0
      );
    }

    res.status(200).json({
      groups,
      count: groups.length,
      filters: { name, adminId, memberCount, isPrivate, hasDescription },
    });
  } catch (error) {
    console.error("Error searching groups:", error);
    res
      .status(500)
      .json({ error: "Failed to search groups", message: error.message });
  }
};
