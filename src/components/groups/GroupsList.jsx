// GroupsList.jsx
// Responsibility: Display groups with join/leave/manage functionality

import { useState } from "react";

export default function GroupsList({ 
  groups, 
  currentUser, 
  onCreateGroup, 
  onJoinGroup, 
  onLeaveGroup,
  onDeleteGroup,
  onApproveRequest,
  onRejectRequest
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    await onCreateGroup({
      name: newGroupName,
      description: newGroupDescription,
      isPrivate: isPrivate
    });

    setNewGroupName("");
    setNewGroupDescription("");
    setIsPrivate(false);
    setShowCreateForm(false);
  };

  const filteredGroups = groups.filter(group => {
    const name = group.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getGroupStatus = (group) => {
    if (!currentUser) return "none";
    
    if (group.adminId === currentUser.uid) return "admin";
    if (group.members && group.members[currentUser.uid]) return "member";
    if (group.joinRequests && group.joinRequests[currentUser.uid]) return "pending";
    return "none";
  };

  return (
    <div className="groups-list-container">
      <div className="groups-header">
        <h2>Groups</h2>
        <button 
          className="create-group-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "+ Create Group"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateGroup} className="create-group-form">
          <input
            type="text"
            className="group-name-input"
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
          />
          <textarea
            className="group-desc-input"
            placeholder="Description (optional)"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            rows="3"
          />
          <label className="private-checkbox">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Private Group (requires approval to join)
          </label>
          <button type="submit" className="submit-group-btn">
            Create Group
          </button>
        </form>
      )}

      <input
        type="text"
        className="search-groups-input"
        placeholder="Search groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="groups-grid">
        {filteredGroups.map((group) => {
          const status = getGroupStatus(group);
          const memberCount = group.members ? Object.keys(group.members).length : 0;
          const pendingCount = group.joinRequests ? Object.keys(group.joinRequests).length : 0;

          return (
            <div key={group.id} className="group-card">
              <div className="group-icon">
                {group.isPrivate ? "🔒" : "🌐"}
              </div>
              <h3 className="group-name">{group.name}</h3>
              <p className="group-description">
                {group.description || "No description"}
              </p>
              <p className="group-members">
                👥 {memberCount} member{memberCount !== 1 ? "s" : ""}
              </p>

              {status === "admin" && (
                <div className="admin-actions">
                  {pendingCount > 0 && (
                    <span className="pending-badge">
                      {pendingCount} pending request{pendingCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <button 
                    className="delete-group-btn"
                    onClick={() => onDeleteGroup(group.id)}
                  >
                    Delete Group
                  </button>
                  {group.joinRequests && Object.keys(group.joinRequests).length > 0 && (
                    <div className="join-requests">
                      <h4>Join Requests:</h4>
                      {Object.entries(group.joinRequests).map(([userId, request]) => (
                        <div key={userId} className="request-item">
                          <span>{request.userName}</span>
                          <div className="request-actions">
                            <button 
                              className="approve-btn"
                              onClick={() => onApproveRequest(group.id, userId)}
                            >
                              ✓
                            </button>
                            <button 
                              className="reject-btn"
                              onClick={() => onRejectRequest(group.id, userId)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {status === "member" && status !== "admin" && (
                <button 
                  className="leave-group-btn"
                  onClick={() => onLeaveGroup(group.id)}
                >
                  Leave Group
                </button>
              )}

              {status === "pending" && (
                <button className="pending-btn" disabled>
                  Request Pending
                </button>
              )}

              {status === "none" && (
                <button 
                  className="join-group-btn"
                  onClick={() => onJoinGroup(group.id)}
                >
                  Join Group
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <p className="no-groups">No groups found</p>
      )}
    </div>
  );
}