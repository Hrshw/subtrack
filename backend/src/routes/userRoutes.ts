import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getProfile, syncUser, updateProfile } from '../controllers/userController';

const router = express.Router();

// Public webhook route
router.post('/webhook', syncUser);

// Protected routes
router.get('/me', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);

export default router;
