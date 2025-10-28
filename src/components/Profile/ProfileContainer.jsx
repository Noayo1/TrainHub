// ProfileContainer.jsx - FIXED WITH BACKEND INTEGRATION
// Responsibility: Fetch and manage profile data

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  push,
} from "firebase/database";
import { userAPI } from "../../services/api";
import UserProfile from "./UserProfile";
import ChatContainer from "../Chat/ChatContainer";

export default function ProfileContainer({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [friends, setFriends] = useState({});
  const [sentRequests, setSentRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  const handleToggleChat = (recipientId) => {
    setChatOpen(recipientId !== null);
  };

  useEffect(() => {
    if (!userId || !currentUser) return;

    setLoading(true);
    const db = getDatabase();

    const userRef = ref(db, `users/${userId}`);
    const unsubUser = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      setProfileUser(data ? { id: userId, ...data } : null);
      setLoading(false);
    });

    const postsRef = ref(db, "posts");
    const unsubPosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allPosts = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        const filtered = allPosts.filter((post) => post.authorId === userId);
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        setUserPosts(filtered);
      } else {
        setUserPosts([]);
      }
    });

    const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
    const unsubFriends = onValue(friendsRef, (snapshot) => {
      setFriends(snapshot.val() || {});
    });

    const sentRef = ref(db, `users/${currentUser.uid}/sentRequests`);
    const unsubSent = onValue(sentRef, (snapshot) => {
      setSentRequests(snapshot.val() || {});
    });

    return () => {
      unsubUser();
      unsubPosts();
      unsubFriends();
      unsubSent();
    };
  }, [userId, currentUser]);

  const handleLikePost = async (postId, currentLikes, likedBy) => {
    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);
    const hasLiked = likedBy && likedBy[currentUser.uid];

    try {
      if (hasLiked) {
        const updatedLikedBy = { ...likedBy };
        delete updatedLikedBy[currentUser.uid];
        await update(postRef, {
          likes: currentLikes - 1,
          likedBy: updatedLikedBy,
        });
      } else {
        await update(postRef, {
          likes: currentLikes + 1,
          likedBy: { ...likedBy, [currentUser.uid]: true },
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleUpdatePost = async (postId, newContent) => {
    if (!newContent.trim()) return;
    const db = getDatabase();
    try {
      await update(ref(db, `posts/${postId}`), { content: newContent });
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    const db = getDatabase();
    try {
      await remove(ref(db, `posts/${postId}`));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleAddComment = async (postId, text) => {
    if (!text.trim()) return;
    const db = getDatabase();
    try {
      await push(ref(db, `posts/${postId}/comments`), {
        text,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email.split("@")[0],
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    const db = getDatabase();
    try {
      await remove(ref(db, `posts/${postId}/comments/${commentId}`));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleSendFriendRequest = async (friendId) => {
    const db = getDatabase();
    try {
      await update(ref(db, `users/${currentUser.uid}/sentRequests`), {
        [friendId]: true,
      });
      await update(ref(db, `users/${friendId}/receivedRequests`), {
        [currentUser.uid]: true,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("Remove this friend?")) return;
    const db = getDatabase();
    try {
      await update(
        ref(db, `users/${currentUser.uid}/friends/${friendId}`),
        null
      );
      await update(
        ref(db, `users/${friendId}/friends/${currentUser.uid}`),
        null
      );
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleUpdateProfile = async (updates) => {
    try {
      await userAPI.updateUser(currentUser.uid, updates);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!profileUser) {
    return <div>User not found</div>;
  }

  return (
    <>
      <UserProfile
        profileUser={profileUser}
        userPosts={userPosts}
        currentUser={currentUser}
        friends={friends}
        sentRequests={sentRequests}
        loading={loading}
        onLikePost={handleLikePost}
        onUpdatePost={handleUpdatePost}
        onDeletePost={handleDeletePost}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onSendFriendRequest={handleSendFriendRequest}
        onRemoveFriend={handleRemoveFriend}
        onToggleChat={handleToggleChat}
        onUpdateProfile={handleUpdateProfile}
        onBack={handleBack}
      />
      {chatOpen && (
        <ChatContainer
          currentUser={currentUser}
          recipientId={userId}
          onClose={() => setChatOpen(false)}
        />
      )}
    </>
  );
}
