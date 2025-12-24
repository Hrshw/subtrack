"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const paymentController_1 = require("../controllers/paymentController");
const router = express_1.default.Router();
// POST /payment/create-session - Create PayU payment session (protected)
router.post('/create-session', auth_1.requireAuth, paymentController_1.createPaymentSession);
// POST /payment/success - PayU success callback (public - PayU calls this)
router.post('/success', paymentController_1.handlePaymentSuccess);
// POST /payment/failure - PayU failure callback (public - PayU calls this)
router.post('/failure', paymentController_1.handlePaymentFailure);
exports.default = router;
