// EditProfileModal.jsx - Profile Editing Modal
import { useState, useRef } from "react";
import { getDatabase, ref, update } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import "../../styles/EditProfileModal.css";

export default function EditProfileModal({
  currentUser,
  profileData,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    dateOfBirth: profileData?.dateOfBirth || "",
    lifeStatus: profileData?.lifeStatus || "single",
    favoriteSport: profileData?.favoriteSport || "",
    activityLevel: profileData?.activityLevel || "beginner",
    workoutType: profileData?.workoutType || "",
    favoriteTeam: profileData?.favoriteTeam || "",
    fitnessGoal: profileData?.fitnessGoal || "",
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(
    profileData?.profilePictureUrl || null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setProfilePicture(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const db = getDatabase();
      const updates = { ...formData };

      // Upload profile picture if selected
      if (profilePicture) {
        const storage = getStorage();
        const imageRef = storageRef(
          storage,
          `profilePictures/${currentUser.uid}/${Date.now()}_${
            profilePicture.name
          }`
        );

        await uploadBytes(imageRef, profilePicture);
        const downloadURL = await getDownloadURL(imageRef);
        updates.profilePictureUrl = downloadURL;
      }

      // Update user profile in Firebase
      await update(ref(db, `users/${currentUser.uid}`), updates);

      alert("Profile updated successfully!");
      onSave(updates);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2> Edit Profile</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {/* Profile Picture Section */}
          <div className="form-section">
            <h3>Profile Picture</h3>
            <div className="profile-picture-section">
              <div className="profile-picture-preview">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile" />
                ) : (
                  <div className="default-avatar">
                    {currentUser.displayName?.[0]?.toUpperCase() ||
                      currentUser.email?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>
              <div className="profile-picture-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Photo
                </button>
                {profilePicturePreview && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => {
                      setProfilePicture(null);
                      setProfilePicturePreview(null);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="form-section">
            <h3>Personal Information</h3>

            <div className="form-field">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-field">
              <label>Life Status</label>
              <select
                name="lifeStatus"
                value={formData.lifeStatus}
                onChange={handleInputChange}
              >
                <option value="single">Single</option>
                <option value="in-relationship">In a Relationship</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>

          {/* Sports & Fitness */}
          <div className="form-section">
            <h3>Sports & Fitness</h3>

            <div className="form-field">
              <label>Favorite Sport</label>
              <input
                type="text"
                name="favoriteSport"
                placeholder="e.g., Running, Swimming, Basketball..."
                value={formData.favoriteSport}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-field">
              <label>Activity Level</label>
              <select
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleInputChange}
              >
                <option value="beginner">Beginner</option>
                <option value="amateur">Amateur</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div className="form-field">
              <label>Preferred Workout Type</label>
              <input
                type="text"
                name="workoutType"
                placeholder="e.g., Cardio, Strength Training, Yoga..."
                value={formData.workoutType}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-field">
              <label>Favorite Sports Team</label>
              <input
                type="text"
                name="favoriteTeam"
                placeholder="e.g., Lakers, Real Madrid..."
                value={formData.favoriteTeam}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-field">
              <label>Fitness Goal</label>
              <textarea
                name="fitnessGoal"
                placeholder="What are your fitness goals?"
                value={formData.fitnessGoal}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={uploading}>
              {uploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
