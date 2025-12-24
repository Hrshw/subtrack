"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaymentFailure = exports.handlePaymentSuccess = exports.createPaymentSession = void 0;
const PayUService_1 = require("../services/PayUService");
const User_1 = require("../models/User");
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const createPaymentSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { plan = 'annual' } = req.body; // 'monthly' or 'annual'
        const user = yield User_1.User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const paymentData = yield PayUService_1.PayUService.createPaymentSession(user._id.toString(), user.email, plan);
        res.json(paymentData);
    }
    catch (error) {
        console.error('Payment session creation error:', error);
        res.status(500).json({ message: 'Error creating payment session' });
    }
});
exports.createPaymentSession = createPaymentSession;
const handlePaymentSuccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const responseData = req.body;
        console.log('💳 PayU Success Callback received:', responseData.txnid);
        // Verify payment hash
        const isValid = yield PayUService_1.PayUService.verifyPayment(responseData);
        if (!isValid) {
            console.error('❌ Payment verification failed for:', responseData.txnid);
            return res.redirect(`${CLIENT_URL}/payment/failure?reason=verification_failed`);
        }
        // Check payment status
        if (responseData.status !== 'success') {
            console.error('❌ Payment status not success:', responseData.status);
            return res.redirect(`${CLIENT_URL}/payment/failure?reason=payment_not_successful`);
        }
        // Handle successful payment - upgrade user to Pro
        yield PayUService_1.PayUService.handleSuccessfulPayment(responseData);
        // Redirect to frontend success page with transaction details
        const successParams = new URLSearchParams({
            txnid: responseData.txnid || '',
            amount: responseData.amount || '',
            status: 'success'
        });
        res.redirect(`${CLIENT_URL}/payment/success?${successParams.toString()}`);
    }
    catch (error) {
        console.error('Payment success handling error:', error);
        res.redirect(`${CLIENT_URL}/payment/failure?reason=server_error`);
    }
});
exports.handlePaymentSuccess = handlePaymentSuccess;
const handlePaymentFailure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const responseData = req.body;
        console.log('❌ PayU Failure Callback received:', responseData.txnid, responseData.error_Message);
        // Build failure URL with details
        const failParams = new URLSearchParams({
            txnid: responseData.txnid || '',
            reason: responseData.error_Message || responseData.unmappedstatus || 'payment_failed'
        });
        res.redirect(`${CLIENT_URL}/payment/failure?${failParams.toString()}`);
    }
    catch (error) {
        console.error('Payment failure handling error:', error);
        res.redirect(`${CLIENT_URL}/payment/failure?reason=server_error`);
    }
});
exports.handlePaymentFailure = handlePaymentFailure;
