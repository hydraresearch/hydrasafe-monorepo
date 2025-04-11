// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Content types
export interface Content {
  _id: string;
  title: string;
  slug: string;
  content: string;
  contentType: 'page' | 'post' | 'product';
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  author: string | User;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Media types
export interface Media {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  alt?: string;
  caption?: string;
  uploadedBy: string | User;
  createdAt: string;
  updatedAt: string;
}

// API Key types
export interface ApiKey {
  _id: string;
  name: string;
  key: string;
  createdBy: string | User;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  contentCount: number;
  mediaCount: number;
  userCount: number;
  apiKeyCount: number;
  recentContent: Content[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}