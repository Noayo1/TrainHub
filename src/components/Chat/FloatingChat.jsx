import { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import socketService from "../../services/socketService";
import ChatWindow from "./ChatWindow";
import "../../styles/FloatingChat.css";

export default function FloatingChat({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [friends, setFriends] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        setUsersData(snapshot.val());
        console.log("Users data loaded with profile pictures");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const db = getDatabase();
    const friendsRef = ref(db, `users/${currentUser.uid}/friends`);

    const unsubFriends = onValue(friendsRef, async (snapshot) => {
      const friendsData = snapshot.val();
      if (!friendsData) {
        setFriends([]);
        return;
      }

      const friendIds = Object.keys(friendsData);
      const friendsList = [];

      for (const friendId of friendIds) {
        const userRef = ref(db, `users/${friendId}`);
        const userSnapshot = await new Promise((resolve) => {
          onValue(userRef, resolve, { onlyOnce: true });
        });

        if (userSnapshot.exists()) {
          friendsList.push({
            id: friendId,
            ...userSnapshot.val(),
          });
        }
      }

      setFriends(friendsList);
    });

    return () => unsubFriends();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const db = getDatabase();
    const messagesRef = ref(db, "messages");

    const unsubMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setConversations([]);
        return;
      }

      const convMap = {};

      Object.entries(data).forEach(([msgId, msg]) => {
        if (
          msg.senderId !== currentUser.uid &&
          msg.receiverId !== currentUser.uid
        ) {
          return;
        }

        const otherUserId =
          msg.senderId === currentUser.uid ? msg.receiverId : msg.senderId;
        const otherUserName =
          msg.senderId === currentUser.uid ? msg.receiverName : msg.senderName;

        if (!convMap[otherUserId]) {
          convMap[otherUserId] = {
            userId: otherUserId,
            userName: otherUserName,
            messages: [],
            unreadCount: 0,
            lastMessage: null,
            lastTimestamp: 0,
          };
        }

        convMap[otherUserId].messages.push(msg);

        if (msg.receiverId === currentUser.uid && !msg.read) {
          convMap[otherUserId].unreadCount++;
        }

        if (msg.timestamp > convMap[otherUserId].lastTimestamp) {
          convMap[otherUserId].lastMessage = msg.message;
          convMap[otherUserId].lastTimestamp = msg.timestamp;
        }
      });

      const convArray = Object.values(convMap).sort(
        (a, b) => b.lastTimestamp - a.lastTimestamp
      );

      setConversations(convArray);

      const total = convArray.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setTotalUnread(total);
    });

    return () => unsubMessages();
  }, [currentUser]);

  const filterBySearch = (item) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const name = (
      item.displayName ||
      item.userName ||
      item.email ||
      ""
    ).toLowerCase();
    const email = (item.email || "").toLowerCase();

    return name.includes(query) || email.includes(query);
  };

  const filteredFriends = friends
    .filter(filterBySearch)
    .filter(
      (friend) => !conversations.some((conv) => conv.userId === friend.id)
    );

  const filteredConversations = conversations.filter((conv) => {
    const isFriend = friends.some((friend) => friend.id === conv.userId);
    if (!isFriend) return false;

    return filterBySearch(conv);
  });

  useEffect(() => {
    if (!currentUser) return;

    const handleNewMessage = (data) => {
      if (data.receiverId === currentUser.uid) {
        setTotalUnread((prev) => prev + 1);
      }
    };

    socketService.onReceiveMessage(handleNewMessage);

    return () => {
      socketService.removeListener("receive-message");
    };
  }, [currentUser]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedChat(null);
      setSearchQuery("");
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedChat({
      recipientId: conv.userId,
      recipientName: conv.userName,
    });

    markAsRead(conv.userId);
  };

  const handleStartNewChat = (friend) => {
    setSelectedChat({
      recipientId: friend.id,
      recipientName: friend.displayName || friend.email?.split("@")[0],
    });
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setSearchQuery("");
  };

  const markAsRead = async (otherUserId) => {
    const db = getDatabase();
    const messagesRef = ref(db, "messages");

    onValue(
      messagesRef,
      async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const updates = {};
        Object.entries(data).forEach(([msgId, msg]) => {
          if (
            msg.senderId === otherUserId &&
            msg.receiverId === currentUser.uid &&
            !msg.read
          ) {
            updates[`messages/${msgId}/read`] = true;
          }
        });

        if (Object.keys(updates).length > 0) {
          const { update } = await import("firebase/database");
          await update(ref(db), updates);
        }
      },
      { onlyOnce: true }
    );

    setConversations((prev) =>
      prev.map((conv) =>
        conv.userId === otherUserId ? { ...conv, unreadCount: 0 } : conv
      )
    );

    setTotalUnread((prev) => {
      const conv = conversations.find((c) => c.userId === otherUserId);
      return prev - (conv?.unreadCount || 0);
    });
  };

  if (!currentUser) return null;

  return (
    <>
      <div className="floating-chat-button" onClick={handleToggleChat}>
        <span className="chat-icon">💬</span>
        {totalUnread > 0 && (
          <span className="unread-badge">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="floating-chat-window">
          <div className="chat-window-header">
            <h3>{selectedChat ? selectedChat.recipientName : "Messages"}</h3>
            <button className="close-chat-window" onClick={handleToggleChat}>
              ✕
            </button>
          </div>

          <div className="chat-window-body">
            {!selectedChat ? (
              <div className="conversations-list">
                <div className="chat-search-section">
                  <input
                    type="text"
                    className="chat-search-input"
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setSearchQuery("")}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="search-results-info">
                    {filteredFriends.length + filteredConversations.length ===
                    0 ? (
                      <p className="no-results">
                        No friends found matching "{searchQuery}"
                      </p>
                    ) : (
                      <p className="results-count">
                        Found{" "}
                        {filteredFriends.length + filteredConversations.length}{" "}
                        friend(s)
                      </p>
                    )}
                  </div>
                )}
                {filteredFriends.length > 0 && (
                  <div className="friends-section">
                    <h4>
                      {searchQuery
                        ? `Friends matching "${searchQuery}"`
                        : "Start a conversation"}
                    </h4>
                    <div className="friends-grid">
                      {filteredFriends
                        .slice(0, searchQuery ? 20 : 5)
                        .map((friend) => (
                          <div
                            key={friend.id}
                            className="friend-avatar"
                            onClick={() => handleStartNewChat(friend)}
                            title={friend.displayName || friend.email}
                          >
                            {usersData[friend.id]?.profilePictureUrl ? (
                              <img
                                src={usersData[friend.id].profilePictureUrl}
                                alt={friend.displayName}
                                className="avatar-circle"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div className="avatar-circle">
                                {(friend.displayName ||
                                  friend.email)?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <span className="friend-name">
                              {(
                                friend.displayName ||
                                friend.email?.split("@")[0]
                              ).slice(0, 8)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="recent-chats">
                  <h4>
                    {searchQuery
                      ? `Conversations matching "${searchQuery}"`
                      : "Recent Chats"}
                  </h4>
                  {filteredConversations.length === 0 ? (
                    <div className="no-conversations">
                      {searchQuery ? (
                        <>
                          <p>No conversations found</p>
                          <p className="hint">Try a different search term</p>
                        </>
                      ) : (
                        <>
                          <p>No messages yet</p>
                          <p className="hint">
                            Start chatting with your friends!
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.userId}
                        className="conversation-item"
                        onClick={() => handleSelectConversation(conv)}
                      >
                        {usersData[conv.userId]?.profilePictureUrl ? (
                          <img
                            src={usersData[conv.userId].profilePictureUrl}
                            alt={conv.userName}
                            className="conv-avatar"
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div className="conv-avatar">
                            {conv.userName?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}

                        <div className="conv-info">
                          <div className="conv-header">
                            <span className="conv-name">{conv.userName}</span>
                            <span className="conv-time">
                              {formatTime(conv.lastTimestamp)}
                            </span>
                          </div>
                          <div className="conv-preview">
                            <span
                              className={
                                conv.unreadCount > 0 ? "unread-text" : ""
                              }
                            >
                              {conv.lastMessage?.slice(0, 40)}
                              {conv.lastMessage?.length > 40 ? "..." : ""}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span className="conv-unread-badge">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <ChatWindow
                currentUser={currentUser}
                recipientId={selectedChat.recipientId}
                recipientName={selectedChat.recipientName}
                onBack={handleBackToList}
              />
            )}
          </div>
        </div>
      )}
      {isOpen && <div className="chat-overlay" onClick={handleToggleChat} />}
    </>
  );
}

function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}
