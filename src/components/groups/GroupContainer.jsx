import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  push,
  get,
} from "firebase/database";
import GroupDetail from "./GroupDetail";

export default function GroupContainer({ currentUser }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState(null);
  const [groupPosts, setGroupPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !currentUser) return;

    setLoading(true);
    const db = getDatabase();

    const groupRef = ref(db, `groups/${groupId}`);
    const unsubGroup = onValue(groupRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGroupData({ id: groupId, ...data });

        if (data.members) {
          await loadMembers(Object.keys(data.members));
        }
      } else {
        setGroupData(null);
      }
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
        const filtered = allPosts.filter((post) => post.groupId === groupId);
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        setGroupPosts(filtered);
      } else {
        setGroupPosts([]);
      }
    });

    return () => {
      unsubGroup();
      unsubPosts();
    };
  }, [groupId, currentUser]);

  const loadMembers = async (memberIds) => {
    const db = getDatabase();
    const membersData = [];

    for (const memberId of memberIds) {
      try {
        const snapshot = await get(ref(db, `users/${memberId}`));
        if (snapshot.exists()) {
          membersData.push({ id: memberId, ...snapshot.val() });
        }
      } catch (error) {
        console.error("Error loading member:", error);
      }
    }
    setMembers(membersData);
  };

  const handleCreateGroupPost = async (groupId, content) => {
    if (!content.trim()) return;
    const db = getDatabase();
    try {
      await push(ref(db, "posts"), {
        content,
        authorId: currentUser.uid,
        authorEmail: currentUser.email,
        authorName: currentUser.displayName || currentUser.email.split("@")[0],
        timestamp: Date.now(),
        likes: 0,
        likedBy: {},
        comments: {},
        groupId: groupId,
      });
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleLikePost = async (postId, currentLikes, likedBy) => {
    const db = getDatabase();
    const hasLiked = likedBy && likedBy[currentUser.uid];

    try {
      if (hasLiked) {
        const updatedLikedBy = { ...likedBy };
        delete updatedLikedBy[currentUser.uid];
        await update(ref(db, `posts/${postId}`), {
          likes: currentLikes - 1,
          likedBy: updatedLikedBy,
        });
      } else {
        await update(ref(db, `posts/${postId}`), {
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

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm("Leave this group?")) return;
    const db = getDatabase();
    try {
      await remove(ref(db, `groups/${groupId}/members/${currentUser.uid}`));
      alert("You left the group");
      navigate("/");
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Delete this group and all its posts?")) return;
    const db = getDatabase();
    try {
      await remove(ref(db, `groups/${groupId}`));
      const snapshot = await get(ref(db, "posts"));
      if (snapshot.exists()) {
        const posts = snapshot.val();
        for (const [postId, post] of Object.entries(posts)) {
          if (post.groupId === groupId) {
            await remove(ref(db, `posts/${postId}`));
          }
        }
      }

      alert("Group deleted");
      navigate("/");
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <GroupDetail
      group={groupData}
      groupPosts={groupPosts}
      currentUser={currentUser}
      members={members}
      loading={loading}
      onCreateGroupPost={handleCreateGroupPost}
      onLikePost={handleLikePost}
      onUpdatePost={handleUpdatePost}
      onDeletePost={handleDeletePost}
      onAddComment={handleAddComment}
      onDeleteComment={handleDeleteComment}
      onLeaveGroup={handleLeaveGroup}
      onDeleteGroup={handleDeleteGroup}
      onBack={handleBack}
    />
  );
}
