# HydraSafe Headless CMS

A modern headless CMS for managing content across websites and applications.

## Project Structure

- **hydrasafe-cms**: Backend API server built with Express and MongoDB
- **hydrasafe-cms-frontend**: Admin dashboard built with Next.js

## Features

- **Content Management**: Create, edit, and organize content with a flexible content model
- **Media Library**: Upload and manage images and other media files
- **User Management**: Manage users with different roles and permissions
- **API Access**: Generate and manage API keys for headless CMS functionality
- **Preview**: Preview your content on your website before publishing

## Headless CMS Functionality

HydraSafe CMS works as a headless CMS, allowing you to:

1. Create and manage content through the admin interface
2. Access content via RESTful APIs using API keys
3. Use the content in any frontend application or website
4. Preview content directly on your website before publishing

### API Endpoints

The following endpoints are available for accessing content:

- `GET /public-api/content` - Get all published content
- `GET /public-api/content/:id` - Get content by ID
- `GET /public-api/content/slug/:slug` - Get content by slug
- `GET /public-api/content/type/:type` - Get content by type (page, post, product)

All requests to the public API require an API key to be included in the request header:

```
X-API-Key: your_api_key_here
```

## Setup Instructions

### Backend (hydrasafe-cms)

1. Install dependencies:
   ```
   cd hydrasafe-mvp/hydrasafe-cms
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` and update the values

3. Start the development server:
   ```
   npm run dev
   ```

### Frontend (hydrasafe-cms-frontend)

1. Install dependencies:
   ```
   cd hydrasafe-mvp/hydrasafe-cms-frontend
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env.local` and update the values

3. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Access the admin dashboard at `http://localhost:3001`
2. Login with your credentials
3. Create and manage content through the dashboard
4. Generate API keys to access content via the public API
5. Use the content in your website or application

## Example Frontend Integration

```javascript
// Example: Fetching content from your website
async function fetchContent() {
  const response = await fetch('http://your-cms-url/public-api/content', {
    headers: {
      'X-API-Key': 'your_api_key_here'
    }
  });
  
  const data = await response.json();
  return data.data; // Your content array
}
```