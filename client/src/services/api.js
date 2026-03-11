import axios from 'axios';
import useStore from '../store/useStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor for JWT
// IMPORTANT: Read from Zustand's in-memory state (getState()), NOT localStorage.
// This avoids a race condition where setToken() updates memory but persist
// hasn't flushed to localStorage yet, causing a missing Authorization header.
api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only try refresh on 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await api.post('/auth/refresh');
        const newToken = refreshRes.data.jwt;
        useStore.getState().setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh failed — log out
        useStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: (googleToken) => api.post('/auth/google', { token: googleToken }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

export const keyService = {
  saveKey: (apiKey) => api.post('/key/save', { apiKey }),
  deleteKey: () => api.delete('/key'),
};

export const repoService = {
  getRepos: () => api.get('/repo'),
  getRepo: (id) => api.get(`/repo/${id}`),
  cloneRepo: (url) => api.post('/repo/clone', { url }),
  reindexRepo: (id) => api.post(`/repo/${id}/reindex`),
  deleteRepo: (id) => api.delete(`/repo/${id}`),
  generateReadme: (id) => api.post(`/repo/${id}/readme`),
  getHeatmap: (id) => api.get(`/repo/${id}/heatmap`),
  getCommitSummary: (id) => api.get(`/repo/${id}/commits/summary`),
  getFileContent: (id, path) => api.get(`/repo/${id}/file`, { params: { path } }),
  getFileTree: (id) => api.get(`/repo/${id}/tree`),
  uploadFolder: (formData) => api.post('/repo/upload-folder', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadFile: (formData) => api.post('/repo/upload-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  saveSnippet: (repoId, snippet) => api.post(`/repo/${repoId}/snippets`, snippet),
  deleteSnippet: (repoId, snippetId) => api.delete(`/repo/${repoId}/snippets/${snippetId}`),
};

export const chatService = {
  sendMessage: (repoId, question) => api.post('/chat/message', { repoId, question }),
  getHistory: (repoId) => api.get(`/chat/${repoId}/history`),
};

export default api;
