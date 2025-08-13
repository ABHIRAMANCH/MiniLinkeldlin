import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API service functions
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) => 
    api.post('/auth/register', userData),
  
  getProfile: () => 
    api.get('/auth/me'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword })
};

export const userApi = {
  getProfile: (id: string) => 
    api.get(`/users/profile/${id}`),
  
  updateProfile: (data: any) => 
    api.put('/users/profile', data),
  
  searchUsers: (params: any) => 
    api.get('/users/search', { params }),
  
  getUserPosts: (id: string, params: any) => 
    api.get(`/users/${id}/posts`, { params }),
  
  followUser: (id: string) => 
    api.post(`/users/${id}/follow`),
  
  getSuggestions: () => 
    api.get('/users/suggestions')
};

export const postApi = {
  createPost: (data: any) => 
    api.post('/posts', data),
  
  getFeed: (params: any) => 
    api.get('/posts/feed', { params }),
  
  getPost: (id: string) => 
    api.get(`/posts/${id}`),
  
  likePost: (id: string) => 
    api.post(`/posts/${id}/like`),
  
  commentPost: (id: string, content: string) => 
    api.post(`/posts/${id}/comment`, { content }),
  
  sharePost: (id: string) => 
    api.post(`/posts/${id}/share`),
  
  deletePost: (id: string) => 
    api.delete(`/posts/${id}`),
  
  getPostsByHashtag: (tag: string, params: any) => 
    api.get(`/posts/hashtag/${tag}`, { params })
};

export const connectionApi = {
  sendRequest: (userId: string, message?: string) => 
    api.post('/connections/request', { userId, message }),
  
  getReceivedRequests: () => 
    api.get('/connections/requests/received'),
  
  getSentRequests: () => 
    api.get('/connections/requests/sent'),
  
  respondToRequest: (id: string, action: 'accept' | 'decline') => 
    api.put(`/connections/request/${id}/${action}`),
  
  getConnections: (params: any) => 
    api.get('/connections', { params }),
  
  removeConnection: (userId: string) => 
    api.delete(`/connections/${userId}`),
  
  getMutualConnections: (userId: string) => 
    api.get(`/connections/mutual/${userId}`)
};

export const jobApi = {
  createJob: (data: any) => 
    api.post('/jobs', data),
  
  getJobs: (params: any) => 
    api.get('/jobs', { params }),
  
  getJob: (id: string) => 
    api.get(`/jobs/${id}`),
  
  applyToJob: (id: string, data: any) => 
    api.post(`/jobs/${id}/apply`, data),
  
  getJobApplications: (id: string) => 
    api.get(`/jobs/${id}/applications`),
  
  updateApplicationStatus: (jobId: string, applicationId: string, status: string) => 
    api.put(`/jobs/${jobId}/applications/${applicationId}`, { status }),
  
  getMyApplications: (params: any) => 
    api.get('/jobs/my/applications', { params }),
  
  updateJob: (id: string, data: any) => 
    api.put(`/jobs/${id}`, data),
  
  deleteJob: (id: string) => 
    api.delete(`/jobs/${id}`)
};

export const messageApi = {
  sendMessage: (data: any) => 
    api.post('/messages', data),
  
  getConversation: (userId: string, params: any) => 
    api.get(`/messages/conversation/${userId}`, { params }),
  
  getConversations: () => 
    api.get('/messages/conversations'),
  
  markAsRead: (conversationId: string) => 
    api.put(`/messages/read/${conversationId}`),
  
  deleteConversation: (conversationId: string) => 
    api.delete(`/messages/conversation/${conversationId}`)
};

export const notificationApi = {
  getNotifications: (params: any) => 
    api.get('/notifications', { params }),
  
  markAsRead: (id: string) => 
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () => 
    api.put('/notifications/read-all'),
  
  deleteNotification: (id: string) => 
    api.delete(`/notifications/${id}`),
  
  clearAll: () => 
    api.delete('/notifications/clear-all')
};