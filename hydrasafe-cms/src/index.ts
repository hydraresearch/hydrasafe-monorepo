import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import connectDB from './config/db';
import errorHandler from './middleware/error';

// Route imports
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import contentRoutes from './routes/contentRoutes';
import mediaRoutes from './routes/mediaRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import setupRoutes from './routes/setupRoutes';

// Public API routes
import publicRoutes from './routes/publicRoutes';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for development
}));

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Setup route (before auth middleware)
app.use('/api/setup', setupRoutes);

// CMS Admin API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Public API for headless CMS consumption
app.use('/public-api', publicRoutes);

// Base route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'HydraSafe CMS API',
    version: '1.0.0',
  });
});

// Error handler
app.use(errorHandler);

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});
