// Chat.jsx (Refactored)
// Responsibility: Display chat UI and delegate message operations via callbacks
// NO direct Firebase access - follows proper architecture

import { useState, useRef, useEffect } from "react";

export default function Chat({ 
  recipientId,
  recipientName, 
  messages, 
  currentUser,
  isOpen,
  onToggleChat,
  onSendMessage 
}) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // ✅ Delegate to parent via callback
    await onSendMessage(recipientId, newMessage);
    setNewMessage("");
  };

  const getTimeDifference = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  if (!isOpen) {
    return (
      <button className="open-chat-btn" onClick={() => onToggleChat(recipientId)}>
        💬 Chat with {recipientName}
      </button>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat with {recipientName}</h3>
        <button className="close-chat-btn" onClick={() => onToggleChat(null)}>
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.senderId === currentUser.uid ? "sent" : "received"
              }`}
            >
              <div className="message-content">
                <p className="message-text">{message.text}</p>
                <span className="message-time">
                  {getTimeDifference(message.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="send-message-btn">
          Send
        </button>
      </form>
    </div>
  );
}