// CreatePost.jsx - Updated with Canvas Drawing
import { useState } from "react";
import CanvasDrawing from "../Media/CanvasDrawing";

export default function CreatePost({ currentUser, onCreatePost }) {
  const [newPostContent, setNewPostContent] = useState("");
  const [showCanvas, setShowCanvas] = useState(false);
  const [drawingImage, setDrawingImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPostContent.trim() && !drawingImage) {
      alert("Please write something or attach a drawing!");
      return;
    }
    
    // Pass both text and drawing to parent
    await onCreatePost(newPostContent, drawingImage);
    
    // Clear form
    setNewPostContent("");
    setDrawingImage(null);
  };

  const handleSaveDrawing = (imageData) => {
    setDrawingImage(imageData);
    setShowCanvas(false);
  };

  const handleRemoveDrawing = () => {
    setDrawingImage(null);
  };

  return (
    <div className="new-post-card">
      <h2 className="new-post-title">New Post</h2>
      
      {!showCanvas ? (
        <form onSubmit={handleSubmit} className="new-post-form">
          <textarea
            className="new-post-textarea"
            placeholder="What's on your mind? Share your workout, achievement, or sports tips..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows="4"
          />

          {/* Drawing Preview */}
          {drawingImage && (
            <div className="drawing-preview">
              <img 
                src={drawingImage} 
                alt="Your drawing" 
                style={{
                  maxWidth: "100%",
                  borderRadius: "8px",
                  border: "2px solid var(--border-color)"
                }}
              />
              <button 
                type="button"
                className="remove-drawing-btn"
                onClick={handleRemoveDrawing}
              >
                ✕ Remove Drawing
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: "flex", 
            gap: "10px", 
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <button 
              type="button" 
              className="canvas-btn"
              onClick={() => setShowCanvas(true)}
              style={{
                padding: "10px 20px",
                background: "var(--gradient-secondary)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              🎨 Add Drawing
            </button>
            
            <button type="submit" className="post-button">
              Post
            </button>
          </div>
        </form>
      ) : (
        <CanvasDrawing 
          onSave={handleSaveDrawing}
          onCancel={() => setShowCanvas(false)}
        />
      )}
    </div>
  );
}