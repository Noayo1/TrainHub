// CreatePost.jsx - Firebase Storage + Multiple Images + Video in SAME POST
import { useState } from "react";
import CanvasDrawing from "../Media/CanvasDrawing";
import firebaseStorageService from "../../services/firebaseStorageService";

export default function CreatePost({ onCreatePost }) {
  const [newPostContent, setNewPostContent] = useState("");
  const [showCanvas, setShowCanvas] = useState(false);
  const [drawingImage, setDrawingImage] = useState(null);
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !newPostContent.trim() &&
      !drawingImage &&
      images.length === 0 &&
      !video
    ) {
      alert("Please add some content, media, or a drawing!");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let imageUrls = [];
      let videoUrl = null;

      // Upload images to Firebase Storage
      if (images.length > 0) {
        console.log(`Uploading ${images.length} images...`);
        const imageFiles = images.map((img) => img.file);
        imageUrls = await firebaseStorageService.uploadImages(
          imageFiles,
          (progress) => {
            setUploadProgress(progress * 0.6); // Images = 60% of progress
          }
        );
        console.log(`${imageUrls.length} images uploaded`);
      }

      // Upload video to Firebase Storage
      if (video) {
        console.log("Uploading video...");
        videoUrl = await firebaseStorageService.uploadVideo(
          video,
          (progress) => {
            const baseProgress = images.length > 0 ? 60 : 0;
            setUploadProgress(baseProgress + progress * 0.4); // Video = 40% of progress
          }
        );
        console.log("Video uploaded");
      }

      setUploadProgress(100);

      // Create post with both images AND video
      await onCreatePost(
        newPostContent || "",
        drawingImage,
        imageUrls.length > 0 ? imageUrls : null,
        videoUrl
      );

      // Clear form
      setNewPostContent("");
      setDrawingImage(null);
      setImages([]);
      setVideo(null);
      setVideoPreview(null);
      setUploadProgress(0);

      alert("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDrawing = (imageData) => {
    setDrawingImage(imageData);
    setShowCanvas(false);
  };

  const handleRemoveDrawing = () => {
    setDrawingImage(null);
  };

  // Handle multiple image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 images
    if (images.length + files.length > 5) {
      alert("Maximum 5 images per post");
      return;
    }

    const maxImageSize = 10 * 1024 * 1024;
    const validImages = [];

    for (const file of files) {
      // Validate it's an image
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        continue;
      }

      // Check size
      if (file.size > maxImageSize) {
        alert(`${file.name} exceeds 10MB limit`);
        continue;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        validImages.push({
          file: file,
          preview: e.target.result,
          id: Date.now() + Math.random(),
        });

        if (
          validImages.length ===
          files.filter(
            (f) => f.type.startsWith("image/") && f.size <= maxImageSize
          ).length
        ) {
          setImages((prev) => [...prev, ...validImages].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate it's a video
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    // Check size (50MB limit)
    const maxVideoSize = 50 * 1024 * 1024;
    if (file.size > maxVideoSize) {
      alert("Video must be less than 50MB");
      return;
    }

    setVideo(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  return (
    <div className="new-post-card">
      <h2 className="new-post-title">New Post</h2>

      {!showCanvas ? (
        <form onSubmit={handleSubmit} className="new-post-form">
          <textarea
            className="new-post-textarea"
            placeholder="What's on your mind? (optional - you can post just images/videos)"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows="4"
            disabled={uploading}
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
                  border: "2px solid var(--border-color)",
                }}
              />
              <button
                type="button"
                className="remove-drawing-btn"
                onClick={handleRemoveDrawing}
                disabled={uploading}
              >
                ✕ Remove Drawing
              </button>
            </div>
          )}

          {/* Multiple Images Preview */}
          {images.length > 0 && (
            <div className="images-preview-grid">
              {images.map((img) => (
                <div key={img.id} className="image-preview-item">
                  <img
                    src={img.preview}
                    alt="Preview"
                    className="preview-image-thumb"
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => handleRemoveImage(img.id)}
                    disabled={uploading}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video Preview */}
          {videoPreview && (
            <div className="media-preview">
              <video src={videoPreview} controls className="preview-video" />
              <button
                type="button"
                className="remove-media-btn"
                onClick={handleRemoveVideo}
                disabled={uploading}
              >
                ✕ Remove Video
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="progress-text">
                {uploadProgress < 100
                  ? `Uploading... ${uploadProgress.toFixed(0)}%`
                  : "Creating post..."}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="canvas-btn"
                onClick={() => setShowCanvas(true)}
                disabled={uploading}
                style={{
                  padding: "10px 20px",
                  background: "var(--gradient-secondary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: "600",
                  cursor: uploading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: uploading ? 0.5 : 1,
                }}
              >
                Drawing
              </button>

              {/* Multiple Images Button */}
              <label
                className="media-button"
                title="Add photos (max 5 images, 10MB each)"
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  border: "2px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  cursor:
                    uploading || images.length >= 5 ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: uploading || images.length >= 5 ? 0.5 : 1,
                }}
              >
                Photos {images.length > 0 && `(${images.length}/5)`}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                  disabled={uploading || images.length >= 5}
                />
              </label>

              <label
                className="media-button"
                title="Add video (max 50MB) - can be combined with images!"
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  border: "2px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  cursor: uploading || video ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: uploading || video ? 0.5 : 1,
                }}
              >
                Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  style={{ display: "none" }}
                  disabled={uploading || video !== null}
                />
              </label>
            </div>

            <button type="submit" className="post-button" disabled={uploading}>
              {uploading ? "Posting..." : "Post"}
            </button>
          </div>

          {(images.length > 0 || video) && (
            <div className="file-info">
              <small>
                {images.length > 0 &&
                  `${images.length} image${images.length > 1 ? "s" : ""}`}
                {images.length > 0 && video && " + "}
                {video && `${firebaseStorageService.getFileSize(video)}`}
              </small>
            </div>
          )}
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
