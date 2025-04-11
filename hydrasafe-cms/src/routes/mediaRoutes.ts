import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
} from '../controllers/mediaController';
import { protect, authorize } from '../middleware/auth';

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Filter files by type
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|svg|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|json|xml/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  
  cb(new Error('Invalid file type. Only image, document, and data files are allowed.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

const router = express.Router();

router.route('/')
  .post(protect, authorize('admin', 'editor'), upload.single('file'), uploadMedia)
  .get(protect, getAllMedia);

router.route('/:id')
  .get(protect, getMediaById)
  .put(protect, authorize('admin', 'editor'), updateMedia)
  .delete(protect, authorize('admin', 'editor'), deleteMedia);

export default router;