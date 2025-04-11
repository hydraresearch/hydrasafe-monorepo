// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:5000/uploads';
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'http://localhost:5000/public-api';

// App Configuration
export const APP_NAME = 'HydraSafe CMS';
export const APP_DESCRIPTION = 'Content Management System for HydraSafe';

// Theme Configuration
export const THEME = {
  primary: '#3DB4F2',   // Brand primary color
  secondary: '#1F2937', // Secondary color for buttons
  error: '#DC2626',     // Error color
  success: '#10B981',   // Success color
  warning: '#FBBF24',   // Warning color
  info: '#3B82F6',      // Info color
};

// Default page size for list pages
export const DEFAULT_PAGE_SIZE = 10;

// Editor configuration
export const EDITOR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

// Maximum file upload size (in bytes)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB