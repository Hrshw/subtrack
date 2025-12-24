import express from 'express';
import { requireAuth } from '../middleware/auth';
import { createPaymentSession, handlePaymentSuccess, handlePaymentFailure } from '../controllers/paymentController';

const router = express.Router();

// POST /payment/create-session - Create PayU payment session (protected)
router.post('/create-session', requireAuth, createPaymentSession);

// POST /payment/success - PayU success callback (public - PayU calls this)
router.post('/success', handlePaymentSuccess);

// POST /payment/failure - PayU failure callback (public - PayU calls this)
router.post('/failure', handlePaymentFailure);

export default router;
