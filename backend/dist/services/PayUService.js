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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayUService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const Transaction_1 = require("../models/Transaction");
const PAYU_URL = process.env.PAYU_URL || 'https://secure.payu.in';
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || '';
const PAYU_SALT = process.env.PAYU_SALT || '';
class PayUService {
    /**
     * Create PayU payment form data
     * Returns HTML form that auto-submits to PayU
     */
    static createPaymentSession(userId_1, userEmail_1) {
        return __awaiter(this, arguments, void 0, function* (userId, userEmail, plan = 'annual') {
            try {
                const user = yield User_1.User.findById(userId);
                if (!user)
                    throw new Error('User not found');
                // Pricing
                const amount = plan === 'annual' ? '7999' : '799';
                const productInfo = plan === 'annual'
                    ? 'SubTrack Pro - Annual Plan (Save 17%)'
                    : 'SubTrack Pro - Monthly Plan';
                // Generate unique transaction ID
                const txnid = `SUBTRACK_${Date.now()}_${userId.substring(0, 8)}`;
                // PayU required fields
                const paymentData = {
                    key: PAYU_MERCHANT_KEY,
                    txnid,
                    amount,
                    productinfo: productInfo,
                    firstname: user.email.split('@')[0], // Use email username as firstname
                    email: userEmail,
                    phone: '9999999999', // Default - user can update on PayU page
                    surl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/success`, // Success callback to backend
                    furl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/failure`, // Failure callback to backend
                    udf1: userId, // Store userId for webhook processing
                    udf2: plan,
                    udf3: '',
                    udf4: '',
                    udf5: ''
                };
                // Generate hash
                // Hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
                const hashString = `${paymentData.key}|${paymentData.txnid}|${paymentData.amount}|${paymentData.productinfo}|${paymentData.firstname}|${paymentData.email}|${paymentData.udf1}|${paymentData.udf2}|${paymentData.udf3}|${paymentData.udf4}|${paymentData.udf5}||||||${PAYU_SALT}`;
                const hash = crypto_1.default.createHash('sha512').update(hashString).digest('hex');
                console.log(`💳 PayU session created for user ${userId}`);
                console.log(`   Amount: ₹${amount}, Plan: ${plan}, TxnID: ${txnid}`);
                const sessionData = Object.assign(Object.assign({}, paymentData), { hash, payuUrl: `${PAYU_URL}/_payment` });
                // Log initial pending transaction
                yield Transaction_1.Transaction.create({
                    userId,
                    txnid,
                    amount: Number(amount),
                    plan,
                    status: 'pending'
                });
                return sessionData;
            }
            catch (error) {
                console.error('PayU session creation failed:', error);
                throw error;
            }
        });
    }
    /**
     * Verify PayU webhook/response
     * Called after payment completion
     */
    static verifyPayment(responseData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { key, txnid, amount, productinfo, firstname, email, status, hash: receivedHash, udf1, // userId
                udf2, // plan
                udf3, udf4, udf5 } = responseData;
                // Reverse hash for verification
                // Format: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
                const hashString = `${PAYU_SALT}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
                const calculatedHash = crypto_1.default.createHash('sha512').update(hashString).digest('hex');
                if (calculatedHash !== receivedHash) {
                    console.error('❌ PayU hash mismatch!');
                    return false;
                }
                console.log(`✅ PayU payment verified: ${txnid}, Status: ${status}`);
                return status === 'success';
            }
            catch (error) {
                console.error('PayU verification failed:', error);
                return false;
            }
        });
    }
    /**
     * Handle successful payment
     * Upgrade user to Pro
     */
    static handleSuccessfulPayment(responseData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { udf1: userId, udf2: plan, txnid, amount } = responseData;
                if (!userId) {
                    throw new Error('User ID not found in payment response');
                }
                // Update user to Pro
                const user = yield User_1.User.findByIdAndUpdate(userId, {
                    subscriptionStatus: 'pro',
                    // You can add more fields like subscriptionStartDate, subscriptionEndDate, etc.
                }, { new: true });
                if (!user) {
                    throw new Error('User not found');
                }
                console.log(`🎉 User ${userId} upgraded to Pro!`);
                console.log(`   Plan: ${plan}, Amount: ₹${amount}, TxnID: ${txnid}`);
                // Log transaction in database
                yield Transaction_1.Transaction.findOneAndUpdate({ txnid }, {
                    status: 'success',
                    rawResponse: responseData
                }, { upsert: true });
                return user;
            }
            catch (error) {
                console.error('Failed to handle successful payment:', error);
                throw error;
            }
        });
    }
    /**
     * Handle failed payment
     * Log failure reason
     */
    static handleFailedPayment(responseData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { txnid, error_Message, unmappedstatus } = responseData;
                yield Transaction_1.Transaction.findOneAndUpdate({ txnid }, {
                    status: 'failure',
                    errorMessage: error_Message || unmappedstatus || 'Payment failed',
                    rawResponse: responseData
                }, { upsert: true });
                console.log(`❌ Transaction ${txnid} marked as failure: ${error_Message}`);
            }
            catch (error) {
                console.error('Failed to log payment failure:', error);
            }
        });
    }
}
exports.PayUService = PayUService;
