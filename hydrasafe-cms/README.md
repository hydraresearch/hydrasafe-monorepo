# HydraSafe CMS

A Content Management System for the HydraSafe MVP project with MongoDB storage.

## Features

- User authentication and authorization with role-based access control
- Content management (pages, posts, products)
- Media library for file uploads and management
- RESTful API for frontend integration
- MongoDB database for data storage

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Security**: Helmet, bcrypt, input validation

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the CMS directory:
   ```bash
   cd /Users/nick/CascadeProjects/windsurf-project/hydrasafe-mvp/hydrasafe-cms
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
4. Configure environment variables:
   - Copy `.env` file and update with your settings
   - Make sure to set a secure JWT_SECRET
   - Configure MongoDB connection string

5. Build the application:
   ```bash
   npm run build
   # or
   yarn build
   ```

6. Start the server:
   ```bash
   npm start
   # or
   yarn start
   ```

7. For development mode:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)
- `PUT /api/auth/profile` - Update user profile (authenticated)

### Users (Admin only)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Content

- `POST /api/content` - Create new content (admin, editor)
- `GET /api/content` - Get all content
- `GET /api/content/:id` - Get content by ID
- `GET /api/content/slug/:slug` - Get content by slug
- `PUT /api/content/:id` - Update content (admin, editor)
- `DELETE /api/content/:id` - Delete content (admin, editor)

### Media

- `POST /api/media` - Upload media file (admin, editor)
- `GET /api/media` - Get all media files
- `GET /api/media/:id` - Get media by ID
- `PUT /api/media/:id` - Update media metadata (admin, editor)
- `DELETE /api/media/:id` - Delete media (admin, editor)

## User Roles

- **Admin**: Full access to all features
- **Editor**: Can create, update, and delete content and media
- **Viewer**: Can only view content

## Frontend Integration

To integrate with the existing HydraSafe frontend:

1. Update API endpoints in the frontend to use the CMS API
2. Add authentication handlers in the frontend
3. Create content management views in the admin dashboard

## Maintenance

- Run `npm run lint` to check for linting issues
- Regularly backup the MongoDB database
- Monitor server logs for errors

## Security Considerations

- Keep JWT_SECRET secure and change it periodically
- Implement rate limiting for API endpoints
- Regularly update dependencies
- Validate all user inputs
- Implement proper CORS configuration for production

## License

Proprietary - HydraSafe Project