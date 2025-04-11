import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Check if we're in a browser environment and if we have a token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cms_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cms_token');
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) => 
    api.post('/auth/register', { name, email, password }),
  
  getProfile: () => 
    api.get('/auth/profile'),
  
  updateProfile: (userData: any) => 
    api.put('/auth/profile', userData),
};

// User management APIs
export const userAPI = {
  getAll: () => 
    api.get('/users'),
  
  getById: (id: string) => 
    api.get(`/users/${id}`),
  
  create: (userData: any) => 
    api.post('/users', userData),
  
  update: (id: string, userData: any) => 
    api.put(`/users/${id}`, userData),
  
  delete: (id: string) => 
    api.delete(`/users/${id}`),
};

// Content APIs
export const contentAPI = {
  getAll: (params?: any) => 
    api.get('/content', { params }),
  
  getById: (id: string) => 
    api.get(`/content/${id}`),
  
  getBySlug: (slug: string) => 
    api.get(`/content/slug/${slug}`),
  
  create: (contentData: any) => 
    api.post('/content', contentData),
  
  update: (id: string, contentData: any) => 
    api.put(`/content/${id}`, contentData),
  
  delete: (id: string) => 
    api.delete(`/content/${id}`),
};

// Media APIs
export const mediaAPI = {
  getAll: (params?: any) => 
    api.get('/media', { params }),
  
  getById: (id: string) => 
    api.get(`/media/${id}`),
  
  upload: (formData: FormData) => 
    api.post('/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  update: (id: string, mediaData: any) => 
    api.put(`/media/${id}`, mediaData),
  
  delete: (id: string) => 
    api.delete(`/media/${id}`),
};

export default api;