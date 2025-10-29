import Post from "./Post";

export default function PostList({
  posts,
  currentUser,
  onLikePost,
  onUpdatePost,
  onDeletePost,
  onAddComment,
  onDeleteComment,
}) {
  if (posts.length === 0) {
    return (
      <div className="posts-container">
        <div className="no-posts">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="posts-container">
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          currentUser={currentUser}
          onLikePost={onLikePost}
          onUpdatePost={onUpdatePost}
          onDeletePost={onDeletePost}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </div>
  );
}
