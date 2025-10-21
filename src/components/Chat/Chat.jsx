// Chat.jsx
// Responsibility: Real-time chat using Firebase Realtime Database
// Note: For true WebSocket implementation, you would use Socket.io on the server

import { useState, useEffect, useRef } from "react";
import { getDatabase, ref, onValue, push, query, orderByChild, limitToLast } from "firebase/database";

export default function Chat({ currentUser, recipientId, recipientName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentUser || !recipientId || !isOpen) return;

    const db = getDatabase();
    // Create unique chat room ID (sorted to ensure consistency)
    const chatRoomId = [currentUser.uid, recipientId].sort().join("_");
    const chatRef = ref(db, `chats/${chatRoomId}`);
    const messagesQuery = query(chatRef, orderByChild("timestamp"), limitToLast(50));

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setMessages(messagesArray);
        setTimeout(scrollToBottom, 100);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser, recipientId, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const db = getDatabase();
    const chatRoomId = [currentUser.uid, recipientId].sort().join("_");
    const chatRef = ref(db, `chats/${chatRoomId}`);

    const message = {
      text: newMessage,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email.split("@")[0],
      recipientId: recipientId,
      timestamp: Date.now(),
    };

    try {
      await push(chatRef, message);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
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
      <button className="open-chat-btn" onClick={() => setIsOpen(true)}>
        💬 Chat with {recipientName}
      </button>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat with {recipientName}</h3>
        <button className="close-chat-btn" onClick={() => setIsOpen(false)}>
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

      <form onSubmit={handleSendMessage} className="chat-input-form">
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