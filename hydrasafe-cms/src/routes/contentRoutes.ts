import express from 'express';
import {
  createContent,
  getAllContent,
  getContentById,
  getContentBySlug,
  updateContent,
  deleteContent,
} from '../controllers/contentController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.route('/')
  .post(protect, authorize('admin', 'editor'), createContent)
  .get(protect, getAllContent);

router.route('/:id')
  .get(protect, getContentById)
  .put(protect, authorize('admin', 'editor'), updateContent)
  .delete(protect, authorize('admin', 'editor'), deleteContent);

router.get('/slug/:slug', protect, getContentBySlug);

export default router;