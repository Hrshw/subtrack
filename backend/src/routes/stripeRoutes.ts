import express from 'express';
import { requireAuth } from '../middleware/auth';
import { createCheckoutSession, handleWebhook } from '../controllers/stripeController';

const router = express.Router();

router.post('/create-checkout-session', requireAuth, createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
