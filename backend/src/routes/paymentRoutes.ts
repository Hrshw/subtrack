import express from 'express';
import { requireAuth } from '../middleware/auth';
import {
    createPaymentSession,
    handlePolarWebhook,
    handlePaymentSuccess,
    getSubscriptionStatus,
    syncSubscription,
    manualUpgrade
} from '../controllers/paymentController';

const router = express.Router();

// POST /payment/create-session - Create Polar checkout session (protected)
router.post('/create-session', requireAuth, createPaymentSession);

// POST /payment/webhook - Polar webhook handler (public - Polar calls this)
router.post('/webhook', express.raw({ type: 'application/json' }), handlePolarWebhook);

// GET /payment/success - Redirect after successful payment
router.get('/success', handlePaymentSuccess);

// GET /payment/status - Get user's subscription status (protected)
router.get('/status', requireAuth, getSubscriptionStatus);

// POST /payment/sync - Sync subscription status from Polar (protected)
router.post('/sync', requireAuth, syncSubscription);

// POST /payment/manual-upgrade - Admin endpoint to manually upgrade user
router.post('/manual-upgrade', requireAuth, manualUpgrade);

export default router;

