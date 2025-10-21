// FriendsList.jsx
// Responsibility: Display all users with friend request functionality

import { useState } from "react";

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
  const [searchTerm, setSearchTerm] = useState("");

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const filteredUsers = users.filter(user => {
    if (user.id === currentUser?.uid) return false;
    const name = user.displayName || user.email || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getFriendStatus = (userId) => {
    if (friends && friends[userId]) return "friends";
    if (sentRequests && sentRequests[userId]) return "pending";
    if (receivedRequests && receivedRequests[userId]) return "received";
    return "none";
  };

  return (
    <div className="friends-list-container">
      <div className="friends-header">
        <h2>All Users</h2>
        <input
          type="text"
          className="search-users-input"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="users-grid">
        {filteredUsers.map((user) => {
          const status = getFriendStatus(user.id);
          
          return (
            <div key={user.id} className="user-card">
              <div className="user-avatar-large">
                {getInitial(user.displayName || user.email)}
              </div>
              <h3 className="user-name">
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
        })}
      </div>

      {filteredUsers.length === 0 && (
        <p className="no-users">No users found</p>
      )}
    </div>
  );
}