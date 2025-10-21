// Feed.jsx (Updated with Comments and Navigation)
// Responsibility: Container that manages data and passes callbacks down

import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { getDatabase, ref, onValue, push, update, remove } from "firebase/database";
import Sidebar from "../SideBar/Sidebar";
import CreatePost from "./CreatePost";
import PostList from "./PostList";
import ProfileSidebar from "../SideBar/ProfileSidebar";
import FriendsList from "../friends/FriendsList";
import GroupsList from "../groups/GroupsList";
import "../../styles/Feed.css";
import "../../styles/Comments.css";
import "../../styles/Friends.css";
import "../../styles/Groups.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("home"); // home, friends, groups
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState({});
  const [sentRequests, setSentRequests] = useState({});
  const [receivedRequests, setReceivedRequests] = useState({});
  const [groups, setGroups] = useState([]);
  const [openChatId, setOpenChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState({});

  useEffect(() => {
    const user = auth.currentUser;
    setCurrentUser(user);

    const db = getDatabase();

    // Listen to posts
    const postsRef = ref(db, "posts");
    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        postsArray.sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
    });

    // Listen to users
    const usersRef = ref(db, "users");
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setAllUsers(usersArray);
      }
    });

    // Listen to friend relationships
    if (user) {
      const friendsRef = ref(db, `users/${user.uid}/friends`);
      const unsubscribeFriends = onValue(friendsRef, (snapshot) => {
        setFriends(snapshot.val() || {});
      });

      const sentRequestsRef = ref(db, `users/${user.uid}/sentRequests`);
      const unsubscribeSent = onValue(sentRequestsRef, (snapshot) => {
        setSentRequests(snapshot.val() || {});
      });

      const receivedRequestsRef = ref(db, `users/${user.uid}/receivedRequests`);
      const unsubscribeReceived = onValue(receivedRequestsRef, (snapshot) => {
        setReceivedRequests(snapshot.val() || {});
      });

      return () => {
        unsubscribePosts();
        unsubscribeUsers();
        unsubscribeFriends();
        unsubscribeSent();
        unsubscribeReceived();
      };
    }

    // Listen to groups
    const groupsRef = ref(db, "groups");
    const unsubscribeGroups = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const groupsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setGroups(groupsArray);
      } else {
        setGroups([]);
      }
    });

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
      unsubscribeGroups();
    };
  }, []);

  // ===== POST OPERATIONS =====
  const handleCreatePost = async (content) => {
    if (!content.trim()) return;

    const db = getDatabase();
    const postsRef = ref(db, "posts");

    const newPost = {
      content: content,
      authorId: currentUser.uid,
      authorEmail: currentUser.email,
      authorName: currentUser.displayName || currentUser.email.split("@")[0],
      timestamp: Date.now(),
      likes: 0,
      likedBy: {},
      comments: {},
    };

    try {
      await push(postsRef, newPost);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    }
  };

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
    const postRef = ref(db, `posts/${postId}`);

    try {
      await update(postRef, { content: newContent });
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);

    try {
      await remove(postRef);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  // ===== COMMENT OPERATIONS =====
  const handleAddComment = async (postId, commentText) => {
    if (!commentText.trim()) return;

    const db = getDatabase();
    const commentsRef = ref(db, `posts/${postId}/comments`);

    const newComment = {
      text: commentText,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || currentUser.email.split("@")[0],
      timestamp: Date.now(),
    };

    try {
      await push(commentsRef, newComment);
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    const db = getDatabase();
    const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);

    try {
      await remove(commentRef);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  // ===== FRIEND OPERATIONS =====
  const handleSendFriendRequest = async (recipientId) => {
    const db = getDatabase();
    
    try {
      // Add to sender's sent requests
      await update(ref(db, `users/${currentUser.uid}/sentRequests`), {
        [recipientId]: true
      });

      // Add to recipient's received requests
      await update(ref(db, `users/${recipientId}/receivedRequests`), {
        [currentUser.uid]: {
          userName: currentUser.displayName || currentUser.email.split("@")[0],
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request");
    }
  };

  const handleAcceptFriendRequest = async (senderId) => {
    const db = getDatabase();
    
    try {
      // Add to both users' friends lists
      await update(ref(db, `users/${currentUser.uid}/friends`), {
        [senderId]: true
      });
      await update(ref(db, `users/${senderId}/friends`), {
        [currentUser.uid]: true
      });

      // Remove from requests
      await remove(ref(db, `users/${currentUser.uid}/receivedRequests/${senderId}`));
      await remove(ref(db, `users/${senderId}/sentRequests/${currentUser.uid}`));
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request");
    }
  };

  const handleRejectFriendRequest = async (senderId) => {
    const db = getDatabase();
    
    try {
      await remove(ref(db, `users/${currentUser.uid}/receivedRequests/${senderId}`));
      await remove(ref(db, `users/${senderId}/sentRequests/${currentUser.uid}`));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    const db = getDatabase();
    
    try {
      await remove(ref(db, `users/${currentUser.uid}/friends/${friendId}`));
      await remove(ref(db, `users/${friendId}/friends/${currentUser.uid}`));
    } catch (error) {
      console.error("Error removing friend:", error);
      alert("Failed to remove friend");
    }
  };

  // ===== GROUP OPERATIONS =====
  const handleCreateGroup = async ({ name, description, isPrivate }) => {
    const db = getDatabase();
    const groupsRef = ref(db, "groups");

    const newGroup = {
      name,
      description,
      isPrivate,
      adminId: currentUser.uid,
      members: { [currentUser.uid]: true },
      joinRequests: {},
      createdAt: Date.now(),
    };

    try {
      await push(groupsRef, newGroup);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    }
  };

  const handleJoinGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    const db = getDatabase();

    try {
      if (group.isPrivate) {
        // Send join request
        await update(ref(db, `groups/${groupId}/joinRequests`), {
          [currentUser.uid]: {
            userName: currentUser.displayName || currentUser.email.split("@")[0],
            timestamp: Date.now()
          }
        });
        alert("Join request sent!");
      } else {
        // Join directly
        await update(ref(db, `groups/${groupId}/members`), {
          [currentUser.uid]: true
        });
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group");
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    const db = getDatabase();
    
    try {
      await remove(ref(db, `groups/${groupId}/members/${currentUser.uid}`));
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Failed to leave group");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    const db = getDatabase();
    
    try {
      await remove(ref(db, `groups/${groupId}`));
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group");
    }
  };

  const handleApproveJoinRequest = async (groupId, userId) => {
    const db = getDatabase();
    
    try {
      await update(ref(db, `groups/${groupId}/members`), {
        [userId]: true
      });
      await remove(ref(db, `groups/${groupId}/joinRequests/${userId}`));
    } catch (error) {
      console.error("Error approving join request:", error);
      alert("Failed to approve request");
    }
  };

  const handleRejectJoinRequest = async (groupId, userId) => {
    const db = getDatabase();
    
    try {
      await remove(ref(db, `groups/${groupId}/joinRequests/${userId}`));
    } catch (error) {
      console.error("Error rejecting join request:", error);
    }
  };

  return (
    <div className="feed-container">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <main className="feed-main">
        {currentView === "home" && (
          <>
            <CreatePost 
              currentUser={currentUser} 
              onCreatePost={handleCreatePost}
            />
            
            <PostList 
              posts={posts} 
              currentUser={currentUser}
              onLikePost={handleLikePost}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
            />
          </>
        )}

        {currentView === "friends" && (
          <FriendsList
            users={allUsers}
            currentUser={currentUser}
            friends={friends}
            sentRequests={sentRequests}
            receivedRequests={receivedRequests}
            onSendRequest={handleSendFriendRequest}
            onAcceptRequest={handleAcceptFriendRequest}
            onRejectRequest={handleRejectFriendRequest}
            onRemoveFriend={handleRemoveFriend}
          />
        )}

        {currentView === "groups" && (
          <GroupsList
            groups={groups}
            currentUser={currentUser}
            onCreateGroup={handleCreateGroup}
            onJoinGroup={handleJoinGroup}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
            onApproveRequest={handleApproveJoinRequest}
            onRejectRequest={handleRejectJoinRequest}
          />
        )}
      </main>

      <ProfileSidebar currentUser={currentUser} />
    </div>
  );
}