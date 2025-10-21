// Feed.jsx (FIXED - Updated with Comments and Navigation)
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
  const [currentView, setCurrentView] = useState("home");
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState({});
  const [sentRequests, setSentRequests] = useState({});
  const [receivedRequests, setReceivedRequests] = useState({});
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    setCurrentUser(user);

    if (!user) {
      console.error("❌ No user logged in!");
      return;
    }

    console.log("✅ Current user:", user.uid, user.email);

    const db = getDatabase();

    // Listen to posts
    const postsRef = ref(db, "posts");
    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("📝 Posts data:", data);
      if (data) {
        const postsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        postsArray.sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsArray);
        console.log("✅ Posts loaded:", postsArray.length);
      } else {
        setPosts([]);
        console.log("⚠️ No posts found");
      }
    });

    // Listen to users
    const usersRef = ref(db, "users");
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      console.log("👥 Users data:", data);
      if (data) {
        const usersArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setAllUsers(usersArray);
        console.log("✅ Users loaded:", usersArray.length);
      } else {
        setAllUsers([]);
        console.log("⚠️ No users found");
      }
    });

    // Listen to groups
    const groupsRef = ref(db, "groups");
    const unsubscribeGroups = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("👥 Groups data:", data);
      if (data) {
        const groupsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setGroups(groupsArray);
        console.log("✅ Groups loaded:", groupsArray.length);
      } else {
        setGroups([]);
        console.log("⚠️ No groups found");
      }
    });

    // Listen to friend relationships (only if user exists)
    const friendsRef = ref(db, `users/${user.uid}/friends`);
    const unsubscribeFriends = onValue(friendsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("👫 Friends data:", data);
      setFriends(data || {});
    });

    const sentRequestsRef = ref(db, `users/${user.uid}/sentRequests`);
    const unsubscribeSent = onValue(sentRequestsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("📤 Sent requests:", data);
      setSentRequests(data || {});
    });

    const receivedRequestsRef = ref(db, `users/${user.uid}/receivedRequests`);
    const unsubscribeReceived = onValue(receivedRequestsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("📥 Received requests:", data);
      setReceivedRequests(data || {});
    });

    // CLEANUP: Return all unsubscribe functions
    return () => {
      unsubscribePosts();
      unsubscribeUsers();
      unsubscribeGroups();
      unsubscribeFriends();
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, []);

  // ===== POST OPERATIONS =====
  const handleCreatePost = async (content) => {
    if (!content.trim()) {
      alert("Post content cannot be empty");
      return;
    }

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
      console.log("✅ Post created successfully");
    } catch (error) {
      console.error("❌ Error creating post:", error);
      alert("Failed to create post: " + error.message);
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
      console.error("❌ Error liking post:", error);
      alert("Failed to like post");
    }
  };

  const handleUpdatePost = async (postId, newContent) => {
    if (!newContent.trim()) {
      alert("Post content cannot be empty");
      return;
    }

    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);

    try {
      await update(postRef, { content: newContent });
      console.log("✅ Post updated successfully");
    } catch (error) {
      console.error("❌ Error updating post:", error);
      alert("Failed to update post: " + error.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    const db = getDatabase();
    const postRef = ref(db, `posts/${postId}`);

    try {
      await remove(postRef);
      console.log("✅ Post deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      alert("Failed to delete post: " + error.message);
    }
  };

  // ===== COMMENT OPERATIONS =====
  const handleAddComment = async (postId, commentText) => {
    if (!commentText.trim()) {
      alert("Comment cannot be empty");
      return;
    }

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
      console.log("✅ Comment added successfully");
    } catch (error) {
      console.error("❌ Error adding comment:", error);
      alert("Failed to add comment: " + error.message);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    const db = getDatabase();
    const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);

    try {
      await remove(commentRef);
      console.log("✅ Comment deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting comment:", error);
      alert("Failed to delete comment: " + error.message);
    }
  };

  // ===== FRIEND OPERATIONS =====
  const handleSendFriendRequest = async (recipientId) => {
    const db = getDatabase();
    
    try {
      await update(ref(db, `users/${currentUser.uid}/sentRequests`), {
        [recipientId]: true
      });

      await update(ref(db, `users/${recipientId}/receivedRequests`), {
        [currentUser.uid]: {
          userName: currentUser.displayName || currentUser.email.split("@")[0],
          timestamp: Date.now()
        }
      });
      console.log("✅ Friend request sent");
    } catch (error) {
      console.error("❌ Error sending friend request:", error);
      alert("Failed to send friend request: " + error.message);
    }
  };

  const handleAcceptFriendRequest = async (senderId) => {
    const db = getDatabase();
    
    try {
      await update(ref(db, `users/${currentUser.uid}/friends`), {
        [senderId]: true
      });
      await update(ref(db, `users/${senderId}/friends`), {
        [currentUser.uid]: true
      });

      await remove(ref(db, `users/${currentUser.uid}/receivedRequests/${senderId}`));
      await remove(ref(db, `users/${senderId}/sentRequests/${currentUser.uid}`));
      console.log("✅ Friend request accepted");
    } catch (error) {
      console.error("❌ Error accepting friend request:", error);
      alert("Failed to accept friend request: " + error.message);
    }
  };

  const handleRejectFriendRequest = async (senderId) => {
    const db = getDatabase();
    
    try {
      await remove(ref(db, `users/${currentUser.uid}/receivedRequests/${senderId}`));
      await remove(ref(db, `users/${senderId}/sentRequests/${currentUser.uid}`));
      console.log("✅ Friend request rejected");
    } catch (error) {
      console.error("❌ Error rejecting friend request:", error);
      alert("Failed to reject request");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    const db = getDatabase();
    
    try {
      await remove(ref(db, `users/${currentUser.uid}/friends/${friendId}`));
      await remove(ref(db, `users/${friendId}/friends/${currentUser.uid}`));
      console.log("✅ Friend removed");
    } catch (error) {
      console.error("❌ Error removing friend:", error);
      alert("Failed to remove friend: " + error.message);
    }
  };

  // ===== GROUP OPERATIONS =====
  const handleCreateGroup = async ({ name, description, isPrivate }) => {
    if (!name.trim()) {
      alert("Group name cannot be empty");
      return;
    }

    console.log("🔧 Creating group:", { name, description, isPrivate });

    const db = getDatabase();
    const groupsRef = ref(db, "groups");

    const newGroup = {
      name,
      description: description || "",
      isPrivate: isPrivate || false,
      adminId: currentUser.uid,
      members: { [currentUser.uid]: true },
      joinRequests: {},
      createdAt: Date.now(),
    };

    try {
      const result = await push(groupsRef, newGroup);
      console.log("✅ Group created successfully:", result.key);
      alert("Group created successfully!");
    } catch (error) {
      console.error("❌ Error creating group:", error);
      alert("Failed to create group: " + error.message);
    }
  };

  const handleJoinGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      alert("Group not found");
      return;
    }

    const db = getDatabase();

    try {
      if (group.isPrivate) {
        await update(ref(db, `groups/${groupId}/joinRequests`), {
          [currentUser.uid]: {
            userName: currentUser.displayName || currentUser.email.split("@")[0],
            timestamp: Date.now()
          }
        });
        alert("Join request sent!");
        console.log("✅ Join request sent for private group");
      } else {
        await update(ref(db, `groups/${groupId}/members`), {
          [currentUser.uid]: true
        });
        alert("You joined the group!");
        console.log("✅ Joined public group");
      }
    } catch (error) {
      console.error("❌ Error joining group:", error);
      alert("Failed to join group: " + error.message);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;

    const db = getDatabase();
    
    try {
      await remove(ref(db, `groups/${groupId}/members/${currentUser.uid}`));
      console.log("✅ Left group");
    } catch (error) {
      console.error("❌ Error leaving group:", error);
      alert("Failed to leave group: " + error.message);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    const db = getDatabase();
    
    try {
      await remove(ref(db, `groups/${groupId}`));
      console.log("✅ Group deleted");
    } catch (error) {
      console.error("❌ Error deleting group:", error);
      alert("Failed to delete group: " + error.message);
    }
  };

  const handleApproveJoinRequest = async (groupId, userId) => {
    const db = getDatabase();
    
    try {
      await update(ref(db, `groups/${groupId}/members`), {
        [userId]: true
      });
      await remove(ref(db, `groups/${groupId}/joinRequests/${userId}`));
      console.log("✅ Join request approved");
    } catch (error) {
      console.error("❌ Error approving join request:", error);
      alert("Failed to approve request: " + error.message);
    }
  };

  const handleRejectJoinRequest = async (groupId, userId) => {
    const db = getDatabase();
    
    try {
      await remove(ref(db, `groups/${groupId}/joinRequests/${userId}`));
      console.log("✅ Join request rejected");
    } catch (error) {
      console.error("❌ Error rejecting join request:", error);
      alert("Failed to reject request");
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