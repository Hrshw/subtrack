import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getProfile, syncUser } from '../controllers/userController';

const router = express.Router();

// Public webhook route
router.post('/webhook', syncUser);

// Protected routes
router.get('/me', requireAuth, getProfile);

export default router;
