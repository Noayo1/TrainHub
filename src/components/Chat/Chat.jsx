// src/components/Chat/Chat.jsx
// Display Component: Pure presentation for chat UI

import { useState, useRef, useEffect } from "react";
import "../../styles/Chat.css";

export default function Chat({
  recipientId,
  recipientName,
  messages,
  currentUser,
  isOpen,
  loading,
  onToggleChat,
  onSendMessage,
}) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, loading]);

  // Handle send
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await onSendMessage(recipientId, newMessage);
    setNewMessage("");
  };

  // Format time
  const getTimeDifference = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  // If closed, show button
  if (!isOpen) {
    return (
      <button
        className="open-chat-btn"
        onClick={() => onToggleChat(recipientId)}
      >
        💬 Chat with {recipientName}
      </button>
    );
  }

  // Render chat window
  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <h3>💬 {recipientName}</h3>
        <button className="close-chat-btn" onClick={() => onToggleChat(null)}>
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {loading && <p className="chat-loading">Loading messages...</p>}

        {!loading && messages.length === 0 && (
          <p className="no-messages">
            No messages yet. Start the conversation! 👋
          </p>
        )}

        {!loading && messages.length > 0 && (
          <>
            {messages.map((message) => {
              const isSent = message.senderId === currentUser.uid;
              return (
                <div
                  key={message.id}
                  className={`message ${isSent ? "sent" : "received"}`}
                >
                  <div className="message-content">
                    <p className="message-text">{message.text}</p>
                    <span className="message-time">
                      {getTimeDifference(message.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
          maxLength={1000}
        />
        <button
          type="submit"
          className="send-message-btn"
          disabled={!newMessage.trim() || loading}
        >
          Send
        </button>
      </form>
    </div>
  );
}
