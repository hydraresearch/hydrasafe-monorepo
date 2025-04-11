import express from 'express';
import {
  createApiKey,
  getAllApiKeys,
  getApiKeyById,
  deleteApiKey,
} from '../controllers/apiKeyController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.route('/')
  .post(protect, authorize('admin', 'editor'), createApiKey)
  .get(protect, authorize('admin', 'editor'), getAllApiKeys);

router.route('/:id')
  .get(protect, authorize('admin', 'editor'), getApiKeyById)
  .delete(protect, authorize('admin', 'editor'), deleteApiKey);

export default router;