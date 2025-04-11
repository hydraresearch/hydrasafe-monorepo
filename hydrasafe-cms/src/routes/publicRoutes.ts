import express from 'express';
import { apiKeyAuth } from '../middleware/apiKey';
import {
  getPublishedContent,
  getPublishedContentById,
  getPublishedContentBySlug,
  getPublishedContentByType,
} from '../controllers/publicController';

const router = express.Router();

// Public content endpoints - API key required
router.use(apiKeyAuth);

// Content routes
router.get('/content', getPublishedContent);
router.get('/content/:id', getPublishedContentById);
router.get('/content/slug/:slug', getPublishedContentBySlug);
router.get('/content/type/:type', getPublishedContentByType);

export default router;