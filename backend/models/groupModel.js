// backend/controllers/groupController.js
// Group Controller - Handles all group-related operations

const { db } = require("../config/firebase");
const Group = require("../models/groupModel");

exports.createGroup = async (req, res) => {
  try {
    const groupData = req.body;

    const errors = Group.validate(groupData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const groupRef = db.ref("groups").push();
    groupData.id = groupRef.key;
    groupData.members = { [groupData.adminId]: true };
    groupData.pendingMembers = {};
    groupData.posts = {};

    const group = new Group(groupData);
    await groupRef.set(group.toJSON());

    res.status(201).json({
      message: "Group created successfully",
      group: group.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create group",
      message: error.message,
    });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;

    const snapshot = await db.ref(`groups/${groupId}`).once("value");
    const group = snapshot.val();

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.isPrivate && !group.members[userId]) {
      return res.status(403).json({
        error: "This is a private group. You must be a member to view it.",
      });
    }

    res.status(200).json({ group });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get group",
      message: error.message,
    });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const { userId, isPrivate, search } = req.query;
    const snapshot = await db.ref("groups").once("value");
    let groups = snapshot.val();

    if (!groups) {
      return res.status(200).json({ groups: [] });
    }

    groups = Object.values(groups);

    if (isPrivate !== undefined) {
      const privateFilter = isPrivate === "true";
      groups = groups.filter((group) => group.isPrivate === privateFilter);
    }

    if (userId) {
      groups = groups.filter(
        (group) => !group.isPrivate || group.members[userId]
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      groups = groups.filter(
        (group) =>
          group.name.toLowerCase().includes(searchLower) ||
          group.description.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({ groups, count: groups.length });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get groups",
      message: error.message,
    });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const updates = req.body;
    const { userId } = req.query;

    const snapshot = await db.ref(`groups/${groupId}`).once("value");
    const group = snapshot.val();

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.adminId !== userId) {
      return res.status(403).json({
        error: "Only the group admin can update group information",
      });
    }

    updates.updatedAt = Date.now();
    await db.ref(`groups/${groupId}`).update(updates);

    const updatedSnapshot = await db.ref(`groups/${groupId}`).once("value");
    const updatedGroup = updatedSnapshot.val();

    res.status(200).json({
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update group",
      message: error.message,
    });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;

    const snapshot = await db.ref(`groups/${groupId}`).once("value");
    const group = snapshot.val();

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.adminId !== userId) {
      return res.status(403).json({
        error: "Only the group admin can delete the group",
      });
    }

    await db.ref(`groups/${groupId}`).remove();
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete group",
      message: error.message,
    });
  }
};

exports.approveMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { userId } = req.query;

    const snapshot = await db.ref(`groups/${groupId}`).once("value");
    const group = snapshot.val();

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.adminId !== userId) {
      return res.status(403).json({
        error: "Only the group admin can approve members",
      });
    }

    await db.ref(`groups/${groupId}/members/${memberId}`).set(true);
    await db.ref(`groups/${groupId}/pendingMembers/${memberId}`).remove();

    res.status(200).json({ message: "Member approved successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Failed to approve member",
      message: error.message,
    });
  }
};

exports.searchGroups = async (req, res) => {
  try {
    const { name, adminId, memberCount, isPrivate, hasDescription } = req.query;
    const snapshot = await db.ref("groups").once("value");
    let groups = snapshot.val();

    if (!groups) {
      return res.status(200).json({ groups: [], count: 0 });
    }

    groups = Object.values(groups);

    if (name) {
      groups = groups.filter((group) =>
        group.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    if (adminId) {
      groups = groups.filter((group) => group.adminId === adminId);
    }

    if (memberCount) {
      groups = groups.filter((group) => {
        const count = group.members ? Object.keys(group.members).length : 0;
        return count >= parseInt(memberCount);
      });
    }

    if (isPrivate !== undefined) {
      const privateFilter = isPrivate === "true";
      groups = groups.filter((group) => group.isPrivate === privateFilter);
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
    res.status(500).json({
      error: "Failed to search groups",
      message: error.message,
    });
  }
};

module.exports = exports;
