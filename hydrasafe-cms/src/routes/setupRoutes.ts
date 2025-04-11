import express from 'express';
import {
  checkSetupStatus,
  setupAdmin,
  setupSystem
} from '../controllers/setupController';

const router = express.Router();

router.get('/status', checkSetupStatus);
router.post('/admin', setupAdmin);
router.post('/system', setupSystem);

export default router;