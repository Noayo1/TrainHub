// GroupsList.jsx - Updated with Simple Search Bar + Advanced + Create Group Buttons
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GroupsList({
  groups,
  currentUser,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  onDeleteGroup,
  onApproveRequest,
  onRejectRequest,
}) {
  const navigate = useNavigate();

  // Create group state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Advanced search parameters (3+)
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [minMembers, setMinMembers] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    await onCreateGroup({
      name: newGroupName,
      description: newGroupDescription,
      isPrivate: isPrivate,
    });

    setNewGroupName("");
    setNewGroupDescription("");
    setIsPrivate(false);
    setShowCreateForm(false);
  };

  const getGroupStatus = (group) => {
    if (!currentUser) return "none";
    if (group.adminId === currentUser.uid) return "admin";
    if (group.members && group.members[currentUser.uid]) return "member";
    if (group.joinRequests && group.joinRequests[currentUser.uid])
      return "pending";
    return "none";
  };

  const getMemberCount = (group) => {
    return group.members ? Object.keys(group.members).length : 0;
  };

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  // Filtering logic
  const filteredGroups = groups.filter((group) => {
    // Simple search (when advanced is closed)
    if (!showAdvanced && searchQuery.trim()) {
      const groupName = group.name || "";
      const groupDesc = group.description || "";
      const query = searchQuery.toLowerCase();

      if (
        !groupName.toLowerCase().includes(query) &&
        !groupDesc.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Advanced search (when advanced is open)
    if (showAdvanced) {
      // Parameter 1: Name filter
      if (nameFilter.trim()) {
        const groupName = group.name || "";
        const groupDesc = group.description || "";
        if (
          !groupName.toLowerCase().includes(nameFilter.toLowerCase()) &&
          !groupDesc.toLowerCase().includes(nameFilter.toLowerCase())
        ) {
          return false;
        }
      }

      // Parameter 2: Type filter (public/private)
      if (typeFilter !== "all") {
        if (typeFilter === "public" && group.isPrivate) return false;
        if (typeFilter === "private" && !group.isPrivate) return false;
      }

      // Parameter 3: Min members
      if (minMembers !== "") {
        const memberCount = getMemberCount(group);
        if (memberCount < parseInt(minMembers)) return false;
      }

      // Parameter 4: Max members
      if (maxMembers !== "") {
        const memberCount = getMemberCount(group);
        if (memberCount > parseInt(maxMembers)) return false;
      }
    }

    return true;
  });

  const handleResetFilters = () => {
    setNameFilter("");
    setTypeFilter("all");
    setMinMembers("");
    setMaxMembers("");
  };

  return (
    <div className="groups-list-container">
      <div className="groups-header">
        <h2>Groups</h2>

        {/* ✅ NEW: Search Bar with Advanced + Create Group Buttons on the Right */}
        <div className="search-bar-wrapper">
          <input
            type="text"
            className="search-users-input"
            placeholder="Search groups by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={showAdvanced}
          />
          <button
            className="toggle-search-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "✕ Hide Advanced" : "Advanced"}
          </button>
          <button
            className="create-group-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "✕ Cancel" : "+ Create Group"}
          </button>
        </div>
      </div>

      {/* Create Group Form */}
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

      {/* Advanced Search Panel */}
      {showAdvanced && (
        <div className="advanced-search-panel">
          <h3 className="search-panel-title"> Advanced Search</h3>

          <div className="search-grid-inline">
            {/* Parameter 1: Name/Description */}
            <div className="search-field-inline">
              <label>Name/Description</label>
              <input
                type="text"
                className="search-input-inline"
                placeholder="Search groups..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>

            {/* Parameter 2: Type */}
            <div className="search-field-inline">
              <label>Type</label>
              <select
                className="search-select-inline"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Parameter 3: Min Members */}
            <div className="search-field-inline">
              <label> Min Members</label>
              <input
                type="number"
                className="search-input-inline"
                placeholder="Min..."
                value={minMembers}
                onChange={(e) => setMinMembers(e.target.value)}
                min="0"
              />
            </div>

            {/* Parameter 4: Max Members */}
            <div className="search-field-inline">
              <label> Max Members</label>
              <input
                type="number"
                className="search-input-inline"
                placeholder="Max..."
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                min="0"
              />
            </div>

            {/* Reset Button */}
            <div className="search-field-inline">
              <label>&nbsp;</label>
              <button
                className="reset-filters-btn"
                onClick={handleResetFilters}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Search Results Count */}
          <div className="search-results-count">
            <p>
              Showing <strong>{filteredGroups.length}</strong> of{" "}
              <strong>{groups.length}</strong> groups
              {(nameFilter ||
                typeFilter !== "all" ||
                minMembers ||
                maxMembers) && (
                <span className="filtered-indicator"> (filtered)</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <div className="groups-grid">
        {filteredGroups.length === 0 ? (
          <div className="no-groups-found">
            <p>No groups found matching your search criteria.</p>
            {(nameFilter ||
              typeFilter !== "all" ||
              minMembers ||
              maxMembers) && (
              <button onClick={handleResetFilters}>Reset Filters</button>
            )}
          </div>
        ) : (
          filteredGroups.map((group) => {
            const status = getGroupStatus(group);
            const memberCount = getMemberCount(group);
            const pendingCount = group.joinRequests
              ? Object.keys(group.joinRequests).length
              : 0;

            return (
              <div key={group.id} className="group-card">
                <div
                  className="group-icon"
                  onClick={() => handleGroupClick(group.id)}
                  style={{ cursor: "pointer" }}
                >
                  {group.isPrivate ? "🔒" : "🌐"}
                </div>

                <h3
                  className="group-name"
                  onClick={() => handleGroupClick(group.id)}
                  style={{
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#1da1f2")}
                  onMouseLeave={(e) =>
                    (e.target.style.color = "var(--text-primary)")
                  }
                >
                  {group.name}
                </h3>

                <p className="group-description">
                  {group.description || "No description"}
                </p>
                <p className="group-members">
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </p>

                {status === "admin" && (
                  <div className="admin-actions">
                    {pendingCount > 0 && (
                      <span className="pending-badge">
                        {pendingCount} pending request
                        {pendingCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    <button
                      className="delete-group-btn"
                      onClick={() => onDeleteGroup(group.id)}
                    >
                      Delete Group
                    </button>
                    {group.joinRequests &&
                      Object.keys(group.joinRequests).length > 0 && (
                        <div className="join-requests">
                          <h4>Join Requests:</h4>
                          {Object.entries(group.joinRequests).map(
                            ([userId, request]) => (
                              <div key={userId} className="request-item">
                                <span>{request.userName}</span>
                                <div className="request-actions">
                                  <button
                                    className="approve-btn"
                                    onClick={() =>
                                      onApproveRequest(group.id, userId)
                                    }
                                  >
                                    ✔
                                  </button>
                                  <button
                                    className="reject-btn"
                                    onClick={() =>
                                      onRejectRequest(group.id, userId)
                                    }
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )
                          )}
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
          })
        )}
      </div>
    </div>
  );
}
