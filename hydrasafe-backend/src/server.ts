import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { connectDatabase } from '@hydrasafe/common/dist/utils/db';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/security';
import { walletRoutes } from './routes/wallet';
import { transactionRoutes } from './routes/transaction';
import { authRoutes } from './routes/auth';
import { configureLogger } from './utils/logger';

const app = express();
const logger = configureLogger();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());

// Custom security middleware
app.use(securityMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transaction', transactionRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
