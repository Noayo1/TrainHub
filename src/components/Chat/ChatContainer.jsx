import { useState, useEffect } from "react";
import socketService from "../../services/socketService";
import Chat from "./Chat";

export default function ChatContainer({
  currentUser,
  recipientId,
  recipientName,
  isOpen,
  onToggleChat,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleSendMessage = async (recipientId, messageText) => {
    if (!messageText.trim() || !currentUser) return;

    const messageData = {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email.split("@")[0],
      receiverId: recipientId,
      receiverName: recipientName,
      message: messageText.trim(),
      timestamp: Date.now(),
    };

    socketService.sendMessage(messageData);
  };

  return (
    <Chat
      recipientId={recipientId}
      recipientName={recipientName}
      messages={messages}
      currentUser={currentUser}
      isOpen={isOpen}
      loading={loading}
      onToggleChat={onToggleChat}
      onSendMessage={handleSendMessage}
    />
  );
}
