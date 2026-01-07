"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const paymentController_1 = require("../controllers/paymentController");
const router = express_1.default.Router();
// POST /payment/create-session - Create Polar checkout session (protected)
router.post('/create-session', auth_1.requireAuth, paymentController_1.createPaymentSession);
// POST /payment/webhook - Polar webhook handler (public - Polar calls this)
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), paymentController_1.handlePolarWebhook);
// GET /payment/success - Redirect after successful payment
router.get('/success', paymentController_1.handlePaymentSuccess);
// GET /payment/status - Get user's subscription status (protected)
router.get('/status', auth_1.requireAuth, paymentController_1.getSubscriptionStatus);
// POST /payment/sync - Sync subscription status from Polar (protected)
router.post('/sync', auth_1.requireAuth, paymentController_1.syncSubscription);
// POST /payment/manual-upgrade - Admin endpoint to manually upgrade user
router.post('/manual-upgrade', auth_1.requireAuth, paymentController_1.manualUpgrade);
exports.default = router;
