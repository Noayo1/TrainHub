import { useState, useEffect, useRef } from "react";
import socketService from "../../services/socketService";

export default function ChatWindow({
  currentUser,
  recipientId,
  recipientName,
  onBack,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!recipientId || !currentUser) return;

    setLoading(true);
    setMessages([]);

    socketService.getChatHistory(currentUser.uid, recipientId, (history) => {
      const transformed = history.map((msg) => ({
        id: msg.id || msg.timestamp,
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.message,
        timestamp: msg.timestamp,
      }));
      setMessages(transformed);
      setLoading(false);
    });

    const handleReceiveMessage = (data) => {
      const isThisConvo =
        (data.senderId === recipientId &&
          data.receiverId === currentUser.uid) ||
        (data.senderId === currentUser.uid && data.receiverId === recipientId);

      if (isThisConvo) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.id);
          if (exists) return prev;

          return [
            ...prev,
            {
              id: data.id || Date.now(),
              senderId: data.senderId,
              senderName: data.senderName,
              text: data.message,
              timestamp: data.timestamp,
            },
          ];
        });
      }
    };

    const handleMessageSent = (data) => {
      if (
        data.senderId === currentUser.uid &&
        data.receiverId === recipientId
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.id);
          if (exists) return prev;

          return [
            ...prev,
            {
              id: data.id || Date.now(),
              senderId: data.senderId,
              senderName: data.senderName,
              text: data.message,
              timestamp: data.timestamp,
            },
          ];
        });
      }
    };

    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onMessageSent(handleMessageSent);

    return () => {
      socketService.removeListener("receive-message");
      socketService.removeListener("message-sent");
    };
  }, [recipientId, currentUser]);

  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, loading]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email.split("@")[0],
      receiverId: recipientId,
      receiverName: recipientName,
      message: newMessage.trim(),
      timestamp: Date.now(),
    };

    socketService.sendMessage(messageData);
    setNewMessage("");
  };

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

  return (
    <div className="chat-window-container">
      <button className="back-to-list-btn" onClick={onBack}>
        ← Back to chats
      </button>
      <div className="chat-messages-area">
        {loading && <div className="chat-loading">Loading messages...</div>}

        {!loading && messages.length === 0 && (
          <div className="no-messages-yet">
            <p>No messages yet</p>
            <p className="hint">Start the conversation! 👋</p>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <>
            {messages.map((message) => {
              const isSent = message.senderId === currentUser.uid;
              return (
                <div
                  key={message.id}
                  className={`chat-message ${isSent ? "sent" : "received"}`}
                >
                  <div className="message-bubble">
                    <p className="message-text">{message.text}</p>
                    <span className="message-timestamp">
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
      <form className="chat-input-area" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-message-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
          maxLength={1000}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!newMessage.trim() || loading}
        >
          Send
        </button>
      </form>
    </div>
  );
}
