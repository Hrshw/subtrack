import express from 'express';
import { requireAuth } from '../middleware/auth';
import { createPaymentSession, handlePaymentResponse } from '../controllers/paymentController';

const router = express.Router();

// POST /payment/create-session - Create PayU payment session (protected)
router.post('/create-session', requireAuth, createPaymentSession);

// POST /payment/response - Handle PayU callback (public - PayU calls this)
router.post('/response', handlePaymentResponse);

export default router;
