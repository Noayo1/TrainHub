// src/components/Chat/FloatingChat.jsx
// Main floating chat component with notifications and chat list

import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import socketService from '../../services/socketService';
import ChatWindow from './ChatWindow';
import '../../styles/FloatingChat.css';

export default function FloatingChat({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [friends, setFriends] = useState([]);

  // Load friends list
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

      // Load friend details
      const friendIds = Object.keys(friendsData);
      const friendsList = [];

      for (const friendId of friendIds) {
        const userRef = ref(db, `users/${friendId}`);
        const userSnapshot = await new Promise(resolve => {
          onValue(userRef, resolve, { onlyOnce: true });
        });
        
        if (userSnapshot.exists()) {
          friendsList.push({
            id: friendId,
            ...userSnapshot.val()
          });
        }
      }

      setFriends(friendsList);
    });

    return () => unsubFriends();
  }, [currentUser]);

  // Load conversations from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const db = getDatabase();
    const messagesRef = ref(db, 'messages');

    const unsubMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setConversations([]);
        return;
      }

      // Group messages by conversation
      const convMap = {};
      
      Object.entries(data).forEach(([msgId, msg]) => {
        // Only include messages involving current user
        if (msg.senderId !== currentUser.uid && msg.receiverId !== currentUser.uid) {
          return;
        }

        // Determine the other user
        const otherUserId = msg.senderId === currentUser.uid ? msg.receiverId : msg.senderId;
        const otherUserName = msg.senderId === currentUser.uid ? msg.receiverName : msg.senderName;

        if (!convMap[otherUserId]) {
          convMap[otherUserId] = {
            userId: otherUserId,
            userName: otherUserName,
            messages: [],
            unreadCount: 0,
            lastMessage: null,
            lastTimestamp: 0
          };
        }

        convMap[otherUserId].messages.push(msg);

        // Count unread (messages sent TO current user that are unread)
        if (msg.receiverId === currentUser.uid && !msg.read) {
          convMap[otherUserId].unreadCount++;
        }

        // Track last message
        if (msg.timestamp > convMap[otherUserId].lastTimestamp) {
          convMap[otherUserId].lastMessage = msg.message;
          convMap[otherUserId].lastTimestamp = msg.timestamp;
        }
      });

      // Convert to array and sort by latest message
      const convArray = Object.values(convMap).sort((a, b) => 
        b.lastTimestamp - a.lastTimestamp
      );

      setConversations(convArray);

      // Calculate total unread
      const total = convArray.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setTotalUnread(total);
    });

    return () => unsubMessages();
  }, [currentUser]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!currentUser) return;

    const handleNewMessage = (data) => {
      // If message is for current user, increment unread
      if (data.receiverId === currentUser.uid) {
        setTotalUnread(prev => prev + 1);
      }
    };

    socketService.onReceiveMessage(handleNewMessage);

    return () => {
      socketService.removeListener('receive-message');
    };
  }, [currentUser]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedChat(null); // Close any open chat when closing window
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedChat({
      recipientId: conv.userId,
      recipientName: conv.userName
    });

    // Mark messages as read
    markAsRead(conv.userId);
  };

  const handleStartNewChat = (friend) => {
    setSelectedChat({
      recipientId: friend.id,
      recipientName: friend.displayName || friend.email?.split('@')[0]
    });
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  const markAsRead = async (otherUserId) => {
    // Update read status in Firebase
    const db = getDatabase();
    const messagesRef = ref(db, 'messages');
    
    onValue(messagesRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const updates = {};
      Object.entries(data).forEach(([msgId, msg]) => {
        if (msg.senderId === otherUserId && 
            msg.receiverId === currentUser.uid && 
            !msg.read) {
          updates[`messages/${msgId}/read`] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        const { update } = await import('firebase/database');
        await update(ref(db), updates);
      }
    }, { onlyOnce: true });

    // Update local state
    setConversations(prev => 
      prev.map(conv => 
        conv.userId === otherUserId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );

    setTotalUnread(prev => {
      const conv = conversations.find(c => c.userId === otherUserId);
      return prev - (conv?.unreadCount || 0);
    });
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <div className="floating-chat-button" onClick={handleToggleChat}>
        <span className="chat-icon">💬</span>
        {totalUnread > 0 && (
          <span className="unread-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="floating-chat-window">
          <div className="chat-window-header">
            <h3>{selectedChat ? selectedChat.recipientName : 'Messages'}</h3>
            <button className="close-chat-window" onClick={handleToggleChat}>
              ✕
            </button>
          </div>

          <div className="chat-window-body">
            {!selectedChat ? (
              // Conversation List
              <div className="conversations-list">
                {/* Friends who haven't messaged yet */}
                {friends.length > 0 && (
                  <div className="friends-section">
                    <h4>Start a conversation</h4>
                    <div className="friends-grid">
                      {friends
                        .filter(friend => 
                          !conversations.some(conv => conv.userId === friend.id)
                        )
                        .slice(0, 5)
                        .map(friend => (
                          <div 
                            key={friend.id}
                            className="friend-avatar"
                            onClick={() => handleStartNewChat(friend)}
                            title={friend.displayName || friend.email}
                          >
                            <div className="avatar-circle">
                              {(friend.displayName || friend.email)?.[0]?.toUpperCase()}
                            </div>
                            <span className="friend-name">
                              {(friend.displayName || friend.email?.split('@')[0]).slice(0, 8)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Recent Conversations */}
                <div className="recent-chats">
                  <h4>Recent Chats</h4>
                  {conversations.length === 0 ? (
                    <div className="no-conversations">
                      <p>No messages yet</p>
                      <p className="hint">Start chatting with your friends!</p>
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <div 
                        key={conv.userId}
                        className="conversation-item"
                        onClick={() => handleSelectConversation(conv)}
                      >
                        <div className="conv-avatar">
                          {conv.userName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="conv-info">
                          <div className="conv-header">
                            <span className="conv-name">{conv.userName}</span>
                            <span className="conv-time">
                              {formatTime(conv.lastTimestamp)}
                            </span>
                          </div>
                          <div className="conv-preview">
                            <span className={conv.unreadCount > 0 ? 'unread-text' : ''}>
                              {conv.lastMessage?.slice(0, 40)}
                              {conv.lastMessage?.length > 40 ? '...' : ''}
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
              // Chat Window
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

      {/* Overlay */}
      {isOpen && (
        <div 
          className="chat-overlay" 
          onClick={handleToggleChat}
        />
      )}
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
  return 'now';
}
