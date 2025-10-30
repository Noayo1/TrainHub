// firebaseStorageService.js - OPTIMIZED VERSION with Image Compression
// Fixes slow uploads by compressing images before upload!

import { storage } from "../components/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

class FirebaseStorageService {
  /**
   * Compress image before upload (makes uploads MUCH faster!)
   * @param {File} file - Image file to compress
   * @returns {Promise<File>} Compressed image file
   */
  async compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1080;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height / width) * maxWidth;
              width = maxWidth;
            } else {
              width = (width / height) * maxHeight;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              console.log(
                `Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(
                  compressedFile.size /
                  1024 /
                  1024
                ).toFixed(2)}MB`
              );
              resolve(compressedFile);
            },
            "image/jpeg",
            0.8
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload file to Firebase Storage
   * @param {File} file - File to upload
   * @param {string} folder - Storage folder
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<string>} Download URL
   */
  async uploadFile(file, folder = "posts", onProgress = null) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const filename = `${folder}/${timestamp}_${randomId}_${file.name}`;

      const storageRef = ref(storage, filename);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File uploaded:", downloadURL);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Upload multiple images with compression
   * @param {File[]} files - Array of image files
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<string[]>} Array of download URLs
   */
  async uploadImages(files, onProgress = null) {
    const urls = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      if (!file.type.startsWith("image/")) {
        throw new Error(`${file.name} is not an image`);
      }

      console.log(`Compressing image ${i + 1}/${totalFiles}...`);
      file = await this.compressImage(file);

      const url = await this.uploadFile(file, "posts/images", (progress) => {
        if (onProgress) {
          const overallProgress = (i * 100 + progress) / totalFiles;
          onProgress(overallProgress);
        }
      });

      urls.push(url);
    }

    return urls;
  }

  /**
   * Upload video (no compression - keeps quality)
   * @param {File} file - Video file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<string>} Download URL
   */
  async uploadVideo(file, onProgress = null) {
    if (!file.type.startsWith("video/")) {
      throw new Error("File must be a video");
    }

    return this.uploadFile(file, "posts/videos", onProgress);
  }

  async deleteFile(url) {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
      console.log("File deleted");
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  getFileType(file) {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "unknown";
  }

  getFileSize(file) {
    const bytes = file.size;
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new FirebaseStorageService();
