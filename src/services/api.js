const API_BASE_URL = "http://localhost:5000/api";

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

export const userAPI = {
  createUser: (userData) =>
    apiRequest("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  getUser: (userId) => apiRequest(`/users/${userId}`),

  getAllUsers: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/users${query ? `?${query}` : ""}`);
  },

  updateUser: (userId, updates) =>
    apiRequest(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteUser: (userId) =>
    apiRequest(`/users/${userId}`, {
      method: "DELETE",
    }),

  searchUsers: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/users/search/advanced?${query}`);
  },
};

export const postAPI = {
  createPost: (postData) =>
    apiRequest("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    }),

  getPost: (postId) => apiRequest(`/posts/${postId}`),

  getAllPosts: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/posts${query ? `?${query}` : ""}`);
  },

  updatePost: (postId, userId, updates) =>
    apiRequest(`/posts/${postId}?userId=${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deletePost: (postId, userId) =>
    apiRequest(`/posts/${postId}?userId=${userId}`, {
      method: "DELETE",
    }),

  searchPosts: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/posts/search/advanced?${query}`);
  },
};

export const groupAPI = {
  createGroup: (groupData) =>
    apiRequest("/groups", {
      method: "POST",
      body: JSON.stringify(groupData),
    }),

  getGroup: (groupId, userId) =>
    apiRequest(`/groups/${groupId}?userId=${userId}`),

  getAllGroups: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/groups${query ? `?${query}` : ""}`);
  },

  updateGroup: (groupId, userId, updates) =>
    apiRequest(`/groups/${groupId}?userId=${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteGroup: (groupId, userId) =>
    apiRequest(`/groups/${groupId}?userId=${userId}`, {
      method: "DELETE",
    }),

  approveMember: (groupId, memberId, adminId) =>
    apiRequest(`/groups/${groupId}/approve/${memberId}?userId=${adminId}`, {
      method: "POST",
    }),

  searchGroups: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/groups/search/advanced?${query}`);
  },
};

export const chatAPI = {
  getChatHistory: (userId1, userId2) =>
    apiRequest(`/chat/history/${userId1}/${userId2}`),

  getConversations: (userId) => apiRequest(`/chat/conversations/${userId}`),

  markAsRead: (userId, partnerId) =>
    apiRequest(`/chat/read/${userId}/${partnerId}`, {
      method: "PUT",
    }),

  deleteMessage: (messageId, userId) =>
    apiRequest(`/chat/message/${messageId}?userId=${userId}`, {
      method: "DELETE",
    }),
};

const api = {
  userAPI,
  postAPI,
  groupAPI,
  chatAPI,
};

export default api;
