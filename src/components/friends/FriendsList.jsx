// FriendsList.jsx - Updated with Advanced Search (3+ Parameters)
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FriendsList({ 
  users, 
  currentUser, 
  friends, 
  sentRequests,
  receivedRequests,
  onSendRequest, 
  onAcceptRequest, 
  onRejectRequest,
  onRemoveFriend 
}) {
  const navigate = useNavigate();
  
  // Search parameters (3+)
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, friends, non-friends, pending
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const getFriendStatus = (userId) => {
    if (friends && friends[userId]) return "friends";
    if (sentRequests && sentRequests[userId]) return "pending";
    if (receivedRequests && receivedRequests[userId]) return "received";
    return "none";
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Advanced filtering with 3+ parameters
  const filteredUsers = users.filter(user => {
    // Exclude current user
    if (user.id === currentUser?.uid) return false;
    
    // Parameter 1: Name filter
    if (nameFilter.trim()) {
      const userName = user.displayName || user.email?.split("@")[0] || "";
      if (!userName.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Parameter 2: Email filter
    if (emailFilter.trim()) {
      const userEmail = user.email || "";
      if (!userEmail.toLowerCase().includes(emailFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Parameter 3: Status filter
    if (statusFilter !== "all") {
      const status = getFriendStatus(user.id);
      if (statusFilter === "friends" && status !== "friends") return false;
      if (statusFilter === "non-friends" && status !== "none") return false;
      if (statusFilter === "pending" && status !== "pending") return false;
    }
    
    return true;
  });

  const handleResetFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setStatusFilter("all");
  };

  return (
    <div className="friends-list-container">
      <div className="friends-header">
        <h2>All Users</h2>
        
        {/* Advanced Search Toggle */}
        <button 
          className="toggle-search-btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? " Hide Advanced Filters" : "Search"}
        </button>
      </div>

      {/* Advanced Search Panel */}
      {showAdvanced && (
        <div className="advanced-search-panel">
          <h3 className="search-panel-title">
            Search Users 
          </h3>
          
          <div className="search-grid-inline">
            {/* Parameter 1: Name */}
            <div className="search-field-inline">
              <label> Name</label>
              <input
                type="text"
                className="search-input-inline"
                placeholder="Search by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>

            {/* Parameter 2: Email */}
            <div className="search-field-inline">
              <label> Email</label>
              <input
                type="text"
                className="search-input-inline"
                placeholder="Search by email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
              />
            </div>

            {/* Parameter 3: Status */}
            <div className="search-field-inline">
              <label> Status</label>
              <select
                className="search-select-inline"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="friends">Friends Only</option>
                <option value="non-friends">Non-Friends Only</option>
                <option value="pending">Pending Requests</option>
              </select>
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
              Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length - 1}</strong> users
              {(nameFilter || emailFilter || statusFilter !== "all") && (
                <span className="filtered-indicator"> (filtered)</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="users-grid">
        {filteredUsers.length === 0 ? (
          <div className="no-users-found">
            <p> No users found matching your search criteria.</p>
            <button onClick={handleResetFilters}>Reset Filters</button>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const status = getFriendStatus(user.id);
            
            return (
              <div key={user.id} className="user-card">
                <div 
                  className="user-avatar-large"
                  onClick={() => handleUserClick(user.id)}
                  style={{ cursor: "pointer" }}
                >
                  {getInitial(user.displayName || user.email)}
                </div>
                
                <h3 
                  className="user-name"
                  onClick={() => handleUserClick(user.id)}
                  style={{ 
                    cursor: "pointer",
                    transition: "color 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.target.style.color = "#1da1f2"}
                  onMouseLeave={(e) => e.target.style.color = "var(--text-primary)"}
                >
                  {user.displayName || user.email?.split("@")[0]}
                </h3>
                
                <p className="user-email">{user.email}</p>

                {status === "friends" && (
                  <button 
                    className="remove-friend-btn"
                    onClick={() => onRemoveFriend(user.id)}
                  >
                    Remove Friend
                  </button>
                )}

                {status === "pending" && (
                  <button className="pending-btn" disabled>
                    Request Sent
                  </button>
                )}

                {status === "received" && (
                  <div className="request-actions">
                    <button 
                      className="accept-btn"
                      onClick={() => onAcceptRequest(user.id)}
                    >
                      Accept
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => onRejectRequest(user.id)}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {status === "none" && (
                  <button 
                    className="add-friend-btn"
                    onClick={() => onSendRequest(user.id)}
                  >
                    Add Friend
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