// Feed.jsx - FINAL CORRECTED VERSION
// All backend integrations + all imports fixed

import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { postAPI, groupAPI } from "../../services/api";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  push,
} from "firebase/database";
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
  const [filteredPosts, setFilteredPosts] = useState([]);
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

    const db = getDatabase();

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

    const usersRef = ref(db, "users");
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setAllUsers(usersArray);
      } else {
        setAllUsers([]);
      }
    });

    if (user) {
      const friendsRef = ref(db, `users/${user.uid}/friends`);
      const unsubscribeFriends = onValue(friendsRef, (snapshot) => {
        setFriends(snapshot.val() || {});
      });

      const sentRef = ref(db, `users/${user.uid}/sentRequests`);
      const unsubscribeSent = onValue(sentRef, (snapshot) => {
        setSentRequests(snapshot.val() || {});
      });

      const receivedRef = ref(db, `users/${user.uid}/receivedRequests`);
      const unsubscribeReceived = onValue(receivedRef, (snapshot) => {
        setReceivedRequests(snapshot.val() || {});
      });

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
        unsubscribeFriends();
        unsubscribeSent();
        unsubscribeReceived();
        unsubscribeGroups();
      };
    }

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    if (currentView === "home") {
      const friendIds = Object.keys(friends);
      const filtered = posts.filter(
        (post) =>
          post.authorId === currentUser.uid ||
          friendIds.includes(post.authorId) ||
          (post.groupId && groups.some((g) => g.members?.[currentUser.uid]))
      );
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(posts);
    }
  }, [currentView, posts, friends, currentUser, groups]);

  const handleCreatePost = async (
    newPostContent,
    drawingImage,
    imageUrls,
    videoUrl
  ) => {
    if (
      !newPostContent?.trim() &&
      !drawingImage &&
      (!imageUrls || imageUrls.length === 0) &&
      !videoUrl
    ) {
      alert("Post must have content, drawing, image, or video");
      return;
    }

    const postData = {
      content: newPostContent || "",
      drawingImage: drawingImage || null,
      imageUrls: imageUrls || null,
      videoUrl: videoUrl || null,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || currentUser.email.split("@")[0],
    };

    try {
      await postAPI.createPost(postData);
      alert("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post: " + error.message);
      throw error;
    }
  };

  const handleUpdatePost = async (postId, newContent) => {
    if (!newContent.trim()) {
      alert("Post content cannot be empty");
      return;
    }

    try {
      await postAPI.updatePost(postId, currentUser.uid, {
        content: newContent,
      });
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post: " + error.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await postAPI.deletePost(postId, currentUser.uid);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post: " + error.message);
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
      alert("Failed to like post");
    }
  };

  const handleAddComment = async (postId, text) => {
    if (!text.trim()) return;

    const db = getDatabase();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      const commentId = Date.now().toString();
      const newComment = {
        text,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email.split("@")[0],
        timestamp: Date.now(),
      };

      const updatedComments = {
        ...post.comments,
        [commentId]: newComment,
      };

      const postRef = ref(db, `posts/${postId}`);
      await update(postRef, { comments: updatedComments });
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    const db = getDatabase();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      const updatedComments = { ...post.comments };
      delete updatedComments[commentId];

      const postRef = ref(db, `posts/${postId}`);
      await update(postRef, { comments: updatedComments });
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
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
      alert("Failed to send friend request");
    }
  };

  const handleAcceptFriendRequest = async (friendId) => {
    const db = getDatabase();
    try {
      await update(ref(db, `users/${currentUser.uid}/friends`), {
        [friendId]: true,
      });
      await update(ref(db, `users/${friendId}/friends`), {
        [currentUser.uid]: true,
      });

      await remove(
        ref(db, `users/${currentUser.uid}/receivedRequests/${friendId}`)
      );
      await remove(
        ref(db, `users/${friendId}/sentRequests/${currentUser.uid}`)
      );
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request");
    }
  };

  const handleRejectFriendRequest = async (friendId) => {
    const db = getDatabase();
    try {
      await remove(
        ref(db, `users/${currentUser.uid}/receivedRequests/${friendId}`)
      );
      await remove(
        ref(db, `users/${friendId}/sentRequests/${currentUser.uid}`)
      );
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      alert("Failed to reject friend request");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("Remove this friend?")) return;

    const db = getDatabase();
    try {
      await remove(ref(db, `users/${currentUser.uid}/friends/${friendId}`));
      await remove(ref(db, `users/${friendId}/friends/${currentUser.uid}`));
    } catch (error) {
      console.error("Error removing friend:", error);
      alert("Failed to remove friend");
    }
  };

  const handleCreateGroup = async ({ name, description, isPrivate }) => {
    if (!name.trim()) {
      alert("Group name cannot be empty");
      return;
    }

    const groupData = {
      name,
      description: description || "",
      isPrivate: isPrivate || false,
      adminId: currentUser.uid,
    };

    try {
      await groupAPI.createGroup(groupData);
      alert("Group created successfully!");
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group: " + error.message);
    }
  };

  const handleJoinGroup = async (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      alert("Group not found");
      return;
    }

    const db = getDatabase();

    try {
      if (group.isPrivate) {
        await update(ref(db, `groups/${groupId}/joinRequests`), {
          [currentUser.uid]: {
            userName:
              currentUser.displayName || currentUser.email.split("@")[0],
            timestamp: Date.now(),
          },
        });
        alert("Join request sent!");
      } else {
        await update(ref(db, `groups/${groupId}/members`), {
          [currentUser.uid]: true,
        });
        alert("You joined the group!");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group");
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm("Leave this group?")) return;

    const db = getDatabase();
    try {
      await remove(ref(db, `groups/${groupId}/members/${currentUser.uid}`));
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Failed to leave group");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Delete this group?")) return;

    try {
      await groupAPI.deleteGroup(groupId, currentUser.uid);
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group: " + error.message);
    }
  };

  const handleApproveJoinRequest = async (groupId, userId) => {
    const db = getDatabase();
    try {
      await update(ref(db, `groups/${groupId}/members`), {
        [userId]: true,
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
      alert("Failed to reject request");
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="feed-container">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <div className="feed-main">
        {currentView === "home" && (
          <>
            <CreatePost
              currentUser={currentUser}
              onCreatePost={handleCreatePost}
            />
            <PostList
              posts={filteredPosts}
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
      </div>

      <ProfileSidebar currentUser={currentUser} />
    </div>
  );
}
