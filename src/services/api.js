// src/services/api.js
// API Service - Handles all backend API calls

const API_BASE_URL = "http://localhost:5000/api";

// Helper function to handle fetch requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// ===== USER API =====
export const userAPI = {
  // Create user
  createUser: (userData) =>
    apiRequest("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  // Get user by ID
  getUser: (userId) => apiRequest(`/users/${userId}`),

  // Get all users
  getAllUsers: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/users${query ? `?${query}` : ""}`);
  },

  // Update user
  updateUser: (userId, updates) =>
    apiRequest(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  // Delete user
  deleteUser: (userId) =>
    apiRequest(`/users/${userId}`, {
      method: "DELETE",
    }),

  // Search users
  searchUsers: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/users/search/advanced?${query}`);
  },
};

// ===== POST API =====
export const postAPI = {
  // Create post
  createPost: (postData) =>
    apiRequest("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    }),

  // Get post by ID
  getPost: (postId) => apiRequest(`/posts/${postId}`),

  // Get all posts
  getAllPosts: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/posts${query ? `?${query}` : ""}`);
  },

  // Update post
  updatePost: (postId, userId, updates) =>
    apiRequest(`/posts/${postId}?userId=${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  // Delete post
  deletePost: (postId, userId) =>
    apiRequest(`/posts/${postId}?userId=${userId}`, {
      method: "DELETE",
    }),

  // Search posts
  searchPosts: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/posts/search/advanced?${query}`);
  },
};

// ===== GROUP API =====
export const groupAPI = {
  // Create group
  createGroup: (groupData) =>
    apiRequest("/groups", {
      method: "POST",
      body: JSON.stringify(groupData),
    }),

  // Get group by ID
  getGroup: (groupId, userId) =>
    apiRequest(`/groups/${groupId}?userId=${userId}`),

  // Get all groups
  getAllGroups: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/groups${query ? `?${query}` : ""}`);
  },

  // Update group
  updateGroup: (groupId, userId, updates) =>
    apiRequest(`/groups/${groupId}?userId=${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  // Delete group
  deleteGroup: (groupId, userId) =>
    apiRequest(`/groups/${groupId}?userId=${userId}`, {
      method: "DELETE",
    }),

  // Approve member
  approveMember: (groupId, memberId, adminId) =>
    apiRequest(`/groups/${groupId}/approve/${memberId}?userId=${adminId}`, {
      method: "POST",
    }),

  // Search groups
  searchGroups: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/groups/search/advanced?${query}`);
  },
};

// ===== CHAT API =====
export const chatAPI = {
  // Get chat history
  getChatHistory: (userId1, userId2) =>
    apiRequest(`/chat/history/${userId1}/${userId2}`),

  // Get all conversations
  getConversations: (userId) => apiRequest(`/chat/conversations/${userId}`),

  // Mark messages as read
  markAsRead: (userId, partnerId) =>
    apiRequest(`/chat/read/${userId}/${partnerId}`, {
      method: "PUT",
    }),

  // Delete message
  deleteMessage: (messageId, userId) =>
    apiRequest(`/chat/message/${messageId}?userId=${userId}`, {
      method: "DELETE",
    }),
};

export default {
  userAPI,
  postAPI,
  groupAPI,
  chatAPI,
};
